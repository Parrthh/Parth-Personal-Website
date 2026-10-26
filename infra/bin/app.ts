#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { SiteStack } from "../lib/site-stack";
import { GithubOidcStack } from "../lib/github-oidc-stack";

const app = new cdk.App();
const ctx = (key: string) => app.node.getContext(key) as string;
const env = { account: ctx("account"), region: "us-east-1" };

const siteDist = path.join(__dirname, "../../site/dist");
if (!fs.existsSync(path.join(siteDist, "index.html"))) {
  throw new Error("site/dist is missing. Run `npm run build` inside the site folder first.");
}

new SiteStack(app, "PersonalWebsiteStack", {
  env,
  domainName: ctx("domainName"),
  fromAddress: ctx("fromAddress"),
  toAddress: ctx("toAddress"),
  siteDist,
});

new GithubOidcStack(app, "PersonalWebsiteGithubStack", {
  env,
  githubRepo: ctx("githubRepo"),
  githubSubjectPrefix: app.node.tryGetContext("githubSubjectPrefix"),
  createOidcProvider: String(app.node.tryGetContext("createOidcProvider")) !== "false",
});

cdk.Tags.of(app).add("project", "personal-website");
