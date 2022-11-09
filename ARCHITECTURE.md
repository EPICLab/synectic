# Project Architecture

The configuration of the Synectic project structure is inspired by a detailed blog post from Ankit Sinha, ["Electron-Forge + React + TypeScript = Awesome!"](https://ankitbko.github.io/2019/08/electron-forge-with-react-and-typescript/) (published 2019.07.26). There are many blog posts describing how to setup TypeScript, Electron, and React, but combining them with their related tools, modules, and packages into a project that can be packaged for distribution to Windows, Mac, and Linux platforms is difficult. Additionally, obtaining the latest best-practices steps for each of the underlying technologies is an additional complexity. The blog post from Ankit Sinha appears to be the best description of steps required to use [Electron](#Electron), [Electron-Forge](https://www.electronforge.io/), [Webpack](#Webpack), [TypeScript](#TypeScript), and [React](#React) at this time.

# Electron

[Electron](https://electronjs.org/) is an open-source framework developed and maintained by GitHub. Electron combines the Chromium rendering engine and Node.js runtime in order to provide a desktop GUI application using web technologies.

Synectic uses [`electron-forge`](https://www.electronforge.io/) as the scaffolding for providing a base [Node.js](https://nodejs.org/en/about/) solution and a ready-to-run Electron application. Under the hood, this project uses [`electron-rebuild`](https://github.com/electron/electron-rebuild) to automatically recompile native Node.js modules against the correct Electron version, and [`electron-packager`](https://github.com/electron/electron-packager) for customizing and bundling Electron apps to get them ready for distribution.

The [`electron-devtools-installer`](https://github.com/MarshallOfSound/electron-devtools-installer) module ensures that the Chrome DevTools extension, and any other [supported extensions](https://github.com/MarshallOfSound/electron-devtools-installer#what-extensions-can-i-use), are loaded into Electron.

**Packages:**
* *`dependencies`*
  * `electron-squirrel-startup`
* *`devDependencies`*
  * `@electron-forge/cli`
  * `@electron-forge/maker-deb`
  * `@electron-forge/maker-dmg`
  * `@electron-forge/maker-rpm`
  * `@electron-forge/maker-squirrel`
  * `@electron-forge/plugin-webpack`
  * `electron-devtools-installer`

**Configuration:**

Synectic adheres to the configuration instructions of [Electron-Forge](https://www.electronforge.io/configuration) for the `forge.config.js` file, which specifically indicate that the `packagerConfig` options map directly to the options sent to `electron-packager` (and are documented in the [Electron Packager API docs](https://github.com/electron-userland/electron-packager/blob/master/docs/api.md)), and the `electronPackagerConfig` options map directly to the options sent to `electron-rebuild` (and are documented in the [Electron Rebuild API docs](https://github.com/electron/electron-rebuild#how-can-i-integrate-this-into-grunt--gulp--whatever)).

# Webpack

[Webpack](https://webpack.js.org/) is an open-source JavaScript module bundler. Webpack takes modules with dependencies and generates static assets by generating and maintaining a dependency graph. Webpack allows [Loaders](https://webpack.js.org/concepts/loaders/) for transformations to be applied on the source code of modules. These Loaders allow for pre-processing files prior to importing or loading their content into a namespace.

Synectic uses the [`Webpack Template`](https://www.electronforge.io/templates/webpack-template) feature in `electron-forge` to make use of the `@electron-forge/plugin-webpack` module and get a working `webpack` setup that also works with Electron.

Several Webpack Loaders are include in Synectic:
* [`style-loader`](https://webpack.js.org/loaders/style-loader/): Injects CSS into the DOM as a style block.
* [`css-loader`](https://webpack.js.org/loaders/css-loader/): Converts the resulting CSS (after CSS style and CSS module loading) to JavaScript prior to bundling.
* [`node-loader`](https://webpack.js.org/loaders/node-loader/): A [Node.js add-ons](https://nodejs.org/dist/latest/docs/api/addons.html) loader for `enhanced-require`, this loader executes add-ons in [`enhanced-require`](https://github.com/webpack/enhanced-require).

Additionally, we take advantage of [Asset Modules](https://webpack.js.org/guides/asset-modules/) for using asset files (fonts, icons, etc.) without configuring additional loaders.

The [`fork-ts-checker-webpack-plugin`](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) is a Webpack plugin that runs the TypeScript type checker on a separate process.

**Packages:**
* *`devDependencies`*
  * `@electron-forge/plugin-webpack`
  * `@vercel/webpack-asset-relocator-loader`
  * `css-loader`
  * `fork-ts-checker-webpack-plugin`
  * `node-loader`
  * `style-loader`
  * `webpack`

# TypeScript

[TypeScript](https://www.typescriptlang.org/) is an open-source programming language developed and maintained by Microsoft. It is a strict syntactical superset of JavaScript, and adds optional static typing to the language.

Synectic uses TypeScript as the programming language for application logic and source files. Since Electron is not natively capable of loading TypeScript files, we use [`ts-loader`](https://github.com/TypeStrong/ts-loader) to allow `webpack` to compile all TypeScript files into JavaScript files prior to loading into Electron.

The [`fork-ts-checker-webpack-plugin`](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) is a Webpack plugin that runs the TypeScript type checker on a separate process.

**Packages:**
* *`devDependencies`*
  * `ts-loader`
  * `typescript`
  * `fork-ts-checker-webpack-plugin`

**Configuration:**

Synectic has the following `CompilerOptions` set in `tsconfig.json`:
| Setting                                                                                            | Value                       | Description                                                                                       |
| -------------------------------------------------------------------------------------------------- |:---------------------------:| -------------------------------------------------------------------------------------------------:|
| [`target`](https://www.typescriptlang.org/tsconfig#target)                                         | `ES6`                       | Specify output ECMAScript version to be ES2015 (ES6)                                              |
| [`allowJs`](https://www.typescriptlang.org/tsconfig#allowJs)                                       | `true`                      | Allow JavaScript files to be compiled                                                             |
| [`module`](https://www.typescriptlang.org/tsconfig#module)                                         | `commonjs`                  | Allows the Node.js loader for CommonJS modules.                                                   |
| [`skipLibCheck`](https://www.typescriptlang.org/tsconfig#skipLibCheck)                             | `true`                      | Skip type checking of all `.d.ts` files (type definition files)                                   |
| [`esModuleInterop`](https://www.typescriptlang.org/tsconfig#esModuleInterop)                       | `true`                      | Imports CommonJS modules in compliance with ES6 module specs                                      |
| [`strictNullChecks`](https://www.typescriptlang.org/tsconfig#strictNullChecks)                     | `true`                      | Enables `null` and `undefined` to have their own distinct types                                   |
| [`exactOptionalPropertyTypes`](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes) | `true`                      | Apply stricter rules for TS to handle properties on `type` or `interface` with `?` prefix         |
| [`useUnknownInCatchVariables`](https://www.typescriptlang.org/tsconfig#useUnknownInCatchVariables) | `true`                      | Enable TS 4.0 support for changing the type of variable in a catch clause from `any` to `unknown` |
| [`noImplicitAny`](https://www.typescriptlang.org/tsconfig#noImplicitAny)                           | `true`                      | Prevent TypeScript fallback to `any` for variables when it cannot infer the type                  |
| [`noUncheckedIndexedAccess`](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)     | `true`                      | Add `undefined` to any undeclared field in an object type                                         |
| [`sourceMap`](https://www.typescriptlang.org/tsconfig#sourceMap)                                   | `true`                      | Enable generating sourcemap files for debuggers/tools to display the original TypeScript source code when working with emitted JavaScript files |
| [`baseUrl`](https://www.typescriptlang.org/tsconfig#baseUrl)                                       | `"."`                       | Base directory to resolve non-absolute module names                                               |
| [`jsx`](https://www.typescriptlang.org/tsconfig#jsx)                                               | `react`                     | Emit React elements as JavaScript code with `.js` file extension |
| `outDir`                                                                                           | `"dist"`                    | Emit `.js`, `.d.ts`, and `.js.map` files into this directory |
| [`moduleResolution`](https://www.typescriptlang.org/tsconfig#moduleResolution)                     |  `node`                     | Determine that modules get resolved consistently with Node.js system |
| [`resolveJsonModule`](https://www.typescriptlang.org/tsconfig#resolveJsonModule)                   |                             | |
| `paths`                                                                                            | `{"*": ["node_modules/*"]}` | A series of entries which re-map imports to lookup locations relative to the `baseUrl` |

# React

[React](https://reactjs.org/) is a JavaScript library for building user interfaces. It is maintained by Facebook and a community of individual developers and companies. React is a declarative, component-based framework that works with JSX and TSX formats to manage state, route applications, and render HTML injections.

The [`react-ace`](https://github.com/securingsincity/react-ace) module provides a set of React components for using the Ace code editor ([Ajax.org Cloud9 Editor](https://github.com/ajaxorg/ace)).

The [`react-dnd`](https://react-dnd.github.io/react-dnd/) module provides a drag and drop library that works with React components and resembles the [Redux](https://github.com/reactjs/react-redux) architecture. The [`react-dnd-html5-backend`](https://react-dnd.github.io/react-dnd/docs/backends/html5) module adds a backend to React-DnD, and uses the [HTML5 drag and drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) under the hood to provide a widely supported base and hide some of [the quirks](http://quirksmode.org/blog/archives/2009/09/the_html5_drag.html). The [`react-dnd-preview`](https://louisbrunner.github.io/dnd-multi-backend/packages/react-dnd-preview/) modules emulates a drag and drop "ghost" preview when a backend system does not provide one or a custom preview is preferred.

Synectic uses React for user interface components and integrates those components into Electron using the [`react-dom`](https://reactjs.org/docs/react-dom.html) package, which provides DOM-specific methods that can be used at the top level of an app in order to execute outside of the React model. The [`react-dnd`](https://react-dnd.github.io/react-dnd/) and [`react-dnd-html5-backend`](https://react-dnd.github.io/react-dnd/docs/backends/html5) packages provide drag and drop interactions between React components within Synectic. The [`react-dnd-preview`](https://louisbrunner.github.io/dnd-multi-backend/packages/react-dnd-preview/) package provides a preview during drag and drop interactiosn between React components within Synectic. The [`react-dnd-test-backend`](https://react-dnd.github.io/react-dnd/docs/backends/test) package is a mock backend for testing React DnD apps without the DOM, and [`react-dnd-test-utils`](https://react-dnd.github.io/react-dnd/docs/testing) package provides convenience utility functions for testing React DnD interactions (e.g. `wrapInTestContext`).

**Packages:**
* *`dependencies`*
  * `react`
  * `react-ace`
  * `react-dnd`
  * `react-dnd-html5-backend`
  * `react-dnd-preview`
  * `react-dom`
* *`devDependencies`*
  * `@types/react`
  * `@types/react-dom`
  * `@types/react-transition-group`
  * `react-dnd-test-backend`
  * `react-dnd-test-utils`

**Configuration:**

Synectic includes [Node.js intergration](https://electronjs.org/docs/tutorial/security), via `webPreferences: { nodeIntegration: true }` in the `electron.BrowserWindow`, to allow React to load and unload components from the DOM render tree.

# Redux

[Redux](https://redux.js.org/) is a predictable state container for JavaScript apps. Redux is a small library with a simple, limited API designed to be a predictable container for application state. It operates in a similar fashion to a [reducing function](https://en.m.wikipedia.org/wiki/Fold_(higher-order_function)) (a functional programming concept). Redux combines with React to allow for separation between state and user interface, with Redux handling state management and React resolving the presentation of state within a user interface. 

Synectic uses Redux to manage stateful data about content that is displayed within React components in the user interface. For example, the state of code in a Editor card is managed through Redux and displayed in a React component element. Synectic uses [Redux Toolkit](https://redux-toolkit.js.org/), which bundles the [`redux`](https://github.com/reduxjs/redux) core, [`redux-thunk`](https://github.com/reduxjs/redux-thunk), [`reselect`](https://github.com/reduxjs/reselect), and [`immer`](https://github.com/mweststrate/immer) modules and default configurations to simplify store setup, creating reducers, immutable update logic, and combined as a strongly-typed infrastructure library.

Synectic relies heavily on the use of `thunks` via the [`createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk) function in [Redux Toolkit](https://redux-toolkit.js.org/), which allows writing action creators that return a function instead of an action. The [thunk](https://en.wikipedia.org/wiki/Thunk) can be used to delay the dispatch of an action, or to dispatch only if a certain condition is met (i.e. asynchronous or conditional dispatch). The inner function receives the store methods `dispatch` and `getState` as parameters.

Additionally, the [`redux-devtools`](https://github.com/reduxjs/redux-devtools) module provides a Redux tab in Chrome DevTools for hot reloading, action replay, and a customizable UI for Redux state debugging. This module is automatically enabled via the [`configureStore.devTools`](https://redux-toolkit.js.org/api/configureStore#devtools) option and adding [`REDUX_DEVTOOLS`](https://github.com/reduxjs/redux-devtools/tree/main/extension#3-for-electron) in [`electron-devtools-installer`](https://github.com/MarshallOfSound/electron-devtools-installer).

The [`reduxjs/redux-mock-store`](https://github.com/reduxjs/redux-mock-store) module, which provides a mock store for testing Redux async action creators and middleware. The mock store will create an array of dispatched actions which serve as an action log for tests.

The [`redux-persist`](https://github.com/rt2zz/redux-persist) module provides the ability to persist and rehydrate Redux store state between application refreshes and restarts.

**Packages:**
* *`dependencies`*
  * `@reduxjs/toolkit`
  * `react-redux`
  * `redux`
  * `redux-persist`
* *`devDependencies`*
  * `@types/redux-mock-store`
  * `electron-devtools-installer`
  * `redux-mock-store`

# ESLint

[ESLint](https://eslint.org/) is an extensible static analysis tool for checking JavaScript code for readability, maintainability, and functionality errors.

Synectic uses ESLint to statically analyze TypeScript and React code for compliance with industry-standard syntax rules.

The TypeScript project has typically advocated and maintained [TSLint](https://palantir.github.io/tslint/) for TypeScript static analysis, but has more recently begun to transition towards ESLint in order to take advantage of the more-performant architecture and framework support (e.g. rules for React Hook or Vue); per the TypeScript [roadmap](https://github.com/Microsoft/TypeScript/issues/29288).  Therefore, we have followed the ESLint configuration steps described in a blog post from Christopher Pappas, ["From TSLint to ESLint, or How I Learned to Lint GraphQL Code"](https://artsy.github.io/blog/2019/01/29/from-tslint-to-eslint/) (published 2019.01.29).

The [`@typescript-eslint/eslint-plugin`](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin) module is an ESLint-specific plugin which, when used in conjunction with `@typescript-eslint/parser`, allows for TypeScript-specific linting rules to run. The [`@typescript-eslint/parser`](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser) module provides an ESLint-specific parser which leverages `typescript-estree` and is designed to be used as a replacement for ESLint's default parser, `espree`.

The [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import) module intends to support linting of ES2015+ (ES6+) import/export syntax, and prevent issues with misspelling of file paths and import names. The [`eslint-plugin-jsdoc`](https://github.com/gajus/eslint-plugin-jsdoc) plugin provides [JSDoc](https://jsdoc.app/) linting rules for ESLint. The [`eslint-plugin-react-hooks`](https://reactjs.org/docs/hooks-rules.html#eslint-plugin) plugin enforces the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html) in React components and is part of the [Hooks API](https://reactjs.org/docs/hooks-intro.html) for React. The [`eslint-plugin-testing-library`](https://www.npmjs.com/package/eslint-plugin-testing-library) module provides specific rules for following best practices and anticipating common mistakes when writing tests with [Testing Library](https://testing-library.com/).

**Packages:**
* *`devDependencies`*
  * `@typescript-eslint/eslint-plugin`
  * `@typescript-eslint/parser`
  * `eslint`
  * `eslint-plugin-import`
  * `eslint-plugin-jsdoc`
  * `eslint-plugin-react-hooks`
  * `eslint-plugin-testing-library`

**Configuration:**

Synectic has the following ESLint options set in `.eslintrc.json`:
| Setting                                    | Value                          | Description                                          |
| ------------------------------------------ |:------------------------------:| ----------------------------------------------------:|
| `env` : `browser`                          | `true`                         | Enables browser global variables |
| `env` : `es6`                              | `true`                         | Enables all ECMAScript 6 features except for modules (this automatically sets the `ecmaVersion` parser option to 6) |
| `env` : `node`                             | `true`                         | Enables Node.js global variables and Node.js scoping |
| `env` : `jest`                             | `true`                         | Enables Jest global variables                        |
| `parser`                                   | `@typescript-eslint/parser`    | Specifies [TypeScript-ESLint](https://github.com/typescript-eslint/typescript-eslint) parser in ESLint |
| `extends`                                  | `["eslint:recommended"]`       | ESLint rules for JavaScript and JSX configured from the [ESLint](https://eslint.org/docs/user-guide/configuring) plugin |
| `extends`                                  | `["plugin:@typescript-eslint/eslint-recommended"]` | ESLint rules for TypeScript and TSX configured from the [TypeScript-ESLint](https://github.com/typescript-eslint/typescript-eslint) plugin, per [typescript-eslint in eslint](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#usage) configuration guide |
| `extends`                                  | `["plugin:@typescript-eslint/recommended"]` | ESLint rules that supersede `eslint:recommended` core rules which are not compatible with TypeScript, per [typescript-eslint in eslint](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#usage) configuration guide |
| `extends`                                  | `["plugin:import/core-modules"]`  | Array of additional modules to consider as "core" modules in the ESLint resolver, per [eslint-plugin-import](https://github.com/import-js/eslint-plugin-import#importcore-modules) settings guide |
| `extends`                                  | `["plugin:import/recommended"]`  | ESLint rules for raising import errors and warnings from `eslint-plugin-import` project |
| `extends`                                  | `["plugin:import/typescript"]` | ESLint rules that fix `plugin:imports/warnings` rules to be compatible with TypeScript, per [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import#typescript) installation guide |
| `extends`                                  | `["plugin:testing-library/react"]` | ESLint rules to enforce recommended rules for [React Testing Library](#React-Testing-Library-(RTL)), per [eslint-plugin-testing-library](https://github.com/testing-library/eslint-plugin-testing-library#react) installation instructions |
| `extends`                                  | `["plugin:react-hooks/recommended"]` | ESLint rules to enforce the [Rules of Hooks](), per [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) installation instructions |
| `rules` : `jsdoc/require-param-type`       | `off` | Disables ESLint rule that requires each `@param` in a JSDoc comment to have a `type` value |
| `settings` : `import/core-modules`         | `[ "electron" ]` | Sets ESLint import resolver to include `electron` as a core module |

# Jest

[Jest](https://jestjs.io/) is a JavaScript testing framework with a focus on simplicity. It is maintained by Facebook, and supports [Babel](https://babeljs.io/), [TypeScript](#TypeScript), [Node.js](https://nodejs.org/en/about/), [React](#React), [Angular](https://angular.io/), and [Vue.js](https://vuejs.org/). Jest is built on top of Jasmine, and serves as a test runner with predefined tests for mocking and stub React components.

Synectic uses Jest for unit testing, integration testing, code coverage, and interfacing with [React Testing Library](#React-Testing-Library-(RTL)) for React component testing.

The [`ts-jest`](https://kulshekhar.github.io/ts-jest/) module is a TypeScript preprocessor with source map support for Jest that lets Synectic use Jest to test projects written in TypeScript. In particular, the choice to use TypeScript (with `ts-jest`) instead of Babel7 (with `@babel/preset-typescript`) is based upon the reasons outlined in a blog post from Kulshekhar Kabra, ["Babel7 or TypeScript"](https://kulshekhar.github.io/ts-jest/user/babel7-or-ts) (published 2018.09.16).

The [`identify-obj-proxy`](https://jestjs.io/docs/en/webpack.html#mocking-css-modules) module is an identity object that uses ES6 proxies for mocking Webpack imports like CSS Modules. This module is used to [mock CSS Modules](https://jestjs.io/docs/en/webpack.html#mocking-css-modules) so that all `className` lookups on the style object will be returned as-is (e.g. `styles.foobar === 'foobar'`). This is pretty handy for React snapshot testing.

The [`jest-esm-transformer`](https://github.com/ActuallyACat/jest-esm-transformer) module is a Jest utility that transforms `esm` files into `cjs`, so that they can be parsed by Jest. The [`jest-serializer-path`](https://github.com/tribou/jest-serializer-path) module removes absolute paths and normalizes paths across platforms in your Jest snapshots. The [`@testing-library/jest-dom`](https://github.com/testing-library/jest-dom) module provides custom Jest matchers to test the state of the DOM.

**Packages:**
* *`devDependencies`*
  * `@testing-library/jest-dom`
  * `@types/jest`
  * `identity-obj-proxy`
  * `jest`
  * `jest-esm-transformer`
  * `jest-serializer-path`
  * `ts-jest`

**Configuration:**

Synectic has the following [Jest](#Jest) options set in `jest.config.js`:

| Setting                                    | Value                       | Description  |
| ------------------------------------------ |:---------------------------:| ----------------------------------------------------:|
| `testEnvironment`                          | `jsdom`                     | Enables Jest to use a browser-like environment as the testing enviroment (per [Configuring Jest](https://jestjs.io/docs/configuration#testenvironment-string) documentation) |
| `setupFilesAfterEnv`                       | `['<rootDir>/src/test-utils/setupTests.ts']`           | A list of paths to modules that configure or setup the testing framework before each test (i.e. the actions defined in `setupTests.ts` executes after environment setup) |
| `preset` | `ts-jest` | All TypeScript files (`.ts` and `.tsx`) will be handled by `ts-jest`; JavaScript files are not processed |
| `snapshotSerializers` | `['jest-serializer-path']` | Enables the `jest-serializer-path` for removing absolute paths and normalizing paths across all platforms in Jest snapshots |
| `cleawrMocks` | `true` | Automatically clear mock calls, instances, contexts and results before every test (per [Configuring Jest](https://jestjs.io/docs/configuration#clearmocks-boolean)) |
| `transformIgnorePatterns` | `[]` | |
| `transform` | <div style="max-width:350px">`{"\\.m?js?$": "jest-esm-transformer"}`</div> | Enables the use of the `jest-esm-transformer` module to transform `esm` files to `cjs` before being parsed by Jest |
| `moduleNameMapper` | <div style="max-width:350px">`{"\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": '<rootDir>/__mocks__/fileMock.js'}`</div> | Use a mocked CSS proxy for CSS Modules via [`identity-obj-proxy`](https://jestjs.io/docs/en/webpack#mocking-css-modules) during testing |
| `moduleNameMapper` | <div style="max-width:350px">`{"ace-builds": "<rootDir>/node_modules/ace-builds", "electron": "<rootDir>/src/test-utils/mock-electron.ts"}`</div> | Enables the [`ace-builds/webpack-resolver`](https://github.com/securingsincity/react-ace/issues/725#issuecomment-543109155) module in [`react-ace`](https://github.com/securingsincity/react-ace) to dynamically resolve language syntax files using [`file-loader`](https://github.com/webpack-contrib/file-loader) |
| `moduleNameMapper` | `{"electron": "<rootDir>/src/test-utils/mock-electron.ts"}` | Use a mocked Electron instance for stubbed functions during testing (per [Mock ES6 imports and dependencies for testing in Jest](https://www.jamestease.co.uk/blether/mock-es6-imports-with-jest/)) |
| `moduleNameMapper` | `{"\\.(css|less)$": 'identity-obj-proxy'}` | Mocks all static assets (e.g. stylesheets and images) during testing |
| `moduleNameMapper` | <div style="max-width:350px">`{"^dnd-cores$": "dnd-core/dist/cjs", "^react-dnd$": "react-dnd/dist/cjs", "^react-dnd-html5-backend$": "react-dnd-html5-backend/dist/cjs", "^react-dnd-touch-backend$": "react-dnd-touch-backend/dist/cjs", "^react-dnd-test-backend$": "react-dnd-test-backend/dist/cjs", "^react-dnd-test-utils$": "react-dnd-test-utils/dist/cjs"}`</div> | Jest does not work well with ES Modules yet, but can use CommonJS builds for `react-dnd` libraries (per [React DnD testing docs](https://react-dnd.github.io/react-dnd/docs/testing)) |

# React Testing Library (RTL)

[Testing Library](https://testing-library.com/) is a family of testing utility libraries that adhere to the guiding principle that _"the more your tests resemble the way your software is used, the more confidence they can give you."_ The manifestation of this principle is that tests are composed by querying for nodes in similar fashion to how users would find them (which makes this methodology ideal for UI testing). The [`React Testing Library` (RTL)](https://testing-library.com/docs/react-testing-library/intro) builds on top of the [`DOM Testing Library`](https://testing-library.com/docs/dom-testing-library/intro) by adding APIs for working with React components.

Synectic uses React Testing Library to render React components within tests written using Jest's custom assertions and convenience functions in order to verify UI interactions. The configuration of RTL was inspired by a detailed blog post from Robert Cooper, ["Testing Stateful React Function Components with React Testing Library"](https://www.robertcooper.me/testing-stateful-react-function-components-with-react-testing-library) (published 2019.04.08). In particular, the blog posting provides examples of testing React function components using [React Testing Library](#React-Testing-Library-(RTL)), and finds that there are less chances of test suites that produce false negatives (tests that fail when the underlying implementation changes) and false positives (tests that continue to pass when the underlying implementation is broken) when adhering what Kent C. Dodds calls [_"implementation detail free testing"_](https://kentcdodds.com/blog/testing-implementation-details).

The [`@testing-library/jest-dom`](https://testing-library.com/docs/ecosystem-jest-dom) module provides custom DOM element matchers for Jest. It recommends the use of [`eslint-plugin-jest-dom`](https://github.com/testing-library/eslint-plugin-jest-dom), which provides auto-fixable lint rules that prevent false positive tests and improves test readability by ensuring you are using the right matchers in your tests ([ESLint](#ESLint) for related configuration options).

The [`@testing-library/react-hooks`](https://github.com/testing-library/react-hooks-testing-library) module allows for React hooks testing by wrapping the hook in a function component, and providing various useful utility functions for updating the inputs and retrieving the outputs of custom hooks without having to construct, render, or interact with additional React components. It has peer dependencies with the `react` and `react-test-renderer` packages.

The [`@testing-library/user-event`](https://github.com/testing-library/user-event) module provides the ability to simulate the real events that would happen in the browser as the user interacts with it. This enables adherence to Kent C. Dodd's principle idea that ["The more your tests resemble the way your software is used, the more confidence they can give you."](https://twitter.com/kentcdodds/status/977018512689455106).

The [`eslint-plugin-testing-library`](https://testing-library.com/docs/ecosystem-eslint-plugin-testing-library/) is an ESLint plugin for [Testing Library](https://testing-library.com/) that helps users to follow best practices and anticipate common mistakes when writing tests ([ESLint](#ESLint) for related configuration options).

**Packages:**
* *`devDependencies`*
  * `@testing-library/dom`
  * `@testing-library/jest-dom`
  * `@testing-library/react`
  * `@testing-library/react-hooks`
  * `@testing-library/user-event`
  * `eslint-plugin-testing-library`