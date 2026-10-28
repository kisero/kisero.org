# Kisero.org

A responsive sailing log for KISERO, a Beneteau First 27 SE sailing from Pula, Croatia. The site includes boat status, season summaries, a trip list, and detailed trip pages.

## Files

- `index.html` — boat status and sailing log
- `trip.html` — existing detailed sample trip page
- `logbook.html` — API-backed public exact-track logbook
- `styles.css` — legacy responsive styling retained for reuse
- `favicon.svg` — browser icon
- `amplify.yml` — buildless AWS Amplify Hosting configuration
- `site-deploy.zip` — `index.html`, `trip.html`, `styles.css`, and `favicon.svg`, retained for manual deployment or backup

## Publish with AWS Amplify Hosting

AWS Amplify is connected to this repository's `main` branch. Every push to `main` starts a build and deploys the site automatically. The site is plain HTML and CSS, so Amplify publishes the repository root without a build command; these settings are in `amplify.yml`.

Make and commit changes in your local clone, then push them to `main`. The Amplify GitHub App is scoped to `kisero/kisero.org` for this deployment.

The `kisero.org`, `www.kisero.org`, and `test.kisero.org` hostnames are mapped to the `main` branch in the Git-connected app. Finish the domain's nameserver update at the registrar and wait for Amplify's managed certificate and domain status to become available before relying on the custom domain. The Amplify Hosting URL is available while DNS propagates.

## Local preview

Open `index.html` directly in a browser. The page has no build-time dependencies; the typefaces load from Google Fonts when a visitor is online and fall back to system fonts otherwise.

## Motion alarm

The hero's Alarm badge links to the live movement chart at `/#motion`.
`assets/alarm.js` loads the last 24 hours of actual events and subscribes to the
read-only AWS WebSocket feed. Reconnects refresh the snapshot; an offline Pi is
identified after 90 seconds without a heartbeat. Displayed on/off state is the
Pi's last confirmed setting; requested changes are shown as pending until applied.

`alarm.html` is unlinked and noindex. Its URL fragment must contain the private
control capability generated on the Pi; no secret is embedded in this repository.
The public page cannot arm/disarm. Keep the complete private link confidential.
The Pi implementation, AWS template, wiring and deployment instructions are in
`kisero/raspberry-pi-kisero`.
