# parthkharkar.com

Personal website for Parth Kharkar. A single-page React site with a Three.js particle scene and smooth scrolling, hosted on S3 and CloudFront, with a serverless contact form (API Gateway, Lambda, SES).

```
site/      React + Vite frontend. All text lives in site/src/content.ts
infra/     AWS CDK app (TypeScript) and the contact form Lambda
.github/   GitHub Actions workflow that deploys on every push to main
```

## Architecture

```
Browser ── parthkharkar.com ──> CloudFront ──> S3 (built site)
                                    │
                                    └── /api/contact ──> API Gateway (throttled) ──> Lambda ──> SES ──> inbox
```

The API sits behind CloudFront on the same domain, so the form needs no CORS setup and no build-time API URL.

## Run locally

```bash
cd site
npm install
npm run dev
```

Open http://localhost:5173. Once the site is deployed, the local contact form posts to the live API through the Vite proxy.

## First deploy

Prerequisites: the domain is registered in Route 53, the SES domain identity shows **Verified**, `toAddress` in `infra/cdk.json` is a verified SES email identity, and `cdk bootstrap` has been run.

```bash
aws sso login --sso-session parth-website

cd infra
npm install
npm run deploy
```

The first deploy takes about 10 to 20 minutes, mostly CloudFront and the certificate. When it finishes, it prints `SiteUrl`, `CloudFrontUrl`, and `ApiEndpoint`.

After the first deploy, commit the generated `infra/cdk.context.json` file so GitHub Actions reuses the hosted zone lookup.

## Auto-deploy from GitHub

1. Create the GitHub repo `Parrthh/personal-website` (or change `githubRepo` in `infra/cdk.json`) and push this code.
2. Deploy the GitHub access role once:
   ```bash
   cd infra
   npm run deploy:github
   ```
   If it fails because a GitHub OIDC provider already exists in the account, run
   `npx cdk deploy PersonalWebsiteGithubStack --profile personal-website -c createOidcProvider=false`.
3. Every push to `main` now builds and deploys the site. No AWS keys are stored in GitHub.

## Updating content

Edit `site/src/content.ts`, commit, and push. The site redeploys in a few minutes.

## Configuration (`infra/cdk.json`)

| Key | Meaning |
|---|---|
| `account` | AWS account ID |
| `domainName` | Site domain (Route 53 hosted zone) |
| `fromAddress` | Sender address on the verified SES domain |
| `toAddress` | Inbox that receives form messages (must be verified while SES is in sandbox mode) |
| `githubRepo` | `owner/repo` allowed to deploy through GitHub Actions |
