# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Replaced product-specific assistant branding with a provider-neutral AI chatbot workflow.
- Added in-product compatibility, privacy, local-model, and validation-recovery guidance.
- Added a complete offline chatbot guide to the repository and release package.
- Added an illustrative in-game screenshot to the README and release package with an explicit third-party-content notice.

## [1.0.0] - 2026-07-23

### Added

- Local-first 1×1 through 100×100 floor-portrait editor.
- Pencil, eraser, fill, eyedropper, line, and rectangle tools with undo/redo.
- Searchable 115-material catalog: 83 stone, 3 glass, 3 ceramic, and 26 metal materials.
- Deterministic original procedural 48×48 textures for every material.
- Color and texture preview modes, image quantization, and optional Floyd–Steinberg dithering.
- Provider-neutral AI chatbot workflow using validated compact JSON runs.
- PNG, compact JSON, ordered tile CSV, build-run CSV, text plan, and staged Quickfort exports.
- Instruction-first Quickfort workflow that requires an explicit buildingplan material filter for every phase.
- Automated tests, type checks, linting, production builds, dependency audit, and release packaging.
- Complete generated runtime dependency notices, including bundled font licenses.

### Security and distribution

- Removed the unlicensed prototype reference sheet, its crops, and source-derived renders from the public project.
- Replaced all prototype textures with original procedural artwork generated without third-party image input.
- Added MIT licensing, non-affiliation notices, and reproducible release packaging with SHA-256 checksums.

[Unreleased]: https://github.com/ElvisExMachina/dwarf-fortress-floor-portrait-studio/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ElvisExMachina/dwarf-fortress-floor-portrait-studio/releases/tag/v1.0.0
