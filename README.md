# Synectic Integrated Development Environment

Synectics is a problem solving methodology that stimulates thought processes of which the subject may be unaware. Synectic IDE is a fundamentally different type of IDE, focused on supporting a holistic view of problem solving in software development and allowing context-specific functionality that stimulates complex, diverse solutions to computational problems.

# Usage

Release builds are available for MacOS, Linux, and Windows.

Download: http://web.engr.oregonstate.edu/~nelsonni/synectics/

# Install

1. Install [Node.js](https://nodejs.org/en/).
2. Install [Electron](https://electron.atom.io/):
```bash
  npm i -g electron
```
3. Clone this repository:
```bash
  git clone git@github.com:nelsonni/synectic.git
```
4. Execute Synectic IDE from within the project directory:
```bash
  npm run start
```

# Builds

Follow the instructions in [Install](#Install) section and use any of the following from within the project directory:
* `npm run build` - builds a release for the host platform/architecture
* `npm run build-all` - builds releases for `darwin`, `win32`, and `linux` platforms
* `npm run build-mac` - builds a release for the `darwin` platform (macOS)
* `npm run build-win` - builds a release for the `win32` platform (Windows)
* `npm run build-linux` - builds a release for the `linux` platform
* `npm run build-dev` - builds a version that is non-archived (no asar of `app` folder) and non-pruned (all packages included in `node_modules` folder)
* `npm run clean` - removes all previous release builds


# Contributors
Nicholas Nelson ([@nelsonni](https://github.com/nelsonni)), Brandon Dring ([@El_Dringo_Brannde](https://github.com/El-Dringo-Brannde)), Lauren Gastineau ([@laurengastineau](https://github.com/laurengastineau))
