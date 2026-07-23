# Independent QA Plan

## Release blockers

1. Material catalog is exactly 115 entries: 83 Stone, 3 Glass, 3 Ceramic, and 26 Metal.
2. A clean `npm run generate:materials` succeeds with no reference image and produces 115 opaque, non-flat, unique 48×48 PNGs.
3. A second unchanged generation produces the same per-texture SHA-256 values.
4. Public source, generated catalog, screenshots, and release archive contain no prototype source-sheet pixels, source path/hash, crop metadata, or machine-specific `/Users/...` path.
5. Width and height reject values outside 1–100; 100×100 creates exactly 10,000 cells without hanging.
6. Pencil, eraser, fill, eyedropper, line, and rectangle tools affect intended cells. Undo and redo restore exact prior states.
7. Color and Texture render modes work; grid and fit/zoom controls remain usable.
8. AI import accepts compact horizontal runs, fills omitted cells with background, applies later overlaps last, and rejects invalid data without partial mutation.
9. Ordered tile CSV has one row per cell in row-major order. Human order/row/column are 1-based; x/y are zero-based.
10. Build-run CSV compacts only adjacent horizontal cells of the same material.
11. PNG and JSON exports are non-empty; exported JSON round-trips to the same grid.
12. Material search and category filters return correct cards and keep selection understandable.
13. Browser console has no errors on load, edit, AI import, or export.
14. Layout works at desktop and narrow widths without canvas/control overlap.
15. Quickfort opens on a harmless `#notes` README, uses explicit filter-first labels, warns about metal bars, and expands to exactly one floor construction per portrait cell.
16. `npm run verify` passes.
17. `npm audit --omit=dev --audit-level=high` reports zero blocking vulnerabilities.
18. `npm run release:package` creates a static ZIP, `RUN.txt`, license/notices, and a matching `SHA256SUMS` entry.
19. GitHub Actions uses locked npm dependencies and the supported pinned Node runtime.
20. Independent QA returns PASS or PASS WITH RISKS before tagging v1.0.0.

## Fixed test fixture

`qa/qa-gold-rune.json` must expand to:

- 64 ordered cells
- 46 Obsidian
- 16 Native Gold
- 2 Malachite
- three staged Quickfort material phases
