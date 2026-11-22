# Ontology Playground

A playful, interactive way for technologists to learn what an ontology is.

- **Learn**: the four core ideas (classes, individuals, properties, inference) on one page.
- **Build a World**: add classes, individuals, and properties, connect them, and run a small reasoner that draws inferred facts as dashed arrows and explains each one. It flags contradictions, and "Behind the scenes" shows your world as OWL in Turtle syntax.
- **Ontology Detective**: six short puzzles (inheritance, domain and range, transitivity, inverses, disjointness, and a combined case). Predict the answer, then step through the reasoner's proof on the graph.

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
- `src/data.js`: sandbox presets and Detective levels; add a level by appending to `levels`
