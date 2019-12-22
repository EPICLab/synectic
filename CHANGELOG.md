# 1.0.0 (2019.X.X)

- Rebase project structure using [Electron-Forge](https://www.electronforge.io/) for building and publishing distributables.
- Added [React](https://reactjs.org/) for declarative user interface design and interactions.
- Added [Redux](https://redux.js.org/) for a predictable state container and data layer.
- Swapped [Mocha](https://mochajs.org/)/[Chai](https://www.chaijs.com/) with [Jest](https://jestjs.io/)/[Enzyme](https://airbnb.io/enzyme/) for test infrastructure.
- Swapped [TSLint](https://palantir.github.io/tslint/) with [ESLint](https://eslint.org/) for linting JavaScript/TypeScript/React code.
- Added file IO support for loading `Card` elements with code.

# 0.7.0 (2018.02.13)

- Rebase all elements to [TypeScript](https://www.typescriptlang.org/) for typed components.
- Added [Webpack](https://webpack.js.org/) for transpiling TypeScript code to JavaScript and bundling app.
- Added [TSLint](https://palantir.github.io/tslint/) for linting TypeScript.
- Converted `Canvas` and `Card` elements to TypeScript.
- Defined `Stack` element for grouping multiple `Card` instances on a `Canvas`.
- Removed `Loader` utility component and added filetype handling to `webpack` config.

# 0.6.0 (2017.08.23)

- Migrate and rename project from [`bonsai`](https://github.com/nelsonni/bonsai) to [`synectic`](https://github.com/SarmaResearch/synectic).
- Configured default [Electron](https://electronjs.org/) app.
- Defined `Canvas` element for base context layer of all interactive elements.
- Defined `Card` element for base interactive content container.
- Added `Error`, `AppMenu`, `AppManager`, and `Loader` utility components.
