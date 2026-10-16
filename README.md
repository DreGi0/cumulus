# Cumulus

Open-source vector editor and animation toolkit for mascots, icons and UI motion in React Native and the web.

![Status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-orange)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
<!-- Add build, npm and coverage badges once CI and publishing exist. -->

> [!WARNING]
> Cumulus is in the planning phase. Nothing is installable yet.
> The plan lives in the [PRD](docs/PRD.md) and the [decision records](docs/decisions/).

<!-- Banner or demo GIF: add the image to docs/assets/ and embed it here. -->

## Table of Contents

- [Background](#background)
- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [Documentation](#documentation)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Background

Developers who build apps with AI assistance can generate code quickly, but
small visual assets (mascots, icons, motion) are still hard to produce and
reuse. Existing tools have closed-source editors, paid tiers, or binary file
formats that are hard to version and review.

Cumulus aims to be a free, local-first tool where a person can draw and
animate an asset in a visual editor, save it as a plain-text file that works
well in git, and import it into a project with a few lines of code. AI
assistants can read and write the same files, but the editor comes first.

The first asset built with Cumulus will be Nimbus, a reusable mascot.

## Features

Planned (see the [PRD](docs/PRD.md) for acceptance criteria):

- [ ] Versioned, schema-validated JSON asset format
- [ ] Renderers for React Native and the web
- [ ] Browser-based vector editor (shapes, Bézier paths, groups, undo/redo)
- [ ] Keyframe animation and state machines
- [ ] CLI to validate and preview assets

## Install

Not available yet. Packages will be published under the `@cumulus` scope at
milestone M4.

## Usage

Illustrative sketch of the planned API. It will change.

```tsx
import { Asset } from '@cumulus/renderer-rn';
import nimbus from './assets/nimbus.json';

export function Mascot({ mood }: { mood: string }) {
  return <Asset source={nimbus} state={mood} />;
}
```

## Project structure

Planned monorepo layout, see [ADR-001](docs/decisions/001-repo-structure.md):

```
packages/core            schema, types, parse and validate
packages/renderer-web    web renderer
packages/renderer-rn     React Native renderer
apps/editor              browser editor
docs/                    PRD and decision records
```

## Roadmap

| Milestone | Goal                          |
| --------- | ----------------------------- |
| M1        | Format and renderers          |
| M2        | Vector editor                 |
| M3        | Animation and state machines  |
| M4        | Packages, CLI and docs        |

Details and acceptance criteria are in the [PRD](docs/PRD.md).

## Documentation

- [Product requirements](docs/PRD.md)
- [Architecture decision records](docs/decisions/)

## Maintainers

[@DreGi0](https://github.com/DreGi0)

## Contributing

Questions, ideas and feedback on the PRD are welcome. Read
[CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.
This project follows a [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2026 <<REPLACE: your full name>>
