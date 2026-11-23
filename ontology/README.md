# Ontology Playground

A playful, interactive way for technologists to learn what an ontology is.

- **Overview**: a plain-English 30-second intro, a 3-step learning path, the four core ideas, and a jargon decoder.
- **Course**: six short chapters (about 27 minutes). Learners pick everyday or tech examples, then each chapter gives a lesson, a worked example, links to the matching missions and Detective cases, and a 3-question check.
- **Build a World**: six guided missions take a beginner from a blank canvas to their first inference and contradiction. Add classes, individuals, and properties, then run a small reasoner that draws inferred facts as dashed edges and explains each one. The OWL tab shows your world in Turtle syntax.
- **Ontology Detective**: six puzzles (inheritance, domain and range, transitivity, inverses, disjointness, and a combined case), each with a "New idea" explainer and an optional hint. Predict the answer, then step through the reasoner's proof on the graph.
- **Progress**: points for cases, missions, and chapter checks, nine badges, and a shareable result card (image, LinkedIn, X). Progress is stored in the browser.

It is a static site with no build step and no dependencies. Serve the folder with any static server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Code

- `src/ontology.js`: the reasoner (subclass chains, inheritance, domain, range, transitivity, inverses, disjointness), explanations, and Turtle export
- `src/graph.js`: SVG graph rendering with draggable nodes
- `src/sandbox.js`: Build a World
- `src/detective.js`: Ontology Detective
- `src/progress.js`: score, badges, and toasts shared by every view
- `src/profile.js`: the progress panel and share card
- `src/chapters.js`: course chapters, with everyday and tech versions of each lesson and example
- `src/course.js`: the Course tab
- `src/nav.js`: view switching and the Back to chapter bar
- `src/data.js`: sandbox presets, Detective levels, and guided missions; add a level by appending to `levels`
