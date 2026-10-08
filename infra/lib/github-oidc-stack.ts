import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export interface GithubOidcStackProps extends cdk.StackProps {
  githubRepo: string; // "owner/repo"
  createOidcProvider: boolean;
}

// Lets GitHub Actions deploy the site with short-lived credentials (no stored AWS keys).
export class GithubOidcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GithubOidcStackProps) {
    super(scope, id, props);
    const host = "token.actions.githubusercontent.com";

    const provider = props.createOidcProvider
      ? new iam.OpenIdConnectProvider(this, "GithubProvider", { url: `https://${host}`, clientIds: ["sts.amazonaws.com"] })
      : iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
          this,
          "GithubProvider",
          `arn:aws:iam::${this.account}:oidc-provider/${host}`,
        );

    const role = new iam.Role(this, "DeployRole", {
      roleName: "personal-website-github-deploy",
      description: "Assumed by GitHub Actions to deploy the personal website",
      maxSessionDuration: cdk.Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: { [`${host}:aud`]: "sts.amazonaws.com" },
        StringLike: { [`${host}:sub`]: `repo:${props.githubRepo}:ref:refs/heads/main` },
      }),
    });

    // Same least-privilege idea as your CLI user: it can only use the CDK bootstrap roles.
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["sts:AssumeRole"],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      }),
    );

    new cdk.CfnOutput(this, "DeployRoleArn", { value: role.roleArn });
  }
}
