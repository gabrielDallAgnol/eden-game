# Eden: working rules

Read `docs/PLAN.md` before doing anything. It has the state of the code, how to run and test it, the traps, and the ordered phases. `docs/ARCHITECTURE.md` has the two design rules and the target model.

## The two rules

1. **Causes decide what, where and when.** Never gate anything on a timer, a head count or a settlement level. A thing happens because someone felt a want and the means were at hand.
2. **Fixed forms decide how it sits on the ground.** Lots on a lattice, ways between them, building footprints, construction stages.

If you add a planned rule, list it under "Planned on purpose" in `docs/ARCHITECTURE.md` and tell the owner plainly.

## Working

- Serve with `python3 serve.py` (no-cache). Game at `/index.html`, tests at `/tests.html`.
- No build step, no dependencies, no Node (it is broken on this machine; ask before fixing).
- `src/sim.js` and `src/view.js` have very long lines. Never put a `//` comment in the middle of one; use its own line or `/* */`.
- Every step: tests show 0 failed, the standard 100-year table is added to `docs/RUNS.md`, the game loads without console errors, one commit, pushed to `main`.
- Do not edit `legacy/`.
- Sprite generation costs money and is at $7.48 of an $8.00 cap. Ask first. The key is in `art/.rd_key` and must never be committed or printed.

## Reporting

The owner reads results, not steps. Say what changed, what you checked and how, and what is not done. Give numbers from runs, not impressions.
