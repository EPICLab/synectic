# synectic-conveyor

## Development

We use the [_recommended project structure_](https://electron-vite.org/guide/dev.html) of the [`electron-vite`](https://electron-vite.org/) project, which means that the following convention is used:

```bash
.
├──src
│  ├──main
│  │  ├──index.ts
│  │  └──...
│  ├──preload
│  │  ├──index.ts
│  │  └──...
│  └──renderer    # with vue, react, etc.
│     ├──src
│     ├──index.html
│     └──...
├──electron.vite.config.ts
├──package.json
└──...
```

This also results in the following output:

```bash
.
├──out
│  ├──main
│  │  ├──index.js
│  │  └──...
│  ├──preload
│  │  ├──index.js
│  │  └──...
│  └──renderer
│     ├──assets/
│     ├──index.html
│     └──...
├──src
├──electron.vite.config.ts
├──package.json
└──...
```

### Caveat

This output structure is only generated when the `preview` or `build` commands are run, since the
`dev` command does not prepare files for packaging and instead leaves the `renderer` directory in
`src/renderer` in order to enable HMR.
