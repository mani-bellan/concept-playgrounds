# Metric Court

A playful primer on why two dashboards show different numbers, and how a shared metric definition (a semantic layer) stops it. One idea runs through it: a metric is a recipe, and every recipe answers four questions: what do we count, what's left out, counted at what level, and over what period.

- **Warm-up: Sam's party.** The caterer, the host, and the photographer each give a different headcount. Guess who is right, then switch between their counts to see exactly which guests each one counted.
- **Course.** Five short chapters, one per question plus "Agree once: the semantic layer". Each has an everyday example, a data example, linked cases, a 2-question check, and sources.
- **Cases.** Eight disputes. Make your call, then flip recipe switches until your number matches each team: March revenue, a fan-out join, three definitions of active users, Sunday vs Monday weeks, customer vs revenue churn, an average of averages, late-arriving data, and an AI assistant that guesses business rules. "Show the SQL" shows the query behind your recipe.
- **Build a metric.** Answer the four questions to define revenue, match Finance, publish to the semantic layer, and watch three dashboards agree. Export the definition as dbt MetricFlow YAML (dbt 1.12 style).
- **Progress.** 37 points, nine badges, and a share card. Progress stays in the browser; nothing is tracked.

Day mode is the default with a Night mode toggle. Money shows in the visitor's own currency and number format.

It is a static site with no build step and no dependencies:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Code

- `src/data.js`: the party, the eight cases (rows, switches, team recipes, claims, copy, SQL), and Build a metric's orders
- `src/metrics.js`: how a case's rows become its number under a recipe, Build a metric totals, the MetricFlow export, and number formats
- `src/chapters.js`: course chapters, quizzes, and sources
- `src/progress.js`: points, badges, and toasts, stored in localStorage
- `src/app.js` (entry, warm-up, routing), `src/cases.js`, `src/course.js`, `src/build.js`, `src/profile.js`, `src/ui.js`
- `src/styles.css`: Day and Night palettes (amber is what you change, coral is left out, green is solved)

## Content accuracy

`node --test tests/` checks that every number a case or quiz states is what its data computes, that every case is solvable with its switches, that verdicts agree with answers, that chapters link every case, and that Build a metric has exactly one recipe that matches Finance. Run it after editing `src/data.js` or `src/chapters.js`.
