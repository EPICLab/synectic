# Project Architecture

The underlying technologies used to compose Synectic have changed over the years. This document serves as a guide to the current technologies, as well as a historical record of the evolution in the architecture and design.

## Software Framework

![Electron.js](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

Synectic began as a simple editor using web-based technologies to create a flexible desktop application. We initially settled on [Electron](https://www.electronjs.org/) for its ability to create desktop applications using web technologies (mainly [HTML](https://en.wikipedia.org/wiki/HTML), [CSS](https://en.wikipedia.org/wiki/CSS), and [JavaScript](https://en.wikipedia.org/wiki/JavaScript)) that are rendered using a version of the [Chromium V8 browser engine](<https://en.wikipedia.org/wiki/Chromium_(web_browser)>) and a backend using the [Node.js](https://nodejs.org/) runtime environment.

## Languages

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

Using [Electron](https://www.electronjs.org/) means several decisions were already made for us, not least of which is that our application needs to compiled to [JavaScript](https://developer.mozilla.org/en-US/docs/Web/javascript) and run in a [Node.js](https://nodejs.org/) environment. This meant that we initially wrote in [JavaScript](https://developer.mozilla.org/en-US/docs/Web/javascript). However, we transitioned to [TypeScript](https://www.typescriptlang.org/) in [`v0.7.0`](https://github.com/EPICLab/synectic/releases/tag/v0.7.0).

**TypeSript** includes:

- A superset of JavaScript that adds optional static typing to the language.
- The ability to use the latest JavaScript features such as [classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes), [arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions), [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator), [async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), and [modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).
- Support for [IntelliSense in Visual Studio Code](https://code.visualstudio.com/docs/editor/intellisense) for code completion, syntax linking, and code hinting.

We also use [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) for structuring the web content displayed within Synectic, and [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) for styling the presentation of those HTML elements.

## Package Manager

![Yarn](https://img.shields.io/badge/yarn-%232C8EBB.svg?style=for-the-badge&logo=yarn&logoColor=white)

We initially started using the [npm](https://www.npmjs.com/package/npm) package manager due to its defacto status as the standard for JavaScript applications that pull packages from the [`npm`](https://www.npmjs.com/) registry. We transitioned to [Yarn](https://yarnpkg.com/) in [`v1.0.0`](https://github.com/EPICLab/synectic/releases/tag/v1.0.0).

## Module Bundler

![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

In order to transform JavaScript and other front-end assets such as HTML, CSS, and images, we use a module bundler that is capable of taking modules with dependencies and generating static assets representing those modules. This is also a necessary step before packaging Synectic into distributable installers for the various platforms (Linux, MacOS, and Windows).

Synectic used [Webpack](https://webpack.js.org/) for [`v0.7.0`](https://github.com/EPICLab/synectic/releases/tag/v0.7.0) to [`v4.4.0`](https://github.com/EPICLab/synectic/releases/tag/v4.4.0). However, we replaced it with [Vite](https://vitejs.dev/) in more recent releases to take advantage of the next-generation of bundlers.

**Vite** includes:

- A dev server for serving source files over native [ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), with [built-in features](https://vitejs.dev/guide/features.html) and fast [Hot Module Replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement).
- Built-in support for [Rollup](https://rollupjs.org/) to compile and bundle source code for production.
- Supports reading [`.env`](https://vitejs.dev/guide/env-and-mode.html) files for environment variables.
- Code formatting rules follow the latest TypeScript recommendations and best practices thanks to [@typescript-eslint/eslint-plugin](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin).

> See all [Vite features](https://vitejs.dev/guide/features.html)

## Electron Packager

[![Packaged](https://img.shields.io/badge/Conveyor-blue?style=for-the-badge)](https://www.hydraulic.dev/)

Prior to [`v1.0.0`](https://github.com/EPICLab/synectic/releases/tag/v1.0.0), we relied on [Electron Builder](https://github.com/electron-userland/electron-builder) for building and publishing Electron distributables. However, we restructured the project to use the project scaffolding included in [Electron Forge](https://www.electronforge.io/) during that first production release.

In the `v5.0.0` release we migrated to [Hydraulic Conveyor](https://conveyor.hydraulic.dev/) for its support of cross-building/signing of all packages from any OS without the need for multi-platform CI, the ability to do synchronous web-style updates on each start of the app, and for the ability to use plain HTTP servers for updates. Conveyor replaces the Electron auto-updaters with [Sparkle](https://sparkle-project.org/) on MacOS, [MSIX](https://learn.microsoft.com/en-us/windows/msix/overview) on Windows, and Linux package repositories.

## Linting

![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white) ![Prettier](https://img.shields.io/badge/Prettier-100000?style=for-the-badge&logo=Prettier&logoColor=FFFFFF&labelColor=ff69b4&color=ff69b4)

We initially relied on [TSLint](https://palantir.github.io/tslint/) as it was the recommended linter for TypeScript projects up until being deprecated in 2019 in favor of the [ESLint](https://eslint.org/) static code analysis tool. We switched to using [ESLint](https://eslint.org/) during the [`v1.0.0`](https://github.com/EPICLab/synectic/releases/tag/v1.0.0) release.

We also added the opinionated code formatter [Prettier](https://prettier.io/) during the [`v4.0.0`](https://github.com/EPICLab/synectic/releases/tag/v4.0.0) release to enforce a consistent code style that is automatically formatted on save.

## UI Framework

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![MUI](https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white)

Originally written as native HTML components and JavaScript event handlers, we transitioned to using [React](https://reactjs.org/) in [`v1.0.0`](https://github.com/EPICLab/synectic/releases/tag/v1.0.0) for building our user interfaces.

**React** includes:

- Declarative nature of components that describe the user interface and how it should change as state changes.
- Component-based architecture that allows for encapsulation of state and behavior.
- A Virtual DOM for fast rendering of components.
- TSX/JSX syntax that allows HTML to be written in TypeScript/JavaScript files.
- One-way data bindings using props and state.
- Interactivity using event handlers.

We also use the [Material-UI](https://material-ui.com/) component library for React to provide a consistent look and feel across the application. Added in the [`v1.0.0`](https://github.com/EPICLab/synectic/releases/tag/v1.0.0) release, **MUI** provides an open-source React component library that implements Google's [Material Design](https://material.io/design) specification.

## State Management

![Redux](https://img.shields.io/badge/redux-%23593d88.svg?style=for-the-badge&logo=redux&logoColor=white)

**Redux** is a predictable state container for TypeScript/JavaScript apps that helps write applications that behave consistently, run in different environments (client, server, and native), and are easy to test. It provides a centralized store for the entire application that is updated by dispatching actions that are handled by reducers. We added Redux as part of the [`v1.0.0`](https://github.com/EPICLab/synectic/releases/tag/v1.0.0) release.

We also include the [React-Redux](https://react-redux.js.org/) bindings for React to allow React components to interact with the Redux store, and the [Redux Toolkit](https://redux-toolkit.js.org/) to simplify the creation of Redux stores and reducers.

## Testing Frameworks

![Vitest](https://img.shields.io/badge/Vitest-100000?style=for-the-badge&logo=Vitest&logoColor=FCC72B&labelColor=729B1A&color=729B1A) ![Testing-Library](https://img.shields.io/badge/-Testing_Library-%23E33332?style=for-the-badge&logo=testing-library&logoColor=white) ![Playwright](https://img.shields.io/badge/playwright-%232EAD33.svg?style=for-the-badge&logo=playwright&logoColor=white)

Originally, we used a combination of the [Mocha](https://mochajs.org/) JavaScript testing framework and the [Chai](https://www.chaijs.com/) BDD/TDD assertion library for Node.js and browser targets. However, we switched to using the [Jest](https://jestjs.io/) JavaScript testing framework in combination with the [React Testing Library (RTL)](https://testing-library.com/) during the `v1.0.0` release.

This has been updated to use [Vitest](https://vitest.dev/), a Vite-native testing framework, for the testing platform. We also employ [Playwright](https://playwright.dev/) for end-to-end testing.

**Vitest** includes:

- A flexible set of configs, transformers, resolvers, and plugins.
- A built-in test runner that runs tests in parallel, and includes a watch mode for HMR-like performance in tests.
- Component testing for Vue, React, Svelte, Lit, Marko and more.
- Built-in support for TypeScript, JSX, and CSS modules.
- ESM support that includes top-level await and dynamic imports.
- Workers multi-threaded via [Tinypool](https://github.com/tinylibs/tinypool).
- Benchmarking support with [Tinybench](https://github.com/tinylibs/tinybench).
- Filtering, timeouts, and concurrent for suite and tests.
- [Workspace](https://vitest.dev/guide/workspace) support.
- [Jest-compatible Snapshots](https://vitest.dev/guide/snapshot).
- [Chai](https://www.chaijs.com/) built-in for assertions and [Jest `expect`](https://jestjs.io/docs/expect) compatible APIs.
- [Tinyspy](https://github.com/tinylibs/tinyspy) built-in for mocking.
- [happy-dom](https://github.com/capricorn86/happy-dom) or [jsdom](https://github.com/jsdom/jsdom) built-in for DOM testing.
- Code coverage via [v8](https://v8.dev/blog/javascript-code-coverage) or [istanbul](https://istanbul.js.org/).
- Rust-like [in-source testing](https://vitest.dev/guide/in-source).
- Type testing via [`expect-type`](https://github.com/mmkal/expect-type).
