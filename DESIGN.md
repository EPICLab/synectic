# Project Configuration

The configuration of the Synectic project structure is inspired by a detailed blog post from Ankit Sinha, ["Electron-Forge + React + TypeScript = Awesome!"](https://ankitbko.github.io/2019/08/electron-forge-with-react-and-typescript/) (published 2019.07.26). There are many blog posts describing how to setup TypeScript, Electron, and React, but combining them with their related tools, modules, and packages into a project that can be packaged for distribution to Windows, Mac, and Linux platforms is difficult. Additionally, obtaining the latest best-practices steps for each of the underlying technologies is an additional complexity. The blog post from Ankit Sinha appears to be the best description of steps required to use [Electron](#Electron), [Electron-Forge](https://www.electronforge.io/), [Webpack](#Webpack), [TypeScript](#TypeScript), and [React](#React) at this time.

# Electron

[Electron](https://electronjs.org/) is an open-source framework developed and maintained by GitHub. Electron combines the Chromium rendering engine and Node.js runtime in order to provide a desktop GUI application using web technologies.

Synectic uses [`electron-forge`](https://www.electronforge.io/) as the scaffolding for providing a base [Node.js](https://nodejs.org/en/about/) solution and a ready-to-run Electron application.

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
  * `@marshallofsound/webpack-asset-relocator-loader`
  * `electron-devtools-installer`

# Webpack

[Webpack](https://webpack.js.org/) is an open-source JavaScript module bundler. Webpack takes modules with dependencies and generates static assets by generating and maintaining a dependency graph. Webpack allows [Loaders](https://webpack.js.org/concepts/loaders/) for transformations to be applied on the source code of modules. These Loaders allow for pre-processing files prior to importing or loading their content into a namespace.

Synectic uses the [`Webpack Template`](https://www.electronforge.io/templates/webpack-template) feature in `electron-forge` to make use of the `@electron-forge/plugin-webpack` module and get a working `webpack` setup that also works with Electron.

Several Webpack Loaders are include in Synectic:
* [`style-loader`](https://webpack.js.org/loaders/style-loader/): Injects CSS into the DOM as a style block.
* [`css-modules-typescript-loader`](https://github.com/seek-oss/css-modules-typescript-loader): Generates TypeScript declaration files (`*.css.d.ts`) for [CSS Modules](https://github.com/css-modules/css-modules).
* [`css-loader`](https://webpack.js.org/loaders/css-loader/): Converts the resulting CSS (after CSS style and CSS module loading) to JavaScript prior to bundling.
* [`file-loader`](https://webpack.js.org/loaders/file-loader/): Resolves `import`/`require()` on a file into a `url` and emits the file into the output directory.
* [`node-loader`](https://webpack.js.org/loaders/node-loader/): A [Node.js add-ons](https://nodejs.org/dist/latest/docs/api/addons.html) loader for `enhanced-require`, this loader executes add-ons in [`enhanced-require`](https://github.com/webpack/enhanced-require).


**Packages:**
* *`devDependencies`*
  * `@electron-forge/plugin-webpack`
  * `@marshallofsound/webpack-asset-relocator-loader`
  * `css-loader`
  * `css-modules-typescript-loader`
  * `file-loader`
  * `node-loader`
  * `style-loader`
  * `wepback`

# TypeScript

[TypeScript](https://www.typescriptlang.org/) is an open-source programming language developed and maintained by Microsoft. It is a strict syntatical superset of JavaScript, and adds optional static typing to the language.

Synectic uses TypeScript as the programming language for application logic and source files. Since Electron is not natively capable of loading TypeScript files, we use [`ts-loader`](https://github.com/TypeStrong/ts-loader) to allow `webpack` to compile all TypeScript files into JavaScript files prior to loading into Electron.

**Packages:**
* *`devDependencies`*
  * `ts-loader`
  * `typescript`

**Configuration:**

Synectic has the following `CompilerOptions` set in `tsconfig.json`:
| Setting                            | Value                               | Description  |
| ---------------------------------- |:-----------------------------------:| ------------:|
| `target`                           | `ES2017`                            | Specify output ECMAScript version to be ES2017 (ES8) |
| `lib`                              | `["dom", "dom.iterable", "esnext"]` | Injects library definitions for DOM, DOM.Iterable, and ESNext |
| `allowJs`                          | `true`                              | Allow JavaScript files to be compiled |
| `skipLibCheck`                     | `true`                              | Skip type checking of all `.d.ts` files (type definition files) |
| `esModuleInterop`                  | `true`                              | Imports CommonJS modules in compliance with ES6 module specs |
| `allowSyntheticDefaultImports`     | `true`                              | Allows for simplified syntax for importing defaults |
| `strict`                           | `true`                              | Enables strict type checking |
| `forceConsistentCasingInFileNames` | `true`                              | Disallows inconsistently-cased references to the same file |
| `module`                           | `esnext`                            | Allows for resolving ESNext import syntax (e.g. `import()` and `import.meta`) |
| `moduleResolution`                 |  `node`                             | Determine that modules get resolved consistently with Node.js system |
| `resolveJsonModule`                | `true`                              | Includes modules imported with `.json` extension |
| `noEmit`                           | `true`                              | Prevent `tsc` from emitting `.js` outputs (i.e. `webpack` create outputs instead) |
| `noUnusedLocals`                   | `true`                              | Report errors if local variables are unused |
| `noUnusedParameters`               | `true`                              | Report errors if parameters are unused |
| `jsx`                              | `react`                             | Emit React elements as JavaScript code with `.js` file extension |

# React

[React](https://reactjs.org/) is a JavaScript library for building user interfaces. It is maintained by Facebook and a community of individual developers and companies. React is a declarative, component-based langugage that works with JSX and TSX formats to manage state, route applications, and render HTML injections.

The [`react-dnd`](https://react-dnd.github.io/react-dnd/) module provides a drag and drop library that works with React components and resembles the [Redux](https://github.com/reactjs/react-redux) architecture. The [`react-dnd-html5-backend`](https://react-dnd.github.io/react-dnd/docs/backends/html5) module adds a backend to React-DnD, and uses the [HTML5 drag and drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) under the hood to provide a widely supported base and hide some of [the quirks](http://quirksmode.org/blog/archives/2009/09/the_html5_drag.html).

Synectic uses React for user interface components and integrates those components into Electron using the [`react-dom`](https://reactjs.org/docs/react-dom.html) package, which provides DOM-specific methods that can be used at the top level of an app in order to execute outside of the React model. The [`react-dnd`](https://react-dnd.github.io/react-dnd/) and [`react-dnd-html5-backend`](https://react-dnd.github.io/react-dnd/docs/backends/html5) packages provide drag and drop interactions between React components within Synectic.

The [`react-hot-loader`](https://gaearon.github.io/react-hot-loader/) module is a plugin that allows React components to be live reloaded without the loss of state. It works with Webpack and other bundlers that support Hot Module Replacement (HMR) and Babel plugins. The `react-hot-loader` module is installed as a regular dependency (instead of a dev dependency) since the plugin automatically ensures it is not executed in production and the footprint is minimal.

**Packages:**
* *`dependencies`*
  * `@types/react`
  * `@types/react-dom`
  * `react`
  * `react-dnd`
  * `react-dnd-html5-backend`
  * `react-dom`
  * `react-hot-loader`

# ESLint

[ESLint](https://eslint.org/) is an extensible static analysis tool for checking JavaScript code for readability, maintainability, and functionality errors.

Synectic uses ESLint to statically analyze TypeScript and React code for compliance with industry-standard syntax rules.

The TypeScript project has typically advocated and maintained [TSLint](https://palantir.github.io/tslint/) for TypeScript static analysis, but has more recently begun to transition towards ESLint in order to take advantage of the more-performant architecture and framework support (e.g. rules for React Hook or Vue); per the TypeScript [roadmap](https://github.com/Microsoft/TypeScript/issues/29288).  Therefore, we have followed the ESLint configuration steps described in a blog post from Christopher Pappas, ["From TSLint to ESLint, or How I Learned to Lint GraphQL Code"](https://artsy.github.io/blog/2019/01/29/from-tslint-to-eslint/) (published 2019.01.29).

The [`@typescript-eslint/eslint-plugin`](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin) module is an ESLint-specific plugin which, when used in conjunction with `@typescript-eslint/parser`, allows for TypeScript-specific linting rules to run. The [`@typescript-eslint/parser`](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser) module provides an ESLint-specific parser which leverages `typescript-estree` and is designed to be used as a replacement for ESLint's default parser, `espree`. 

The [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import) module intends to support linting of ES2015+ (ES6+) import/export syntax, and prevent issues with misspelling of file paths and import names.

The [`eslint-plugin-react`](https://www.npmjs.com/package/eslint-plugin-react) module provides React specific rules for ESLint.

The [`eslint-plugin-jest`](https://www.npmjs.com/package/eslint-plugin-jest) module exports a recommended configuration that enforces good testing practices.

**Packages:**
* *`devDependencies`*
  * `eslint`
  * `@typescript-eslint/eslint-plugin`
  * `@typescript-eslint/parser`
  * `eslint-plugin-import`
  * `eslint-plugin-jest`
  * `eslint-plugin-react`
  * `eslint-plugin-react-hooks`

**Configuration:**

Synectic has the following ESLint options set in `.eslintrc.js`:
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
| `plugins`                                  | `["@typescript-eslint", "react", "react-hooks", "jest"]`    | Enables ESLint plugins `@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-jest` |
| `extends`                                  | `["eslint:recommended"]`       | ESLint rules for JavaScript and JSX configured from the [ESLint](https://eslint.org/docs/user-guide/configuring) plugin |
| `extends`                                  | `["plugin:@typescript-eslint/eslint-recommended"]` | ESLint rules for TypeScript and TSX configured from the [TypeScript-ESLint](https://github.com/typescript-eslint/typescript-eslint) plugin, per [typescript-eslint in eslint](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#usage) configuration guide |
| `extends`                                  | `["plugin:@typescript-eslint/recommended"]` | ESLint rules that supersede `eslint:recommended` core rules which are not compatible with TypeScript, per [typescript-eslint in eslint](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#usage) configuration guide |
| `extends`                                  | `["plugin:react/recommended"]` | ESLint rules specific to React from [`eslint-plugin-react`](https://github.com/yannickcr/eslint-plugin-react) project |
| `extends`                                  | `["plugin:jest/recommended"]`  | ESLint rules specific to [Jest](#Jest) syntax from [`eslint-plugin-jest`](https://github.com/jest-community/eslint-plugin-jest) project for enforcing good testing practices |
| `extends`                                  | `["plugin:jest/style"]`        | ESLint rules specific to [Jest](#Jest) test style from [`eslint-plugin-jest`](https://github.com/jest-community/eslint-plugin-jest) project for extending `plugin:jest/recommended` to include stylistic rules |
| `extends`                                  | `["plugin:import/warnings"]`  | ESLint rules for raising import errors from `eslint-plugin-import` project |
| `extends`                                  | `["plugin:import/warnings"]`  | ESLint rules for raising import warnings from `eslint-plugin-import` project |
| `extends`                                  | `["plugin:import/typescript"]` | ESLint rules that fix `plugin:imports/warnings` rules to be compatible with TypeScript, per [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import#typescript) installation guide |
| `settings` : `import/resolver` : `node` : `extensions` | `[".js", ".jsx", ".ts", ".tsx"]` | Sets ESLint import resolver to handle `.js`, `.jsx`, `.ts`, and `.tsx` files |
| `settings` : `react` : `pragma`            | `React`                     | Enables ESLint to property process [JSX pragma](https://laptrinhx.com/what-is-jsx-pragma-2095738289/) comments |
| `settings` : `react` : `version`           | `detect`                    | React version is automatically detected and set by ESLint |
| `rules` | (vary by module or plugin) | Descriptions for each rule are linked or described within each section of the `rules` option block |

# Jest

[Jest](https://jestjs.io/) is a JavaScript testing framework with a focus on simplicity. It is maintained by Facebook, and supports [Babel](https://babeljs.io/), [TypeScript](#TypeScript), [Node.js](https://nodejs.org/en/about/), [React](#React), [Angular](https://angular.io/), and [Vue.js](https://vuejs.org/). Jest is built on top of Jasmine, and serves as a test runner with predefined tests for mocking and stub React components.

Synectic uses Jest for unit testing, integration testing, code coverage, and interfacing with [Enzyme](#Enzyme) for React component testing.

The [`ts-jest`](https://kulshekhar.github.io/ts-jest/) module is a TypeScript preprocessor with source map support for Jest that lets Synectic use Jest to test projects written in TypeScript. In particular, the choice to use TypeScript (with `ts-jest`) instead of Babel7 (with `@babel/preset-typescript`) is based upon the reasons outlined in a blog post from Kulshekhar Kabra, ["Babel7 or TypeScript"](https://kulshekhar.github.io/ts-jest/user/babel7-or-ts) (published 2018.09.16).

**Packages:**
* *`devDependencies`*
  * `@types/jest`
  * `jest`
  * `ts-jest`

# Enzyme

[Enzyme](https://airbnb.io/enzyme/) is a JavaScript testing utility for React that tests components with assertions that simulate UI interactions. Enzyme is developed by AirBnB and wraps packages like [ReactTestUtils](https://reactjs.org/docs/test-utils.html), [JSDOM](https://github.com/jsdom/jsdom), and [CheerIO](https://cheerio.js.org/) to create a simpler interface for writing unit tests. The API is meant to be intuitive and flexible by mimicking the jQuery API for DOM manipulation and traversal.

Synectic uses Enzyme to model and render React components and hooks within tests written using Jest's custom assertions and convenience functions.

The [`jest-environment-enzyme`](https://github.com/FormidableLabs/enzyme-matchers/tree/master/packages/jest-environment-enzyme) module from [FormidableLabs](https://formidable.com/) provides a simplified declarative setup for configuring Enzyme with Jest and React. This package also simplifies test files by declaring React, and enzyme wrappers in the global scope. This means that all test files do not need to include imports for React or enzyme.

The `enzyme-to-json` module converts enzyme wrappers to a format compatible with Jest snapshot testing, by providing a serializer plugin to [Jest](#Jest).

**Packages:**
* *`devDependencies`*
  * `@types/enzyme`
  * `@types/enzyme-adapter-react-16`
  * `enzyme`
  * `enzyme-adapter-react-16`
  * `enzyme-to-json`
  * `jest-environment-enzyme`
  * `jest-enzyme`
  
  **Configuration:**

Synectic has the following [Jest](#Jest) and [Enzyme](#Enzyme) options set in `jest.config.js`:
| Setting                                    | Value                       | Description  |
| ------------------------------------------ |:---------------------------:| ----------------------------------------------------:|
| `testEnvironment`                          | `enzyme`                    | Specifies the test environment that will be used for Jest testing |
| `setupFilesAfterEnv`                       | `['jest-enzyme']`           | A list of paths to modules that configure or setup the testing framework before each test (i.e. the `jest-enzyme` plugin executes after environment setup) |
| `testEnvironmentOptions` : `enzymeAdapter` | `react16`                   | Sets `enzyme-adapter-react-16` as the default Enzyme adapter |
| `preset` | `ts-jest` | All TypeScript files (`.ts` and `.tsx`) will be handled by `ts-jest`; JavaScript files are not processed |
| `roots` | `['<rootDir>/__test__']` | Jest will only search for test files in the `__test__` directory |
| `snapshotSerializers` | `['enzyme-to-json/serializer']` | Enables the `enzyme-to-json` for serializing all Jest snapshots |