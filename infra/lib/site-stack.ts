import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export interface SiteStackProps extends cdk.StackProps {
  domainName: string;
  fromAddress: string;
  toAddress: string;
  siteDist: string;
}

export class SiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SiteStackProps) {
    super(scope, id, props);
    const { domainName, fromAddress, toAddress, siteDist } = props;
    const wwwName = `www.${domainName}`;

    // DNS and certificate (CloudFront requires the certificate in us-east-1, which this stack uses).
    const zone = route53.HostedZone.fromLookup(this, "Zone", { domainName });
    const certificate = new acm.Certificate(this, "Certificate", {
      domainName,
      subjectAlternativeNames: [wwwName],
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // Private bucket for the built site. Only CloudFront can read it.
    const bucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Contact form: Lambda that sends email through SES.
    const contactFn = new lambda.Function(this, "ContactFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      handler: "contact.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: { FROM_ADDRESS: fromAddress, TO_ADDRESS: toAddress },
      logGroup: new logs.LogGroup(this, "ContactLogs", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
    contactFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail"],
        resources: [`arn:aws:ses:${this.region}:${this.account}:identity/*`],
      }),
    );

    // HTTP API with throttling, served through CloudFront at /api/* (same origin, so no CORS needed).
    const api = new apigw.HttpApi(this, "ContactApi", { apiName: "personal-website-contact" });
    api.addRoutes({
      path: "/api/contact",
      methods: [apigw.HttpMethod.POST],
      integration: new HttpLambdaIntegration("ContactIntegration", contactFn),
    });
    const stage = api.defaultStage!.node.defaultChild as apigw.CfnStage;
    stage.defaultRouteSettings = { throttlingBurstLimit: 10, throttlingRateLimit: 2 };
    const apiDomain = cdk.Fn.select(2, cdk.Fn.split("/", api.apiEndpoint));

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: `${domainName} personal website`,
      domainNames: [domainName, wwwName],
      certificate,
      defaultRootObject: "index.html",
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        compress: true,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new origins.HttpOrigin(apiDomain, { protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
    });

    // parthkharkar.com and www.parthkharkar.com both point at CloudFront.
    const target = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution));
    for (const [id, recordName] of [["Apex", domainName], ["Www", wwwName]]) {
      new route53.ARecord(this, `${id}A`, { zone, recordName, target });
      new route53.AaaaRecord(this, `${id}Aaaa`, { zone, recordName, target });
    }

    // Upload the built site and clear the CDN cache on every deploy.
    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [s3deploy.Source.asset(siteDist)],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
      memoryLimit: 512,
    });

    new cdk.CfnOutput(this, "SiteUrl", { value: `https://${domainName}` });
    new cdk.CfnOutput(this, "CloudFrontUrl", { value: `https://${distribution.distributionDomainName}` });
    new cdk.CfnOutput(this, "ApiEndpoint", { value: api.apiEndpoint });
  }
}
