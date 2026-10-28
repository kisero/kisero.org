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

## Sustained sailing speed

The sailing table and logbook show **Avg / Sustained / Max SOG** in knots.
`assets/sailing-stats.js` derives sustained SOG from the original API GPS track,
before chart aggregation: take every overlapping sequence of three adjacent
readings, require exactly 15 seconds between each pair, average their SOGs, and
choose the highest unrounded mean. Round only for display to one decimal.
Three readings at t, t+15 and t+30 span 30 seconds between first and last.
Invalid/missing samples, duplicate timestamps and longer gaps break a sequence;
fewer than three valid consecutive readings yields an em dash. Average and
instantaneous maximum retain their existing definitions. The calculation applies
to existing and future trips without rewriting archived logs or changing the API.

## Languages, footer and sensor chart

Every HTML page includes the footer's GitHub links to the website and Raspberry
Pi repositories, plus an English / Español / Hrvatski / Slovenčina selector.
The choice persists in browser storage; `?lang=en|es|hr|sk` also sets the language
and works when storage is unavailable. Changing language preserves trip IDs and
private URL fragments. No translation service or new backend is used.

`assets/translations.js` contains the English source strings and all three
translations, including parameterised live messages. `assets/i18n.js` applies
these to text, chart SVGs, tooltips, page titles and accessibility labels,
including later live updates, without replacing interactive elements. Dates use
the selected locale; measurements use local decimal separators. Place names,
boat identifiers, GPS coordinates and standard nautical abbreviations retain
their original form. Add new user-facing copy to the catalog when editing pages.

The cabin chart supports pointer hover, touch and keyboard focus. Each position
selects the closest actual sample by timestamp and shows its date/time,
temperature and humidity, with a vertical guide and markers on both series.
Left/right arrows move between samples; Home/End select the first/last, Escape
hides the tooltip. It uses original samples, not interpolated measurements.

The footer uses four flag buttons with accessible language names instead of a
select menu. Its GitHub text and links are 14px and share one desktop row with
the attribution and flags; smaller screens wrap naturally. The motion card lists
only the three latest events; its timeline still uses the full recent history.
The two status cards use the same desktop grid height so their bottom edges align.

The hero removes live wind and sea-temperature tiles. A compact right-aligned temperature/humidity badge sits immediately before the
moored and alarm badges and links to the cabin chart. The sensor freshness
report sits below all three badges and links to the internet timeline. Its right-side boat button shows only
`Moored (location)` or `Sailing (location)` and opens the location map. The current
state is explicitly configured in `assets/boat-status.json` as moored at Puerto
Banús; it is not inferred from an old sailing session. Automatic live state
changes require connecting the GPS publisher. The button's tooltip identifies
this limitation, and the map uses the last GPS endpoint rather than the start of
an old trip. Future boat status changes should update this source or replace it
with an authenticated GPS feed.


## Internet timeline and compact telemetry

The freshness-report link scrolls to a 24-hour internet timeline matching the
combined width and outer edges of the two sensor cards above.
`assets/connectivity.js` uses the authenticated Pi heartbeat receipt history
included in `/v1/alarm` and its live WebSocket updates. Green means a successful
Pi→AWS contact within the 90-second grace period; red means no contact; gray
means no data, including time before monitoring began. Missing contact can also
mean the Pi is powered off. If the viewer loses its own live data feed, the
unobserved tail is unknown rather than fabricated as a Pi outage. No outage log
is shown. Backend storage and deployment live in `raspberry-pi-kisero`.

Temperature/humidity and movement cards share equal desktop heights, with only
three recent movement events. Extra last-contact, sensor-history and place-data
paragraphs were removed from the visible page; timestamps remain in tooltips
and the raw API data. Sensor sample age and internet reachability are separate.
