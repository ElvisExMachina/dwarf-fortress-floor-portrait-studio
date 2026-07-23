# Implementation record

## Architecture

A Vite React/TypeScript shell owns project state. Pure modules handle rasterization, compact runs, quantization, rendering, and exports. Canvas 2D keeps editing responsive through 100×100 cells.

## Public texture pipeline

1. `scripts/material-palette.mjs` defines 115 material labels, categories, IDs, and representative colors.
2. `scripts/generate-materials.mjs` uses deterministic seeded algorithms to create original category-specific 48×48 textures.
3. The generator writes `public/materials/*.png`, `public/materials/catalog.json`, and `src/data/materials.generated.ts`.
4. Every texture hash is recorded in the public catalog and covered by tests.
5. No reference image is required or included.

## Delivery sequence

1. Generate and test the material catalog.
2. Exercise grid/history/drawing primitives and import validation.
3. Verify image quantization and both render modes.
4. Verify every export, with special attention to staged Quickfort material-filter semantics.
5. Run typecheck, lint, build, and dependency audit.
6. Build the static release archive and checksum.
7. Run independent release QA before tagging.
