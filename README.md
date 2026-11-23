# Kisero.org

A responsive sailing log for KISERO, a Beneteau First 27 SE sailing out of Puerto Banús, Spain. The site includes boat status, season summaries, a trip list, and detailed trip pages.

## Files

- `index.html` — boat status and sailing log
- `trip.html` — existing detailed sample trip page
- `logbook.html` — API-backed public exact-track logbook
- `styles.css` — legacy responsive styling retained for reuse
- `favicon.svg` — browser icon
- `amplify.yml` — AWS Amplify Hosting configuration
- `assets/home-snapshot.js` — shared cache and browser fallback for the homepage
- `scripts/refresh-home-seed.mjs` — refreshes the public fallback during an Amplify build
- `site-deploy.zip` — `index.html`, `trip.html`, `styles.css`, and `favicon.svg`, retained for manual deployment or backup

## Publish with AWS Amplify Hosting

AWS Amplify is connected to this repository's `main` branch. Every push to `main` starts a build and deploys the site automatically. Amplify refreshes the bundled public homepage snapshot at build time and publishes the repository root. These settings are in `amplify.yml`.

Make and commit changes in your local clone, then push them to `main`. The Amplify GitHub App is scoped to `kisero/kisero.org` for this deployment.

Production is [kisero.org](https://kisero.org/), served by the Git-connected Amplify app.

## Local preview

Open `index.html` directly in a browser. The page has no build-time dependencies; the typefaces load from Google Fonts when a visitor is online and fall back to system fonts otherwise.

## Motion alarm

The hero's Alarm badge links to the live movement chart at `/#motion`.
`assets/alarm.js` loads the last 24 hours of actual events and subscribes to the
read-only AWS WebSocket feed. Reconnects refresh the chart history. The homepage shows the last confirmed Pi update time. The public motion timeline and recent activity list only show events recorded while armed; disarming closes any active movement segment and leaves subsequent time gray. Raw sensor events remain archived. Displayed on/off state is the
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
hides the tooltip. It uses original samples, not interpolated measurements. Dense views show continuous lines with markers only for isolated
readings and the selected hover point. This keeps the weekly and monthly
trends legible while preserving recorded gaps.

The footer uses four flag buttons with accessible language names instead of a
select menu. Its GitHub text and links are 14px and share one desktop row with
the attribution and flags; smaller screens wrap naturally. The motion card lists
only the three latest events; its timeline still uses the full recent history.
The two status cards use the same desktop grid height so their bottom edges align.

The hero removes live wind and sea-temperature tiles. A compact right-aligned temperature/humidity badge sits immediately before the
moored and alarm badges and links to the cabin chart. The sensor freshness
report sits directly below all three badges, grouped together at the bottom right of the hero and links to the internet timeline. The boat name and description align to the upper left; smaller screens stack the identity above the telemetry. Its right-side boat button shows only
`Moored (location)` or `Sailing (location)` and opens the location map. The button uses the latest coarse GPS state from the public homepage
snapshot. The map uses the last recorded public trip endpoint.

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

## Status freshness
The hero uses the latest authenticated Pi heartbeat received by AWS. Historical
connectivity intervals use the timeline's existing 90-second grace period.
Cabin readings warn in red after ten minutes with their last observation time.
Connectivity never changes the observation time of a position or cabin reading.

The pages opt out of browser machine translation (`google=notranslate` and the `notranslate` root class). The site's flag selector owns the displayed language, including asynchronous readings; browser translation otherwise rewrites only parts of an already translated page back into the browser's preferred language. This class does not disable the site's own translation engine.

The motion timeline has the same custom tooltip styling as the cabin chart. Hover or tap anywhere for the local date/time and recorded activity; movement segments show their start/end, and siren markers show the exact trigger timestamp. Gray periods say no recorded alarm activity rather than claiming the sensor detected no movement. Keyboard focus supports five-minute left/right steps, Home/End and Escape.

## Homepage snapshot

The homepage renders the last confirmed cabin readings, boat state, alarm state,
and sailing totals from a snapshot saved by the browser or bundled with the
Amplify build. While the tab is visible, the browser checks the shared
`GET /v1/home` cache every 15 seconds. This refreshes the display from data
already stored in AWS. The detailed charts load when they come into view.

The homepage label shows the most recent Pi heartbeat timestamp received by
AWS, in the visitor's local time. The last readings and update time stay visible
if a refresh fails, and the label advances when a newer heartbeat arrives. The
Pi normally reports a heartbeat every 30 seconds and samples the cabin every
five minutes.

The private alarm page uses the live control API. See the
[backend snapshot documentation](https://github.com/kisero/raspberry-pi-kisero/blob/main/ARCHITECTURE.md#homepage-snapshot).
