# Final testing - 8 November 2026

Source: midterm_ANNOTATED.pdf p5 (A3). Page 8 lists priority requirements R1/R3/R6,
not success criteria. The original numerical targets must stay unchanged.

| Original criterion | Target | Stage 2 result | Final result | Met? |
|---|---|---|---|---|
| Customer can place order in less than 2 minutes | Human time <120s | No timed human evidence; slides list functional tasks | Browser journey works. Team reports participants tested without a timer | Timing pending |
| Unavailable product cannot enter a new order | Zero accepted unavailable orders | API rejection reported | API rejects disabled products and public menu hides them | Automated pass; record human observation |
| Main interface works at width 360px | Complete ordering flow, no document overflow | Supplied last pages measured 375px | New automated mobile checks explicitly include 360px | Automated pass; record human observation |

The team reports sessions with Medet, Nurdaulet and Iskander. No completion times
were measured. Do not infer timings or individual pass rates from automation.

## Short final retest

Each person starts in an isolated browser with a 360px viewport. Do not coach them.
Start the timer when they begin the menu task and stop when a saved confirmation
appears. Find Cheeseburger, add it, adjust quantity, remove an extra item, enter a
pickup name, submit and find Ready after a facilitator updates the staff view.
Record help, errors, duration and main action count separately.

Negative test: add a separate enabled Test Tea to the cart. Staff disable it before
submission. Checkout must reject it and create no order. Refresh hides the item.

| Participant code | Actual device/browser/viewport | Time, s | Errors/help | Disabled rejection | Full 360px flow | Date |
|---|---|---|---|---|---|---|
| U1 (Medet) | To record | Not measured | To record | To record | To record | To record |
| U2 (Nurdaulet) | To record | Not measured | To record | To record | To record | To record |
| U3 (Iskander) | To record | Not measured | To record | To record | To record | To record |

Retain unsuccessful sessions and explain them. Use fictitious pickup names and do
not record contact details. Update final PDF and slides only after recording real values.
