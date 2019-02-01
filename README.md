# Synectic Integrated Development Environment
[![Build Status](https://api.travis-ci.com/SarmaResearch/synectic.svg?branch=master)](https://travis-ci.org/SarmaResearch/synectic)

Synectics is a problem solving methodology that stimulates thought processes of which the subject may be unaware. Synectic IDE is a fundamentally different type of IDE, focused on supporting a human-oriented view of problem solving in software development. Synectic promotes context-specific functionalities that allow complex, diverse solutions to be explored and developed.

*NOTE: This is a research-driven project, and as such should be considered experimental.*

# Usage

Release builds are available for MacOS, Linux, and Windows.

Download: http://web.engr.oregonstate.edu/~nelsonni/synectics/

# Install

1. Install [Node.js](https://nodejs.org/en/).
2. Clone this repository:
`git clone git@github.com:SarmaResearch/synectic.git`
3. Install dependencies (listed in `package.json`) from within the project directory:
`npm i`
4. Execute Synectic IDE from within the project directory:
`npm start`

# Builds

Follow the instructions in [Install](#Install) section to install dependencies and use any of the following from within the project directory:
* `npm run pack` - build and packages a release for the host platform/architecture
* `npm run pack:mac` - build and packages a release for the `darwin` platform (macOS)
* `npm run pack:win` - build and packages a release for the `win32` platform (Windows)
* `npm run pack:linux` - build and packages a release for the `linux` platform
* `npm run build` - builds (but does not package) a release for the host platform/architecture
* `npm run compile` - executes [webpack](https://github.com/webpack/webpack) to compile TypeScript located in `src/` directory and places the resulting JavaScript in the `dist/` directory
* `npm run clean` - removes all previous releases and compilation results (`dist/` and `release/`)

# Tests

Follow the instructions in [Install](#Install) section to install dependencies and use the following from within the project directory:
* `npm test` - executes [mocha](https://github.com/mochajs/mocha) tests located in `test/` directory

# Linting

Follow the instructions in [Install](#Install) section to install dependencies and use the following from within the project directory:
* `npm run lint` - executes [TSLint](https://github.com/palantir/tslint) and applies a modified version of `tslint-config-standard` rules

# Contributors
Nicholas Nelson ([@nelsonni](https://github.com/nelsonni)), Brandon Dring ([@El_Dringo_Brannde](https://github.com/El-Dringo-Brannde)), Lauren Gastineau ([@laurengastineau](https://github.com/laurengastineau)), Samarendra Hedaoo ([@knightsamar](https://github.com/knightsamar))
