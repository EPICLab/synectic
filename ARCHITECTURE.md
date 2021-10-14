# Project Architecture

The configuration of the Synectic project structure is inspired by a detailed blog post from Ankit Sinha, ["Electron-Forge + React + TypeScript = Awesome!"](https://ankitbko.github.io/2019/08/electron-forge-with-react-and-typescript/) (published 2019.07.26). There are many blog posts describing how to setup TypeScript, Electron, and React, but combining them with their related tools, modules, and packages into a project that can be packaged for distribution to Windows, Mac, and Linux platforms is difficult. Additionally, obtaining the latest best-practices steps for each of the underlying technologies is an additional complexity. The blog post from Ankit Sinha appears to be the best description of steps required to use [Electron](#Electron), [Electron-Forge](https://www.electronforge.io/), [Webpack](#Webpack), [TypeScript](#TypeScript), and [React](#React) at this time.

# Electron

[Electron](https://electronjs.org/) is an open-source framework developed and maintained by GitHub. Electron combines the Chromium rendering engine and Node.js runtime in order to provide a desktop GUI application using web technologies.

Synectic uses [`electron-forge`](https://www.electronforge.io/) as the scaffolding for providing a base [Node.js](https://nodejs.org/en/about/) solution and a ready-to-run Electron application. Under the hood, this project uses [`electron-rebuild`](https://github.com/electron/electron-rebuild) to automatically recompile native Node.js modules against the correct Electron version, and [`electron-packager`](https://github.com/electron/electron-packager) for customizing and bundling Electron apps to get them ready for distribution.

The [`electron-devtools-installer`](https://github.com/MarshallOfSound/electron-devtools-installer) module ensures that the Chrome DevTools extension is loaded into Electron.

**Packages:**
* *`dependencies`*
  * `electron-squirrel-startup`
* *`devDependencies`*
  * `@electron-forge/cli`
  * `@electron-forge/maker-deb`
  * `@electron-forge/maker-dmg`
  * `@electron-forge/maker-rpm`
  * `@electron-forge/maker-squirrel`
  * `@electron-forge/maker-zip`
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


**Packages:**
* *`devDependencies`*
  * `@electron-forge/plugin-webpack`
  * `@vercel/webpack-asset-relocator-loader`
  * `css-loader`
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
| Setting                            | Value                               | Description  |
| ---------------------------------- |:-----------------------------------:| ------------:|
| `target`                           | `ES2020`                            | Specify output ECMAScript version to be ES2020 (ES11) |
| `lib`                              | `["DOM", "DOM.Iterable", "ESNext"]` | Injects library definitions for DOM, DOM.Iterable, and ESNext |
| `module`                           | `esnext`                            | Allows for resolving ESNext import syntax (e.g. `import()` and `import.meta`) |
| `moduleResolution`                 |  `node`                             | Determine that modules get resolved consistently with Node.js system |
| `esModuleInterop`                  | `true`                              | Imports CommonJS modules in compliance with ES6 module specs |
| `allowJs`                          | `true`                              | Allow JavaScript files to be compiled |
| `checkJs`                          | `true`                              | Errors are reported in JavaScript files based on type-checking; works in tandem with `allowJs`. |
| `strict`                           | `true`                              | Enables strict type checking |
| `jsx`                              | `react`                             | Emit React elements as JavaScript code with `.js` file extension |
| `skipLibCheck`                     | `true`                              | Skip type checking of all `.d.ts` files (type definition files) |
| `noImplicitAny`                    | `true`                              | Prevent TypeScript fallback to `any` for variables when it cannot infer the type |
| `importsNotUsedAsValues`           | `preserve`                          | Preserve all `import` statements whose values or types are never used |
| `allowSyntheticDefaultImports`     | `true`                              | Allows for simplified syntax for importing defaults |
| `forceConsistentCasingInFileNames` | `true`                              | Disallows inconsistently-cased references to the same file |
| `noUnusedLocals`                   | `true`                              | Report errors if local variables are unused |
| `noUnusedParameters`               | `true`                              | Report errors if parameters are unused |
| `resolveJsonModule`                | `true`                              | Includes modules imported with `.json` extension |
| `isolateModules`                   | `true`                              | TypeScript warns if code cannot be correctly interpreted by a single-file transpilation process |
| `noEmit`                           | `true`                              | Prevent `tsc` from emitting `.js` outputs (i.e. `webpack` create outputs instead) |
| `sourceMap`                        | `true`                              | Enable the generation of sourcemap files for debuggers and other tools to display the original TypeScript source code when working with the emitted JavaScript files |
| `outDir`                           | `"dist"`                            | Emit `.js`, `.d.ts`, and `.js.map` files into this directory |
| `baseUrl`                          | `"."`                               | Base directory to resolve non-absolute module names |
| `paths`                            | `{"*": ["node_modules/*"]}`         | A series of entries which re-map imports to lookup locations relative to the `baseUrl` |


# React

[React](https://reactjs.org/) is a JavaScript library for building user interfaces. It is maintained by Facebook and a community of individual developers and companies. React is a declarative, component-based framework that works with JSX and TSX formats to manage state, route applications, and render HTML injections.

The [`react-dnd`](https://react-dnd.github.io/react-dnd/) module provides a drag and drop library that works with React components and resembles the [Redux](https://github.com/reactjs/react-redux) architecture. The [`react-dnd-html5-backend`](https://react-dnd.github.io/react-dnd/docs/backends/html5) module adds a backend to React-DnD, and uses the [HTML5 drag and drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) under the hood to provide a widely supported base and hide some of [the quirks](http://quirksmode.org/blog/archives/2009/09/the_html5_drag.html).

Synectic uses React for user interface components and integrates those components into Electron using the [`react-dom`](https://reactjs.org/docs/react-dom.html) package, which provides DOM-specific methods that can be used at the top level of an app in order to execute outside of the React model. The [`react-dnd`](https://react-dnd.github.io/react-dnd/) and [`react-dnd-html5-backend`](https://react-dnd.github.io/react-dnd/docs/backends/html5) packages provide drag and drop interactions between React components within Synectic. The [`react-dnd-test-backend`](https://react-dnd.github.io/react-dnd/docs/backends/test) package is a mock backend for testing React DnD apps without the DOM.

The [`react-hot-loader`](https://gaearon.github.io/react-hot-loader/) module is a plugin that allows React components to be live reloaded without the loss of state. It works with Webpack and other bundlers that support Hot Module Replacement (HMR) and Babel plugins. The `react-hot-loader` module is installed as a regular dependency (instead of a dev dependency) since the plugin automatically ensures it is not executed in production and the footprint is minimal.

**Packages:**
* *`dependencies`*
  * `react`
  * `react-dnd`
  * `react-dnd-html5-backend`
  * `react-dom`
  * `react-hot-loader` __THIS MIGHT NOT BE NEEDED ANYMORE__
* *`devDependencies`*
  * `@types/react`
  * `@types/react-dom`
  * `react-dnd-test-backend`

**Configuration:**

Synectic includes [Node.js intergration](https://electronjs.org/docs/tutorial/security), via `webPreferences: { nodeIntegration: true }` in the `electron.BrowserWindow`, to allow React to load and unload components from the DOM render tree.

# Redux

[Redux](https://redux.js.org/) is a predictable state container for JavaScript apps. Redux is a small library with a simple, limited API designed to be a predictable container for application state. It operates in a similar fashion to a [reducing function](https://en.m.wikipedia.org/wiki/Fold_(higher-order_function)) (a functional programming concept). Redux combines with React to allow for separation between state and user interface, with Redux handling state management and React resolving the presentation of state within a user interface. 

Synectic uses Redux to manage stateful data about content that is displayed within React components in the user interface. For example, the state of code in a Code Editor card is managed through Redux and displayed in a React component element. Synectic follows the [Redux Toolkit](https://redux-toolkit.js.org/), which bundles the [`redux`](https://github.com/reduxjs/redux) core, [`redux-thunk`](https://github.com/reduxjs/redux-thunk), [`reselect`](https://github.com/reduxjs/reselect), and [`immer`](https://github.com/mweststrate/immer) modules and default configurations to simplify store setup, creating reducers, immutable update logic, combined as a strongly-typed infrastructure library.

Synectic also uses the `redux-thunk` middleware to allow writing action creators that return a function instead of an action. The [thunk](https://en.wikipedia.org/wiki/Thunk) can be used to delay the dispatch of an action, or to dispatch only if a certain condition is met (i.e. asynchronous or conditional dispatch). The inner function receives the store methods `dispatch` and `getState` as parameters.

The [`redux-devtools`](https://github.com/reduxjs/redux-devtools) module provides a Redux tab in Chrome DevTools for hot reloading, action replay, and a customizable UI for Redux state debugging.

The [`@jedmao/redux-mock-store`](https://github.com/jedmao/redux-mock-store) module is a TypeScript fork of [`reduxjs/redux-mock-store`](https://github.com/reduxjs/redux-mock-store), which provides a mock store for testing Redux async action creators and middleware. The mock store will create an array of dispatched actions which serve as an action log for tests.

The [`redux-persist`](https://github.com/rt2zz/redux-persist) module provides the ability to persist and rehydrate Redux store state between application refreshes and restarts.

**Packages:**
* *`dependencies`*
  * `@reduxjs/toolkit`
  * `react-redux`
* *`devDependencies`*
  * `@types/redux-mock-store`
  * `redux-devtools`
  * `redux-mock-store`
  * `redux-persist`
  * `@jedmao/redux-mock-store` __THIS MIGHT NOT BE NEEDED ANYMORE__

# ESLint

[ESLint](https://eslint.org/) is an extensible static analysis tool for checking JavaScript code for readability, maintainability, and functionality errors.

Synectic uses ESLint to statically analyze TypeScript and React code for compliance with industry-standard syntax rules.

The TypeScript project has typically advocated and maintained [TSLint](https://palantir.github.io/tslint/) for TypeScript static analysis, but has more recently begun to transition towards ESLint in order to take advantage of the more-performant architecture and framework support (e.g. rules for React Hook or Vue); per the TypeScript [roadmap](https://github.com/Microsoft/TypeScript/issues/29288).  Therefore, we have followed the ESLint configuration steps described in a blog post from Christopher Pappas, ["From TSLint to ESLint, or How I Learned to Lint GraphQL Code"](https://artsy.github.io/blog/2019/01/29/from-tslint-to-eslint/) (published 2019.01.29).

The [`@typescript-eslint/eslint-plugin`](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin) module is an ESLint-specific plugin which, when used in conjunction with `@typescript-eslint/parser`, allows for TypeScript-specific linting rules to run. The [`@typescript-eslint/parser`](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser) module provides an ESLint-specific parser which leverages `typescript-estree` and is designed to be used as a replacement for ESLint's default parser, `espree`. 

The [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import) module intends to support linting of ES2015+ (ES6+) import/export syntax, and prevent issues with misspelling of file paths and import names.

The [`eslint-plugin-react`](https://www.npmjs.com/package/eslint-plugin-react) module provides React specific rules for ESLint.

The [`eslint-plugin-jest`](https://www.npmjs.com/package/eslint-plugin-jest) module exports a recommended configuration that enforces good testing practices.

The [`eslint-plugin-testing-library`](https://www.npmjs.com/package/eslint-plugin-testing-library) module provides specific rules for following best practices and anticipating common mistakes when writing tests with [Testing Library](https://testing-library.com/).

The [`eslint-plugin-jest-dom`](https://www.npmjs.com/package/eslint-plugin-jest-dom) module provides specific rules for best practices and anticipating common mistakes when writing tests with [`@testing-library/jest-dom`](https://www.npmjs.com/package/@testing-library/jest-dom).

**Packages:**
* *`devDependencies`*
  * `eslint`
  * `@typescript-eslint/eslint-plugin`
  * `@typescript-eslint/parser`
  * `eslint-plugin-import`
  * `eslint-plugin-jest`
  * `eslint-plugin-jest-dom`
  * `eslint-plugin-react`
  * `eslint-plugin-react-hooks`
  * `eslint-plugin-testing-library`

**Configuration:**

Synectic has the following ESLint options set in `.eslintrc.json`:
| Setting                                    | Value                          | Description                                          |
| ------------------------------------------ |:------------------------------:| ----------------------------------------------------:|
| `env` : `node`                             | `true`                         | Enables Node.js global variables and Node.js scoping |
| `env` : `es2017`                           | `true`                         | Enable all ECMAScript 8 features except for modules (this automatically sets the `ecmaVersion` parser option to `2017`) |
| `env` : `jest`                             | `true`                         | Enables Jest global variables                        |
| `parser`                                   | `@typescript-eslint/parser`    | Specifies [TypeScript-ESLint](https://github.com/typescript-eslint/typescript-eslint) parser in ESLint |
| `parserOptions` : `ecmaVersion`            | `2017`                         | Specify ECMAScript syntax in ESLint to be ES2017 (ES8) compliant |
| `parserOptions` : `sourceType`             | `module`                       | Sets ESLint to recognize ECMAScript modules          |
| `parserOptions` : `jsx`                    | `true`                         | Enables ESLint to parse JSX by recognizing the JSX option in `tsconfig.json` (required per [`typescript-eslint/parser`](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser#configuration)) |
| `parserOptions` : `ecmaFeatures` : `jsx`   | `true`                         | Sets ESLint to recognize [JSX](https://facebook.github.io/jsx/) syntax         |
| `parserOptions` : `useJSXTextNode`         | `true`                         | Prevents ESLint parser from using the legacy style of creating the AST of JSX texts |
| `parserOptions` : `project`                | `./tsconfig.json`              | Required for ESLint to use rules that require type information |
| `plugins`                                  | `["@typescript-eslint", "react", "react-hooks", "jest", "jest-dom", "testing-library"]`    | Enables ESLint plugins `@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jest`, `eslint-plugin-jest-dom`, and `eslint-plugin-testing-library` |
| `extends`                                  | `["eslint:recommended"]`       | ESLint rules for JavaScript and JSX configured from the [ESLint](https://eslint.org/docs/user-guide/configuring) plugin |
| `extends`                                  | `["plugin:@typescript-eslint/eslint-recommended"]` | ESLint rules for TypeScript and TSX configured from the [TypeScript-ESLint](https://github.com/typescript-eslint/typescript-eslint) plugin, per [typescript-eslint in eslint](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#usage) configuration guide |
| `extends`                                  | `["plugin:@typescript-eslint/recommended"]` | ESLint rules that supersede `eslint:recommended` core rules which are not compatible with TypeScript, per [typescript-eslint in eslint](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#usage) configuration guide |
| `extends`                                  | `["plugin:import/warnings"]`  | ESLint rules for raising import errors from `eslint-plugin-import` project |
| `extends`                                  | `["plugin:import/warnings"]`  | ESLint rules for raising import warnings from `eslint-plugin-import` project |
| `extends`                                  | `["plugin:import/typescript"]` | ESLint rules that fix `plugin:imports/warnings` rules to be compatible with TypeScript, per [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import#typescript) installation guide |
| `extends`                                  | `["plugin:jest/recommended"]`  | ESLint rules specific to [Jest](#Jest) syntax from [`eslint-plugin-jest`](https://github.com/jest-community/eslint-plugin-jest) project for enforcing good testing practices |
| `extends`                                  | `["plugin:jest/style"]`        | ESLint rules specific to [Jest](#Jest) test style from [`eslint-plugin-jest`](https://github.com/jest-community/eslint-plugin-jest) project for extending `plugin:jest/recommended` to include stylistic rules |
| `extends`                                  | `["plugin:jest-dom/recommended"]` | ESLint rules specific to `jest-dom` in the [Testing Library](#React-Testing-Library-(RTL)), per [eslint-plugin-jest-dom](https://github.com/testing-library/eslint-plugin-jest-dom) installation guide |
| `extends`                                  | `["plugin:react/recommended"]` | ESLint rules specific to React from [`eslint-plugin-react`](https://github.com/yannickcr/eslint-plugin-react) project |
| `extends`                                  | `["plugin:testing-library/recommended"]` | ESLint rules to enforce best practices when testing using the [Testing Library](#React-Testing-Library-(RTL)), per [eslint-plugin-testing-library](https://github.com/testing-library/eslint-plugin-testing-library) installation guide |
| `settings` : `import/resolver` : `node` : `extensions` | `[".js", ".jsx", ".ts", ".tsx"]` | Sets ESLint import resolver to handle `.js`, `.jsx`, `.ts`, and `.tsx` files |
| `settings` : `react` : `pragma`            | `React`                     | Enables ESLint to property process [JSX pragma](https://laptrinhx.com/what-is-jsx-pragma-2095738289/) comments |
| `settings` : `react` : `version`           | `detect`                    | React version is automatically detected and set by ESLint |
| `rules` | (vary by module or plugin) | Descriptions for each rule are linked or described within each section of the `rules` option block |

# Jest

[Jest](https://jestjs.io/) is a JavaScript testing framework with a focus on simplicity. It is maintained by Facebook, and supports [Babel](https://babeljs.io/), [TypeScript](#TypeScript), [Node.js](https://nodejs.org/en/about/), [React](#React), [Angular](https://angular.io/), and [Vue.js](https://vuejs.org/). Jest is built on top of Jasmine, and serves as a test runner with predefined tests for mocking and stub React components.

Synectic uses Jest for unit testing, integration testing, code coverage, and interfacing with [React Testing Library](#React-Testing-Library-(RTL)) for React component testing.

The [`ts-jest`](https://kulshekhar.github.io/ts-jest/) module is a TypeScript preprocessor with source map support for Jest that lets Synectic use Jest to test projects written in TypeScript. In particular, the choice to use TypeScript (with `ts-jest`) instead of Babel7 (with `@babel/preset-typescript`) is based upon the reasons outlined in a blog post from Kulshekhar Kabra, ["Babel7 or TypeScript"](https://kulshekhar.github.io/ts-jest/user/babel7-or-ts) (published 2018.09.16).

The [`identify-obj-proxy`](https://jestjs.io/docs/en/webpack.html#mocking-css-modules) module is an identity object that uses ES6 proxies for mocking Webpack imports like CSS Modules. This module is used to [mock CSS Modules](https://jestjs.io/docs/en/webpack.html#mocking-css-modules) so that all `className` lookups on the style object will be returned as-is (e.g. `styles.foobar === 'foobar'`). This is pretty handy for React snapshot testing.

The [`react-test-renderer`](https://reactjs.org/docs/test-renderer.html) module provides a React renderer that can be used to render React components to pure JavaScript objects, without depending on the DOM or native mobile environment. Essentially, this packages makes it easy to grab snapshots of the platform view hierarchy (similar to a DOM tree) rendered by a React DOM or React Native component without using a browser or [jsdom](https://github.com/tmpvar/jsdom). This module is specifically required for [testing React apps with Jest](https://jestjs.io/docs/en/tutorial-react).

**Packages:**
* *`devDependencies`*
  * `@types/jest`
  * `identity-obj-proxy`
  * `jest`
  * `ts-jest`


**Configuration:**

Synectic has the following [Jest](#Jest) options set in `jest.config.js`:

| Setting                                    | Value                       | Description  |
| ------------------------------------------ |:---------------------------:| ----------------------------------------------------:|
| `setupFilesAfterEnv`                       | `['<rootDir>/__test__/setupTests.ts']`           | A list of paths to modules that configure or setup the testing framework before each test (i.e. the actions defined in `setupTests.ts` executes after environment setup) |
| `preset` | `ts-jest` | All TypeScript files (`.ts` and `.tsx`) will be handled by `ts-jest`; JavaScript files are not processed |
| `roots` | `['<rootDir>/__test__']` | Jest will only search for test files in the `__test__` directory |
| `snapshotSerializers` | `['jest-serializer-path']` | Enables the `jest-serializer-path` for removing absolute paths and normalizing paths across all platforms in Jest snapshots |
| `moduleNameMapper` | `{"\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": '<rootDir>/__mocks__/fileMock.js'}` | Use a mocked CSS proxy for CSS Modules via [`identity-obj-proxy`](https://jestjs.io/docs/en/webpack#mocking-css-modules) during testing |
| `moduleNameMapper` | `{"\\.(css|less)$": 'identity-obj-proxy'}` | Mocks all static assets (e.g. stylesheets and images) during testing |
| `moduleNameMapper` | `{"^dnd-cores$": "dnd-core/dist/cjs", "^react-dnd$": "react-dnd/dist/cjs", "^react-dnd-html5-backend$": "react-dnd-html5-backend/dist/cjs", "^react-dnd-touch-backend$": "react-dnd-touch-backend/dist/cjs", "^react-dnd-test-backend$": "react-dnd-test-backend/dist/cjs", "^react-dnd-test-utils$": "react-dnd-test-utils/dist/cjs"}` | Jest does not work well with ES Modules yet, but can use CommonJS builds for `react-dnd` libraries (per [React DnD testing docs](https://react-dnd.github.io/react-dnd/docs/testing)) |

# React Testing Library (RTL)

[Testing Library](https://testing-library.com/) is a family of testing utility libraries that adhere to the guiding principle that _"the more your tests resemble the way your software is used, the more confidence they can give you."_ The manifestation of this principle is that tests are composed by querying for nodes in similar fashion to how users would find them (which makes this methodology ideal for UI testing). The [`React Testing Library` (RTL)](https://testing-library.com/docs/react-testing-library/intro) builds on top of the [`DOM Testing Library`](https://testing-library.com/docs/dom-testing-library/intro) by adding APIs for working with React components.

Synectic uses React Testing Library to render React components within tests written using Jest's custom assertions and convenience functions in order to verify UI interactions. The configuration of RTL was inspired by a detailed blog post from Robert Cooper, ["Testing Stateful React Function Components with React Testing Library"](https://www.robertcooper.me/testing-stateful-react-function-components-with-react-testing-library) (published 2019.04.08). In particular, the blog posting provides examples of testing React function components using [React Testing Library](#React-Testing-Library-(RTL)), and finds that there are less chances of test suites that produce false negatives (tests that fail when the underlying implementation changes) and false positives (tests that continue to pass when the underlying implementation is broken) when adhering what Kent C. Dodds calls [_"implementation detail free testing"_](https://kentcdodds.com/blog/testing-implementation-details).

The [`@testing-library/jest-dom`](https://testing-library.com/docs/ecosystem-jest-dom) module provides custom DOM element matchers for Jest. It recommends the use of [`eslint-plugin-jest-dom`](https://github.com/testing-library/eslint-plugin-jest-dom), which provides auto-fixable lint rules that prevent false positive tests and improves test readability by ensuring you are using the right matchers in your tests ([ESLint](#ESLint) for related configuration options).

The [`react-select-event`](https://testing-library.com/docs/ecosystem-react-select-event) module is a companion library for `React Testing Library` that provides helper methods for interacting with [`react-select`](https://github.com/JedWatson/react-select) elements.

The [`@testing-library/react-hooks`](https://github.com/testing-library/react-hooks-testing-library) module allows for React hooks testing by wrapping the hook in a function component, and providing various useful utility functions for updating the inputs and retrieving the outputs of custom hooks without having to construct, render, or interact with additional React components. It has peer dependencies with the `react` and `react-test-renderer` packages.

**Packages:**
* *`devDependencies`*
  * `@testing-library/dom`
  * `@testing-library/jest-dom`
  * `@testing-library/react`
  * `@testing-library/react-hooks`
  * `react-select-event`
  * `react-test-renderer`