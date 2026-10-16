# Cumulus — Product Requirements Document

> Status: draft v0.4 · Working name: Cumulus

## 1. Problem

Indie developers and students who build apps with AI assistance have no
simple, open-source way to design and animate small visual assets
(mascots, icons, UI motion) and drop them into their projects. Existing
tools either have closed-source editors, paid tiers, or binary formats
that are hard to version and hard to read.

## 2. Target users

- Solo developers building mobile apps with React Native.
- Humans who design by hand in a visual editor (primary).
- AI assistants that read and write the same files (secondary, nice-to-have).

## 3. Goals

1. A visual vector editor with animation, free and open source (MIT).
2. A plain-text, versioned file format that works well in git.
3. Assets import into a project with minimal code.
4. Focused scope: mascots, icons and UI motion.

## 4. Non-goals

- No accounts, cloud sync, or real-time collaboration.
- No raster/photo editing.
- No feature parity with Figma, Rive or Adobe tools.
- Not a general-purpose illustration or design suite.
- No AI generation features in the editor.
- No Unity/native renderers until a milestone explicitly adds them.

## 5. Principles

- Open source (MIT), local-first, no telemetry.
- Text-first format (JSON, schema-validated, versioned).
- Smallest feature that satisfies the acceptance criteria.
- Every milestone can be tested end to end.
- The core contains no logic specific to a single asset.

## 6. Milestone test: Nimbus

The tool is validated by building Nimbus with it: a simple, white, soft
mascot reused across several apps. Nimbus is a consumer of the tool,
not a requirement of its core. It exercises:

- Multiple named states chosen at runtime by the host app.
- Smooth transitions between states.
- Import into a React Native app with minimal code.

## 7. Milestones and acceptance criteria

### M1 — Format and renderers

- [ ] Versioned JSON Schema for assets: groups, transforms, shapes
      (rectangle, ellipse, path), fill and stroke.
- [ ] A core package parses and validates assets; invalid files fail
      with a clear error message.
- [ ] A React Native renderer displays a hand-written asset file.
- [ ] A web renderer, built on the same core, displays the same file.

### M2 — Vector editor

- [ ] Browser editor to create, select, move and delete shapes.
- [ ] Draw and edit cubic Bézier paths (add, remove, move anchors and handles).
- [ ] Fill and stroke colors; groups; z-order.
- [ ] Undo/redo for every edit.
- [ ] Save/load a project file.
- [ ] Export an asset file; the React Native renderer displays it.
- [ ] **Test:** at least three distinct Nimbus poses are created entirely
      in the editor and displayed in a React Native app.

### M3 — Animation

- [ ] Keyframe timeline for any property, with easing.
- [ ] State machine: named states, transitions, runtime inputs.
- [ ] Playback in both renderers.
- [ ] **Test:** Nimbus is animated entirely in the editor and switches
      between states at runtime with smooth transitions.
- [ ] **Test:** one icon and one UI-motion asset (e.g. a loading
      spinner) are also created with the tool.

### M4 — Distribution

- [ ] Published npm packages (core, renderer).
- [ ] CLI to validate and preview an asset.
- [ ] Documentation with a "first asset in 10 minutes" guide.

## 8. Success criteria

- Nimbus is built entirely with the tool, with no hand-edited files.
- A person who did not build the tool can create and import an asset
  into a React Native app by following the docs.

## 9. Risks

| Risk                                          | Mitigation                                    |
| --------------------------------------------- | --------------------------------------------- |
| Vector editor scope is very large             | Strict milestones; each can be tested alone   |
| Nimbus bends the core toward one asset        | Treat it as a consumer; decisions go via ADRs |
| Animation may be slow on mobile               | Spike before committing (ADR)                 |
| Format changes break old assets               | Versioned schema from day one                 |

## 10. Open questions (to resolve via ADRs or spikes)

- Animation model: keyframes, physics, or both?
- Is soft-body (squishy) motion a core feature or an optional extension?
- Editor rendering: SVG or canvas?
- Mobile renderer: SVG or Skia?

## 11. Links

- Repo: https://github.com/DreGi0/cumulus
