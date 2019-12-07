# Synectic Integrated Development Environment
[![Build Status](https://travis-ci.com/SarmaResearch/synectic.svg?token=tPKRniivUcjR9xcd62e5&branch=master)](https://travis-ci.com/SarmaResearch/synectic)

Synectics is a problem solving methodology that stimulates thought processes of which the subject may be unaware ([Wikipedia](https://en.wikipedia.org/wiki/Synectics)). Synectic IDE is a fundamentally different type of IDE, focused on supporting a human-oriented view of problem solving in software development. Synectic promotes context-specific functionalities that allow complex, diverse solutions to be explored and developed. As a research prototype, this software has no expressed warranty or guarantees and should be treated as experimental software.

The rationale and principles that guide the design of Synectic can be found in [DESIGN.md](https://github.com/SarmaResearch/synectic/blob/master/DESIGN.md). The complete set of programming languages, tools, bundlers, packagers, frameworks, and plugins included in Synectic, along with the configuration requirements, can be found in [ARCHITECTURE.md](https://github.com/SarmaResearch/synectic/blob/master/ARCHITECTURE.md). Synectic is released under an MIT license, which can be found in [LICENSE](https://github.com/SarmaResearch/synectic/blob/master/LICENSE), and major version releases are described in [CHANGELOG.md](https://github.com/SarmaResearch/synectic/blob/master/CHANGELOG.md).

Versioning within this project adheres to the rules of [Semantic Versioning 2.0.0](https://semver.org/).

# Usage

Pre-built releases are available for MacOS, Linux, and Windows. The following formats are available:
* MacOS - `dmg`, `zip`
* Linux - `deb` (Debian-based, e.g. Ubuntu), `rpm` (RedHat-based, e.g. Fedora)
* Windows - `exe`, `nupkg` ([Squirrel.Windows](https://www.electronforge.io/config/makers/squirrel.windows) target)

Downloads: [http://web.engr.oregonstate.edu/~nelsonni/synectics/](http://web.engr.oregonstate.edu/~nelsonni/synectics/)

# Install

1. Install [Node.js](https://nodejs.org/en/).
2. Install [Yarn](https://yarnpkg.com/lang/en/) Package Manager (or use `npm` which is installed with `Node.js`).
3. Clone this repository:
    ```bash
    git clone git@github.com:SarmaResearch/synectic.git
    ```
4. Move into the project root directory:
    ```bash
    cd synectic
    ```
5. Install project dependencies (`npm`/`npx` can also be used in place of `yarn`):
    ```bash
    yarn install
    ```
6. Build and run Synectic IDE:
    ```bash
    yarn start
    ```

# CLI

Follow the instructions in [Install](#Install) section to install dependencies. Once installed, all of the following commands can be used from within the project root directory:
* `yarn start` - build and executes Synectic from the application directory (when running, type `rs` to terminate and restart Synectic)
* `yarn package` - packages the Synectic application into a platform specific format and puts the results in the `out/` directory
* `yarn make` - make distributables for the Synectic application based on the forge config
* `yarn publish` - attempts to make the Synectic application and then publish it to the publish targets defined in the forge config
* `yarn lint` - runs static analysis for TypeScript and JavaScript code to conform to linting rules
* `yarn clean` - removes all previous build output, packaging, and distribution files (`.webpack/` and `out/`)

# Testing

Follow the instructions in [Install](#Install) section to install dependencies. Once installed, the following commands can be used from within the project root directory:
* `yarn test` - executes [Jest](https://jestjs.io/) with [Enzyme](https://airbnb.io/enzyme/) tests located in `__test__` directory

# Linting

Follow the instructions in [Install](#Install) section to install dependencies. Once installed, the following commands can be used from within the project root directory:
* `yarn lint` - executes [ESLint](https://eslint.org/) and evalutes against `eslint:recommended`, `@typescript-eslint/recommended`, and `react/recommended` rules

# Contributors

We welcome contributions to this open source project on Github. When contributing, please follow the [Contributing Code Guide](https://github.com/EPICLab/synectic/blob/master/CONTRIBUTING.md). Also, any new contributors should include a commit that updates this `README.md` document to include your name and a link to your GitHub profile page (unless you wish to be anonymous).

Nicholas Nelson ([@nelsonni](https://github.com/nelsonni)), Brandon Dring ([@El_Dringo_Brannde](https://github.com/El-Dringo-Brannde)), Lauren Gastineau ([@laurengastineau](https://github.com/laurengastineau)), Samarendra Hedaoo ([@knightsamar](https://github.com/knightsamar))
