# Final user testing

Three people outside the team tried ordering on their own devices. The results
below were supplied by the team. All three finished within the 120-second target.
The average was 27 seconds. None reported a problem during these tasks.

| Participant | Device and browser | Order time | Problems reported | Disabled product blocked | Interface worked |
|---|---|---:|---|---|---|
| U1 | iPhone, Safari | 31 s | None | Yes | Yes |
| U2 | Windows PC, Google Chrome | 24 s | None | Yes | Yes |
| U3 | Android phone, Google Chrome | 26 s | None | Yes | Yes |

The notes do not include the test dates, device models, viewport widths or whether
any help was given. These details have not been filled in retrospectively.

## Comparison with Stage 1

The criteria come from annotated Stage 1, page 5. The three priority functions on
page 8 are a separate list.

| Criterion | Target | Stage 2 evidence | Final result |
|---|---|---|---|
| Place an order | Less than 120 seconds | No recorded human times | 31, 24 and 26 seconds; all three met the target |
| Prevent orders for unavailable products | No unavailable product accepted | API rejection | All three reported that the product was blocked; API checks also pass |
| Ordering interface works at 360 px | Complete usable ordering flow | Earlier measurements used 375 px | All three reported a working interface; automated checks pass at 360 px. Human viewport widths were not recorded |

These short sessions support the tested tasks. They do not show that the application
has no bugs. The three previously fixed interface problems were engineering
findings, not problems attributed to these participants.

## Evidence

`output/evidence/user-tests.json` stores these results. Automated checks are kept
separately in `api-tests.json`, `browser-tests.json` and `final-checks.json`.
