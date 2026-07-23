# Dwarf Fortress Floor Portrait Studio — v1.0.0 QA Report

**Status:** Local release gate passed  
**Date:** 2026-07-23  
**Scope:** Public-source candidate and downloadable static web archive

## Release candidate

- Package: `dwarf-fortress-floor-portrait-studio@1.0.0`
- Archive: `dwarf-fortress-floor-portrait-studio-v1.0.0.zip`
- Archive SHA-256: `37447a4d0243426e0472645017a15d6020d77eed9956c4114b0c1619aa895ef2`
- Archive size: 1,572,503 bytes

The archive was built twice from the unchanged tree and produced the same SHA-256 on the release machine.

## Automated gate

`npm run verify` passed:

- third-party runtime license bundle: current and complete for 9 runtime packages
- material generation: 115 deterministic original 48×48 procedural textures
- Vitest: 8 files passed, 27 tests passed
- TypeScript: passed
- ESLint: passed with zero warnings
- Vite production build: passed

`npm audit --omit=dev --audit-level=high` reported zero vulnerabilities.

`npm run release:package` passed, and `shasum -a 256 -c SHA256SUMS` verified the generated archive.

## Material catalog

Verified invariants:

- 115 unique material IDs
- 83 Stone
- 3 Glass
- 3 Ceramic
- 26 Metal
- every texture is 48×48 RGBA, fully opaque, non-flat, and uniquely hashed
- every catalog `textureSha256` matches its PNG
- generation is deterministic and requires no external image input
- Native Gold is classified as Stone
- Gold is classified as Metal

The public tree and release artifact do not contain the private prototype reference sheet, crops from it, source coordinates, or Dwarf Fortress game artwork. Exact SHA-256 comparison found no overlap between the 115 public textures and the archived prototype PNG set.

## Runtime license compliance

The production archive includes:

- `LICENSE` for original project code and procedural artwork
- `THIRD_PARTY_NOTICES.md` for project status and compatibility notices
- `THIRD_PARTY_LICENSES.txt` with complete license texts and copyright notices for all 9 runtime npm packages

The generated dependency bundle contains the three required SIL Open Font License notices plus ISC and MIT runtime notices. `npm run licenses:check` fails if the committed bundle becomes stale.

## Quickfort compatibility

Automated export tests and browser smoke testing verified:

- the file begins with a harmless `#notes label(README)` section
- `Cf` is used only for floor-construction geometry
- every material phase tells the user to set the exact buildingplan floor filter manually
- metal phases additionally require `buildingplan set bars true`
- all phases retain one shared upper-left anchor
- README wording does not claim Quickfort can encode material identity

The fixed QA Gold Rune expands to 64 cells and produces three material-filter phases.

## Production browser smoke test

The built `dist` was served with `vite preview` on a separate production-preview port. Verified:

- hashed JavaScript and CSS assets loaded
- all 115 catalog entries rendered
- Color and Texture modes worked
- revised procedural textures rendered without blank or broken assets
- category filtering returned exactly 26 Metal entries
- the 8×8 QA Gold Rune imported as 64 cells and 7 compact runs
- staged Quickfort download reported three required material phases
- document width equaled viewport width at the desktop test size
- no JavaScript errors were reported

Evidence screenshots are stored in `docs/qa/`.

## Residual risks and stated limits

- Material names and colors are planning aids; verify actual in-game availability.
- Quickfort phases require manual material filtering and careful anchor reuse.
- Archive reproducibility was demonstrated on the same operating system and Info-ZIP version, not across operating systems.
- Automated tests do not exhaustively cover every pointer gesture, narrow viewport, browser download implementation, or localStorage recovery edge case.
- The project is an unofficial fan utility and is not affiliated with Bay 12 Games, Kitfox Games, or DFHack.

## Release gate

The local source and archive gates pass. The remaining publication gate is to create and push a real Git commit, run CI and independent certification against that exact commit, then tag and publish only if those checks pass.
