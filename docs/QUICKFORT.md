# Staged Quickfort export

The app's **Staged Quickfort CSV** download turns the current portrait into DFHack-compatible constructed-floor blueprints without pretending that Quickfort can store floor materials.

## Why there is one blueprint per material

DFHack Quickfort uses `#build` mode for constructions and `Cf` for a constructed floor. `Cf` does not encode a material. Quickfort delegates material selection to DFHack `buildingplan`, and the active floor filter is captured when the blueprint is applied.

A multicolor floor portrait therefore cannot be represented honestly as one material-aware `#build` grid. The exporter creates one disjoint blueprint section per material used by the portrait. Together, the sections cover every portrait tile exactly once.

DFHack's per-blueprint material feature request is still open: [DFHack issue #3152](https://github.com/DFHack/dfhack/issues/3152). Its latest design notes explicitly describe material properties as future work and note that buildingplan still needs an API for registering a building with custom filters.

## Generated structure

The first blueprint is non-building help text:

```text
#notes label(README) MATERIAL FILTER SETUP REQUIRED - this section builds nothing
STOP: Quickfort CSV cells cannot encode floor materials.
...
```

Each material then gets a separately runnable section:

```text
#build label(filter01_obsidian_then_apply) start(1;1;portrait upper-left) ...
Cf(3x1),,,Cf,...
...
```

- The default `README` section changes no map tiles and displays the material setup instructions.
- Actionable labels follow `filterNN_material_then_apply` and are ordered by descending tile count, then material name.
- `start(1;1;portrait upper-left)` tells Quickfort that the cursor is on the portrait's upper-left cell.
- A single floor is `Cf`.
- A horizontal run is compressed to `Cf(Nx1)`.
- Empty CSV cells preserve the run's map coordinates.
- The modeline description contains the material name, material ID, category, representative color, and floor count.

## Applying a portrait

1. Copy the downloaded `*-quickfort.csv` to `<Dwarf Fortress>/dfhack-config/blueprints/`.
2. Open `gui/quickfort`, select `README`, and apply it. It displays instructions and builds nothing.
3. If any material phase is **Metal**, run `buildingplan set bars true` once in the DFHack console. The documented default is `bars=false`.
4. Open **Build → Constructions → Floor** in Dwarf Fortress so the buildingplan placement overlay appears.
5. Click `[any material]` next to the construction item, allow only the exact material required by the next `filterNN_material_then_apply` label, then leave floor placement mode. The filter persists for that building type.
6. Reopen `gui/quickfort`, select the matching material label, place the cursor on the intended upper-left portrait tile, preview, and apply.
7. Repeat steps 4–6 for every material while keeping the same upper-left anchor.

The sections are disjoint, so applying them in a different order does not change the image. Never apply a material section with `[any material]` or the wrong filter: Quickfort records the active buildingplan filter with those planned constructions. There is no supported all-at-once multicolor apply operation.

## Verified behavior

The fixed 8×8 QA Gold Rune exports as three sections:

- `filter01_obsidian_then_apply`: 46 floors
- `filter02_native_gold_then_apply`: 16 floors
- `filter03_malachite_then_apply`: 2 floors

The generated CSV has 33 lines: the README modeline and five instruction lines, followed by one modeline plus eight coordinate rows for each material. Tests expand every `Cf` and `Cf(Nx1)` token and verify that all 64 cells are represented exactly. A component test also clicks the download button and verifies that the browser receives the instruction-first CSV.

## Official specification used

- [Quickfort blueprint creation guide](https://docs.dfhack.org/en/latest/docs/guides/quickfort-user-guide.html#quickfort-blueprint-guide)
- DFHack source: `docs/guides/quickfort-user-guide.rst` on the official `DFHack/dfhack` repository

The implementation follows the current guide's `#notes`, `#build`, `Cf`, `label()`, `start()`, multi-blueprint CSV, and buildingplan-filter semantics. The buildingplan guide documents named material filters as a placement-UI operation and `bars=false` as the default global setting.
