# Metric Court (prototype)

A playful primer on why two dashboards show different numbers, and how a shared metric definition (a semantic layer) stops it.

- **Warm-up: the party.** The caterer, the host, and the photographer each give a different headcount. Guess who is right, then switch between their counts to see exactly which guests each one counted. It ends with the four questions every metric answers.
- **Case 01: March revenue.** Sales says $4,200, Finance says $3,800, from the same 12 orders. Make a call, then flip three recipe switches (refunds, test orders, company timezone) until your number matches Finance. The gap bar splits the difference by cause, and "Show the SQL" shows the query your recipe implies.

Day mode is the default and Night mode is one click away; the choice is saved in the browser. Money shows in the visitor's own currency and number format. Nothing is tracked.

It is a static site with no build step and no dependencies:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Code

- `src/data.js`: the party guests and Case 01 orders, plus the numbers the copy claims
- `src/metrics.js`: how each person counts guests, order revenue under a recipe, and locale-aware money
- `src/app.js`: rendering and interaction
- `src/styles.css`: Day and Night palettes (amber is what you change, coral is left out, green is solved)

`node --test tests/` checks that every number stated in the copy comes from counting the data. Run it after editing `src/data.js`.
