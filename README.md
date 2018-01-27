# Synectic Integrated Development Environment
[![Build Status](https://travis-ci.org/nelsonni/synectic.svg?branch=master)](https://travis-ci.org/nelsonni/synectic)

Synectics is a problem solving methodology that stimulates thought processes of which the subject may be unaware. Synectic IDE is a fundamentally different type of IDE, focused on supporting a holistic view of problem solving in software development and allowing context-specific functionality that stimulates complex, diverse solutions to computational problems.

*NOTE: This is a research-driven project, and as such should be considered experimental.*

# Usage

Release builds are available for MacOS, Linux, and Windows.

Download: http://web.engr.oregonstate.edu/~nelsonni/synectics/

# Install

1. Install [Node.js](https://nodejs.org/en/).
2. Clone this repository:
`git clone git@github.com:nelsonni/synectic.git`
3. Install dependencies (listed in `package.json`) from within the project directory:
`npm i`
4. Execute Synectic IDE from within the project directory:
`npm start`

# Builds

Follow the instructions in [Install](#Install) section to install dependencies and use any of the following from within the project directory:
* `npm run build` - builds a release for the host platform/architecture
* `npm run build-all` - builds releases for `darwin`, `win32`, and `linux` platforms
* `npm run build-mac` - builds a release for the `darwin` platform (macOS)
* `npm run build-win` - builds a release for the `win32` platform (Windows)
* `npm run build-linux` - builds a release for the `linux` platform
* `npm run build-dev` - builds a version that is non-archived (no asar of `app` folder) and non-pruned (all packages included in `node_modules` folder)
* `npm run clean` - removes all previous builds

# Tests

Follow the instructions in [Install](#Install) section to install dependencies and use the following from within the project directory:
* `npm test` - executes [mocha](https://github.com/mochajs/mocha) tests located in `test/` directory

# Linting

Follow the instructions in [Install](#Install) section to install dependencies and use the following from within the project directory:
* `npm run lint` - executes [TSLint](https://github.com/palantir/tslint) and applies a modified version of `tslint-config-standard` rulesets on the project

# Contributors
Nicholas Nelson ([@nelsonni](https://github.com/nelsonni)), Brandon Dring ([@El_Dringo_Brannde](https://github.com/El-Dringo-Brannde)), Lauren Gastineau ([@laurengastineau](https://github.com/laurengastineau))
