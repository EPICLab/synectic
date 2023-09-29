# Project Architecture

The underlying technologies used to compose Synectic have changed over the years. This document serves as a guide to the various technologies that are used to build and develop Synectic, but also as a historical record of the evolution in the architecture and design.

## Software Framework

Synectic began as a simple editor using web-based technologies to create a flexible desktop application. We initially settled on [Electron](https://www.electronjs.org/) for its ability to create desktop applications using web technologies (mainly [HTML](https://en.wikipedia.org/wiki/HTML), [CSS](https://en.wikipedia.org/wiki/CSS), and [JavaScript](https://en.wikipedia.org/wiki/JavaScript)) that are rendered using a version of the [Chromium V8 browser engine](<https://en.wikipedia.org/wiki/Chromium_(web_browser)>) and a backend using the [Node.js](https://nodejs.org/) runtime environment.

## Languages

Using [Electron](https://www.electronjs.org/) means several decisions were already made for us, not least of which is that our application should be compiled to [JavaScript](https://developer.mozilla.org/en-US/docs/Web/javascript). This meant that we initially wrote in [JavaScript](https://developer.mozilla.org/en-US/docs/Web/javascript). However, we transitioned to [TypeScript](https://www.typescriptlang.org/) in [`v0.7.0`](https://github.com/EPICLab/synectic/releases/tag/v0.7.0), in order to take advantaged of static type-safety, the ability to document program behavior inline, and to use [IntelliSense in Visual Studio Code](https://code.visualstudio.com/docs/editor/intellisense) for code completion, syntax linking, and code hinting. We also use [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) for structuring the web content displayed within Synectic, and [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) for styling the presentation of those HTML elements.

## Package Manager

We initially started using the [npm](https://www.npmjs.com/package/npm) package manager due to its defacto status as the standard for JavaScript applications that pull packages from the [`npm`](https://www.npmjs.com/) registry. We transitioned to [Yarn](https://yarnpkg.com/) in [`v1.0.0`](https://github.com/EPICLab/synectic/releases/tag/v1.0.0).

## Module Bundler

In order to transform JavaScript and other front-end assets such as HTML, CSS, and images, we use a module bundler that is capable of taking modules with dependencies and generating static assets representing those modules. This is also a necessary step before packaging Synectic into distributable installers for the various platforms (Linux, MacOS, and Windows).

Synectic used [Webpack](https://webpack.js.org/) for [`v0.7.0`](https://github.com/EPICLab/synectic/releases/tag/v0.7.0) to [`v4.4.0`](https://github.com/EPICLab/synectic/releases/tag/v4.4.0), but eventually was replaced by [Vite](https://vitejs.dev/) as the build tool. Vite includes two major parts: A dev server for serving source files over native [ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), with [built-in features](https://vitejs.dev/guide/features.html) and fast [Hot Module Replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement). And a [build command](https://vitejs.dev/guide/build.html) that bundles code with [Rollup](https://rollupjs.org/), pre-configured to output optimized static assets for production.

## Electron App Packager

Prior to [`v1.0.0`](https://github.com/EPICLab/synectic/releases/tag/v1.0.0), we relied on [Electron Builder](https://github.com/electron-userland/electron-builder) for building and publishing Electron distributables. However, we restructured the project to use the project scaffolding included in [Electron Forge](https://www.electronforge.io/) during that first production release. And in the `v5.0.0` release we migrated to [Hydraulic Conveyor](https://conveyor.hydraulic.dev/) for its support of cross-building/signing of all packages from any OS without the need for multi-platform CI, the ability to do synchronous web-style updates on each start of the app, and can use plain HTTP servers for updates. Conveyor replaces the Electron auto-updaters with [Sparkle](https://sparkle-project.org/) on MacOS, [MSIX](https://learn.microsoft.com/en-us/windows/msix/overview) on Windows, and Linux package repositories.

## Linting

We initially relied on [TSLint](https://palantir.github.io/tslint/) as it was the recommended linter for TypeScript projects up until being deprecated in 2019 in favor of the [ESLint](https://eslint.org/) static code analysis tool. We switched to using [ESLint](https://eslint.org/) during the [`v1.0.0`](https://github.com/EPICLab/synectic/releases/tag/v1.0.0) release.

Prettier

## UI Framework

React

## State Management

Redux

## Testing Frameworks

Originally, we used a combination of the [Mocha](https://mochajs.org/) JavaScript testing framework and the [Chai](https://www.chaijs.com/) BDD/TDD assertion library for Node.js and browser targets. However, we switched to using the [Jest](https://jestjs.io/) JavaScript testing framework in combination with the [React Testing Library (RTL)](https://testing-library.com/) during the `v1.0.0` release.
