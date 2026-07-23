# Dwarf Fortress Floor Portrait Studio — Release Brief

## Product goal

Build a local-first web app that turns a pixel-art idea or imported image into a Dwarf Fortress floor-tile portrait of up to 100×100 cells. One editor cell maps to one constructed in-game floor tile.

## Material catalog and artwork

The public project contains 115 named planning materials:

- 83 Stone
- 3 Glass
- 3 Ceramic
- 26 Metal

`scripts/material-palette.mjs` is the canonical source for material IDs, names, categories, and representative planning colors.

`scripts/generate-materials.mjs` deterministically produces an original 48×48 procedural texture for every material. It does not read a reference image or third-party artwork. Category motifs are deliberately distinct from the Dwarf Fortress game tiles:

- Stone: seeded aggregate, veins, and flecks
- Glass: abstract facets and edge highlights
- Ceramic: glaze rings and speckles
- Metal: horizontal brush lines and soft sheen

A clean clone must regenerate the same texture hashes and typed catalog from repository content alone.

## Required editor behavior

- New portrait width and height: 1–100 each.
- Default: 32×32.
- Responsive canvas editor at 100×100.
- Tools: pencil, eraser, fill, eyedropper, line, rectangle; undo/redo; clear.
- Zoom, fit-to-view, and readable grid toggle.
- Material search and category filters.
- Each material card shows its generated texture, exact material name, category, and representative hex color.
- Render modes:
  - `Color`: representative material color.
  - `Texture`: original procedural 48×48 texture.
- Image import uses contain-to-canvas mapping, material quantization, optional filtered palette, and optional Floyd–Steinberg dithering.
- Local browser persistence with explicit reset behavior.

## Provider-neutral AI chatbot workflow

No hidden API integration, invented key, fake AI call, or provider dependency.

The **AI Design Desk**:

1. Accepts the idea, dimensions, style notes, background, and optional restricted palette.
2. Copies a self-contained prompt for any capable cloud or local AI chatbot.
3. Explains the copy/paste, privacy, validation, and correction workflow in the product.
4. Imports and validates the chatbot's compact JSON response atomically.

The Studio sends no prompt or design to an external service. Direct sign-in, API calls, model selection, tool access, and agent orchestration are outside the copy/paste integration boundary.

Compact schema:

```json
{
  "version": 1,
  "name": "Design name",
  "width": 32,
  "height": 32,
  "background": "obsidian",
  "runs": [
    { "y": 0, "x": 0, "length": 32, "material": "obsidian" },
    { "y": 4, "x": 10, "length": 5, "material": "native-gold" }
  ]
}
```

Rules:

- coordinates are zero-based
- runs are horizontal
- runs may overlap; later runs win
- material values use app material IDs
- omitted cells use `background`

## Exports

- PNG preview with scale control and no interpolation.
- Compact JSON project.
- Ordered tile CSV: `order,row,column,x,y,material_id,material_name,category,color_hex`.
- Build-runs CSV: `row,start_column,end_column,length,material_id,material_name,color_hex`.
- Build plan text with totals and row instructions.
- Staged DFHack Quickfort CSV:
  - harmless first `#notes` README
  - one filter-first `#build` section per material
  - `start(1;1)` upper-left alignment
  - `Cf` and `Cf(Nx1)` constructed-floor tokens
  - explicit metal-bars warning

Quickfort cannot encode floor materials. The UI and documentation must never present the staged multicolor export as a one-click build.

## Design direction

A dwarven cartographer’s drafting table: dark slate, parchment work surfaces, oxidized brass controls, engraved separators, and restrained texture. The material rail uses original generated swatches paired with precise build metadata.

Typography is bundled locally: Alegreya SC, IBM Plex Sans, and IBM Plex Mono.

## Release and quality constraints

- Vite + React + TypeScript.
- Pure, testable transformation and export modules.
- Deterministic generated assets with recorded SHA-256 hashes.
- No third-party reference-sheet pixels or crops in the repository or release artifact. One illustrative in-game screenshot is allowed only with explicit third-party-content and license-exclusion notices.
- No machine-specific paths, secrets, or required external services.
- MIT license for original project code and procedural textures.
- Clear unofficial/non-affiliation and trademark notice.
- GitHub Actions gate on the pinned Node runtime.
- `npm run verify`, production dependency audit, and `npm run release:package` must pass.
- Browser verification covers first load, textures, editing, history, search/filter, design import, and export.
- Release ZIP includes the static build, license, third-party notice, run instructions, offline guides, illustrative screenshot, and SHA-256 checksum.
