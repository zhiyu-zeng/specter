# Contributing to Specter

## Development Setup

```sh
git clone https://github.com/dpejoh/specter
cd specter
npm ci
```

Requirements: Node.js >= 20, npm >= 9.

## Building

```sh
npm run build
```

This runs:
1. `vite build` - bundles WebUI (MWC + TS + CSS) into `Module/webroot/`
2. Copies shell scripts, libs, features, pipelines from `src/` to `Module/`
3. Zips `Module/` → `module.zip`

Output: `module.zip` - flashable Magisk/KernelSU/APatch module.

Run the TypeScript type checker before committing:

```sh
npx tsc --noEmit
```

## WebUI Development

For hot-reload during WebUI development:

```sh
npm run dev
```

This starts Vite's dev server. Edit files in `src/webroot/` and changes reflect instantly.

## Shell Scripts

All shell scripts live in `src/`. Run ShellCheck before committing:

```sh
find src/ -name '*.sh' -exec shellcheck {} +
```

All executable scripts use `set -e` for early error detection. Library scripts (`lib/*.sh`) do not.

⚠️ **Boot Safety:** `service.sh` and `boot-completed.sh` run in critical boot phases. They must use inline `resetprop_if_diff` for props — never call `apply_prop_hardening()`, `check_prop()`, `disable_rom_spoof_engines()`, or `persistprop()`. See [Boot Safety Contract](./ARCHITECTURE.md#boot-safety-contract).

### Adding a New Feature

1. Create a new file in `src/features/<name>.sh`
2. Follow the feature script contract (`set -e`, `MODDIR`, sourcing, `exit 0`)
3. Add it to a pipeline in `src/pipelines/` if it should run automatically
4. Add a WebUI button in `src/webroot/index.html` with `data-script="<name>.sh"`

### Adding a Translation

1. Edit `src/webroot/lang/source/string.json` with the new English string
2. Tag the string with a `data-i18n` attribute in HTML
3. Submit translations (ar, es, ru, zh)

## Pull Request Process

1. Branch from `main`
2. Make changes only in `src/` - never `Module/` or `module/`
3. Run `npx tsc --noEmit` and `npm run build` - both must pass with zero errors
4. Open a PR against the `main` branch
5. Include a clear description of what the change does
