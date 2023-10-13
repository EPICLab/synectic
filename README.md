# Synectic Integrated Development Environment

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/EPICLab/synectic/build.yml?style=for-the-badge)
![GitHub](https://img.shields.io/github/license/EPICLab/synectic?style=for-the-badge)
![GitHub release (with filter)](https://img.shields.io/github/v/release/EPICLab/synectic?style=for-the-badge)

![Electron.js](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Redux](https://img.shields.io/badge/redux-%23593d88.svg?style=for-the-badge&logo=redux&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white)

Synectics is a problem solving methodology that stimulates thought processes of which the subject may be unaware ([Wikipedia](https://en.wikipedia.org/wiki/Synectics)). Synectic IDE is a fundamentally different type of IDE, focused on supporting a human-oriented view of problem solving in software development. Synectic promotes context-specific functionality that compliments and enhances human cognition, memory, and reasoning. As a research prototype, this software has no expressed warranty or guarantees and should be treated as experimental software.

The rationale and principles that guide the design of Synectic can be found in [DESIGN](https://github.com/EPICLab/synectic/blob/master/DESIGN.md). The complete set of programming languages, tools, bundlers, packagers, frameworks, and plugins included in Synectic, along with the configuration requirements, can be found in [ARCHITECTURE](https://github.com/EPICLab/synectic/blob/master/ARCHITECTURE.md). Synectic is released under an MIT license, which can be found in [LICENSE](https://github.com/EPICLab/synectic/blob/master/LICENSE).

Versioning within this project adheres to the rules of [Semantic Versioning 2.0.0](https://semver.org/).

## Usage

### Prerequisites

Synectic requires the host system to have [Git](https://git-scm.com/downloads) installed and available in order to natively execute git commands (version 2.5+ is recommended for [`git worktree`](https://github.blog/2015-07-29-git-2-5-including-multiple-worktrees-and-triangular-workflows/) support).

### Installation

[![macOS](https://img.shields.io/badge/mac%20os-000000?style=for-the-badge&logo=macos&logoColor=F0F0F0)](https://epiclab.github.io/synectic/download.html)
[![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://epiclab.github.io/synectic/download.html)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://epiclab.github.io/synectic/download.html)

⚠️ **Warning:** Every operating system uses code signing to establish stable identities for programs that don't change when new versions are released, and to secure the software update process. Windows and macOS additionally use signing as a way to block malware.

This is experimental research software, and is not intended for use in production environments. As such, we are not able to purchase signing keys for Windows and macOS. This means that you will see a warning when installing Synectic on Windows and macOS. You will need to click through the warning to install Synectic. If you are not comfortable with this, please do not install Synectic.

See the [Installation Guide](https://github.com/EPICLab/synectic/wiki/Installation-Guide) for guidance on using unsigned builds of Synectic.

[![Packaged](https://img.shields.io/badge/Packaged_with-Conveyor-blue?style=for-the-badge)](https://www.hydraulic.dev/)

## Development

## Source Installation

To install Synectic from source, use the following steps:

1. Install [Node.js](https://nodejs.org/en/).
2. Install [Yarn](https://yarnpkg.com/lang/en/) Package Manager (`npm`/`npx` can also be used, but `yarn` is preferred).
3. Clone this repository:

   ```bash
   git clone git@github.com:EPICLab/synectic.git
   ```

4. Move into the project root directory:

   ```bash
   cd synectic
   ```

5. Install project dependencies:

   ```bash
   yarn install
   ```

6. Build and start Synectic:

   ```bash
   yarn start
   ```

## CLI

Make sure to follow the [Source Installation](#source-installation) instructions before using the CLI. The following commands can be used from within the project root directory:

- `yarn start` - The command will build the main process, preload scripts and renderer source code, and start the Electron app to preview.
- `yarn dev` - The command will build the main process and preload scripts source code, and start a dev server for the renderer, and finally start the Electron app.
- `yarn build` - The command will build the main process, preload scripts and renderer source code. Usually before packaging the Electron application, you need to execute this command.
- `yarn bundle` - The command will execute the same steps as `yarn build`, but afterwards will call the [Conveyor `site`](https://conveyor.hydraulic.dev/11.4/configs/download-pages/) task to generate the online update repository along with a static download page.
- `yarn format` - The command formats all files supported by [Prettier](https://prettier.io/) in the current directory and its subdirectories.
- `yarn clean` - The command will delete the `out` directory, which is generated by the `yarn start` and `yarn build` commands.

## Project Structure

We use the [_recommended project structure_](https://electron-vite.org/guide/dev.html) of the [`electron-vite`](https://electron-vite.org/) project, which means that the following convention is used:

```bash
.
├──src
│  ├──main
│  │  ├──index.ts
│  │  └──...
│  ├──preload     # git native wrappers
│  │  ├──index.ts
│  │  └──...
│  └──renderer    # react components
│     ├──src
│     ├──index.html
│     └──...
├──electron.vite.config.ts
├──package.json
├──types
└──...
```

The only deviation is the inclusion of a top-level `types` directory, which contains TypeScript type definitions for the project. The `src` directory contains the source code of the project, and the `electron.vite.config.ts` file contains the configuration for the [`electron-vite`](https://electron-vite.org/) bundler. The `package.json` file contains the project metadata and the scripts used to build and run the project.

When the `yarn start` or `yarn build` commands are executed, the `out` directory is generated. However, if the `yarn dev` command is executed there will be no `out/renderer` directory generated, and instead the `src/renderer` directory will be used directly (to allow fast HMR during development). The output structure will look like this:

```bash
.
├──out
│  ├──main
│  │  ├──index.js
│  │  └──...
│  ├──preload
│  │  ├──index.js
│  │  └──...
│  └──renderer
│     ├──assets/
│     ├──index.html
│     └──...
├──src
├──electron.vite.config.ts
├──package.json
├──types
└──...
```

## Releases

Installation is required; see [CLI](#cli) for installation instructions. The following commands can be used from within the project root directory:

- `yarn release` - executes [`yarn version`](https://yarnpkg.com/cli/version) plugin to initiate a major semver version bump, generate a new [version.js](https://github.com/EPICLab/synectic/blob/main/version.js) using [`genversion`](https://www.npmjs.com/package/genversion), stage and commit all relevant version files, generate a new [annotated Git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging), and [atomically](https://git-scm.com/docs/git-push#Documentation/git-push.txt---no-atomic) push changes to the remote repository to trigger [GitHub Actions](https://docs.github.com/en/actions).

## Contributors

We welcome contributions to this open source project on Github. When contributing, please follow the [Contributing Code Guide](https://github.com/EPICLab/synectic/blob/master/CONTRIBUTING.md). Also, any new contributors should include a commit that updates this `README.md` document to include your name and a link to your GitHub profile page (unless you wish to be anonymous).

[![Contributors](https://contrib.rocks/image?repo=EPICLab/synectic)](https://github.com/EPICLab/synectic/graphs/contributors)[^1]
[^1]: Contributor images made with [contrib.rocks](https://contrib.rocks).

- Nicholas Nelson ([@nelsonni](https://github.com/nelsonni))
- Andrea Tongsak ([@andrealit](https://github.com/andrealit))
- Jett Seale ([@jettseale](https://github.com/jettseale))
- Brandon Dring ([@El_Dringo_Brannde](https://github.com/El-Dringo-Brannde))
- Marjan Adeli ([@Marjan-Adeli](https://github.com/Marjan-Adeli))
- Hayden Coffey ([@hcoffey1](https://github.com/hcoffey1))
- Lauren Gastineau ([@laurengastineau](https://github.com/laurengastineau))
- Samarendra Hedaoo ([@knightsamar](https://github.com/knightsamar))
