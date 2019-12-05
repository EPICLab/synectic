module.exports = {
  env: {
    node: true,
    es2017: true,
    jest: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: "module",
    jsx: true,
    ecmaFeatures: {
      jsx: true
    },
    useJSXTextNode: true,
    project: './tsconfig.json'
  },
  plugins: [
    "@typescript-eslint",
    "react",
    "react-hooks",
    "jest"
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:jest/recommended",
    "plugin:jest/style",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript"
  ],
  settings: {
    "import/core-modules": ["electron"], // https://github.com/benmosher/eslint-plugin-import/blob/master/README.md#importcore-modules
    "import/resolver": { // https://github.com/benmosher/eslint-plugin-import#resolvers
      node: {
        extensions: [".js", ".jsx", ".ts", ".d.ts", ".tsx"]
      }
    },
    "import/ignore": [".scss", ".less", ".css"], // eslint-plugin-import can't parse unprocessed CSS modules
    "import/no-unresolved": {
      ignore: ["\.scss$", "\.less$", "\.css$"] // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-unresolved.md#ignore
    }
    ,
    react: {
      pragma: "React",
      version: "detect"
    }
  },
  rules: {
    /**
     * @description Rules of @typescript-eslint
     */
    "@typescript-eslint/explicit-function-return-type": "off",

    /**
     * @description Rules of eslint-plugin-react
     */
    "react/prop-types": [0], // disabled checks for PropTypes blocks: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/prop-types.md
    "react/jsx-filename-extension": ["warn", {
      "extensions": [".jsx", ".tsx"]
    }],

    /**
     * @description Rules of eslint-plugin-react-hooks
     */
    "react-hooks/rules-of-hooks": "error", // enforces adherence to the Rules of Hooks: https://reactjs.org/docs/hooks-rules.html
    "react-hooks/exhaustive-deps": "warn", // described in this thread: https://github.com/facebook/react/issues/14920

    /**
     * @description Rules of eslint-plugin-jest
     */
    "jest/no-disabled-tests": "warn",
  }
}