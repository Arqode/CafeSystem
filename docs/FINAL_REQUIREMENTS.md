# Final requirement status

R12-R15 priorities below are clarified for final assessment: the original NFRs omitted
priority. Stage 1 functional priorities stay unchanged. Stage 2 column is historical.

| ID | Requirement | Priority | Stage 2 | Final | Check/evidence |
|---|---|---|---|---|---|
| R1 | View menu | Must | Done | Done | Enabled products; A1-1 screenshot/browser test |
| R2 | View prices | Must | Done | Done | KZT on menu/cart; compare API |
| R3 | Add product | Must | Done | Done | Repeated add updates quantity, total, feedback |
| R4 | Remove product | Must | Done | Done | Remove one of two; recalculate total |
| R5 | Change quantity | Should | Done | Done | 1-50; persists on reload |
| R6 | Place order | Must | Done | Done | Transaction, DB price; five retries create one order |
| R7 | View status | Should | Done | Done | Token-protected receipt sees Ready |
| R8 | Staff see orders | Must | Done | Done | Login/list; guest 401 |
| R9 | Staff update status | Must | Done | Done | Valid flow; rejected skipped step |
| R10 | Staff add/edit products | Should | Done | Done | Create/edit; whole positive KZT |
| R11 | Disable product (reconstructed) | Priority unconfirmed | Inferred done | Function done; wording unresolved | Hidden menu product; checkout rejected |
| R12 | Menu/cart <2s | Must, clarified | 1.411s/1.208s ready, CDP Nov 1 | Current performance.json | 375x812 DPR1, cache off, Fast 4G, 3 runs/screen |
| R13 | HTTPS | Must, clarified | Local only | Local TLS works; public trust pending | Self-signed 4443; Caddy domain profile |
| R14 | Order <=5 main actions | Must, clarified | Four actions without name entry | Five including name; human observation pending | Menu, Add, Cart, name, submit |
| R15 | Availability >=99% | Must, clarified | Unmeasured | Monitor supplied; long-term unmeasured | tools/monitor.mjs; declare period and account for outages |

R11 remains cropped in the supplied source. R13 needs trusted deployment evidence,
R14 needs recorded human action counts, R15 needs an agreed observation period.
Configuration alone does not close those evidence gaps.
