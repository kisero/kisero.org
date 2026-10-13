# Kisero.org

A small, responsive static landing page for Kisero. The current page is an intentionally simple launch page; its copy can be replaced when the site's purpose and content are ready.

## Files

- `index.html` — page content and metadata
- `styles.css` — responsive visual styling
- `favicon.svg` — browser icon
- `amplify.yml` — buildless AWS Amplify Hosting configuration

## Publish with AWS Amplify Hosting

1. In AWS, open **AWS Amplify** and create a new app using **GitHub** as the source.
2. Authorize AWS Amplify to access the `kisero/kisero.org` repository, then choose the `main` branch.
3. Keep the build settings in this repository. Amplify will publish the static files from the repository root and deploy each later commit to `main`.
4. In **Hosting → Custom domains**, add `kisero.org` and map `www` to the production branch. Use Amplify's generated DNS values; do not guess the target hostname.
5. In GoDaddy DNS, replace the existing `www` CNAME that points to `kisero.org` with the exact `www` CNAME target Amplify provides. Add any new certificate-validation CNAME that Amplify provides, keeping the record name and value exactly as shown. Leave the existing root A record and other DNS records untouched unless the site is deliberately being moved there too.
6. Wait for the Amplify custom-domain status to show **Available** and then verify `https://www.kisero.org`.

AWS Amplify's custom-domain setup and certificate validation can take time to propagate. Its usage-based hosting and build charges depend on traffic and build minutes; review current AWS pricing before enabling hosting.

## Local preview

Open `index.html` directly in a browser. The page has no build-time dependencies; the typefaces load from Google Fonts when a visitor is online and fall back to system fonts otherwise.
