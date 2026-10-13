# Kisero.org

A responsive sailing log for KISERO, a Beneteau First 27 SE sailing from Pula, Croatia. The site includes boat status, season summaries, a trip list, and detailed trip pages.

## Files

- `index.html` — boat status and sailing log
- `trip.html` — detailed trip page
- `styles.css` — legacy responsive styling retained for reuse
- `favicon.svg` — browser icon
- `amplify.yml` — buildless AWS Amplify Hosting configuration
- `site-deploy.zip` — `index.html`, `trip.html`, `styles.css`, and `favicon.svg`, packaged for an Amplify manual deployment

## Publish with AWS Amplify Hosting

The repository is public, so Amplify can retrieve the deployment archive from its raw GitHub URL without GitHub account authorization. This keeps deployment access limited to this repository's public artifact and avoids long-lived AWS credentials.

1. In AWS, create a new Amplify app using **Deploy without Git** and name it `kisero-org`.
2. Set the branch name to `main`, choose **Any URL**, and use `https://raw.githubusercontent.com/kisero/kisero.org/main/site-deploy.zip` as the resource URL.
3. Choose **Save and deploy**.
4. In **Hosting → Custom domains**, add `kisero.org` and map `www` to the `main` branch. Use Amplify's generated DNS values; do not guess the target hostname.
5. In GoDaddy DNS, replace the existing `www` CNAME that points to `kisero.org` with the exact `www` CNAME target Amplify provides. Add any new certificate-validation CNAME that Amplify provides, keeping the record name and value exactly as shown. Leave the existing root A record and other DNS records untouched.
6. Wait for the Amplify custom-domain status to show **Available** and then verify `https://www.kisero.org`.

Amplify manual deployments do not automatically start when a commit is pushed. After changing the site files, rebuild `site-deploy.zip`, commit and push it, then start a new deployment in Amplify using the same URL.

AWS Amplify's custom-domain setup and certificate validation can take time to propagate. Its usage-based hosting and build charges depend on traffic and build minutes; review current AWS pricing before enabling hosting.

## Local preview

Open `index.html` directly in a browser. The page has no build-time dependencies; the typefaces load from Google Fonts when a visitor is online and fall back to system fonts otherwise.
