# Development Guide - Specter

For full architecture reference, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Quick Reference

| Area | Files | Lines |
|---|---|---|---|
| `src/lib/` | 5 shared libraries | ~415 total |
| `src/features/` | 18 feature scripts | varies |
| `src/webroot/js/` | 21 TypeScript modules | ~2300 total |
| `src/webroot/css/app.css` | 1 stylesheet | ~790 |
| `src/webroot/index.html` | 1 HTML page | ~460 |

## WebUI Architecture

### Bridge (`src/webroot/js/bridge.ts`)

Single bridge tier: `window.ksu.exec` - KernelSU/APatch native bridge. Spawn support via `window.ksu.spawn` if available, else emulated via raw exec.

Returns an event emitter with `on('data')` and `on('exit')` for live streaming to the terminal. `exec()` returns `{ stdout, stderr }` for simple commands.

### Config Persistence (`src/webroot/js/cfg.ts`)

```ts
cfgGet(key, default)     # ksud module config get → cat config/*.val
cfgSet(key, value)       # ksud module config set → printf > config/*.val (batched + debounced)
```

Mirrors `lib/config_env.sh` on the shell side. Uses `shellEscape` from `utils.ts` for shell-safe single-quote escaping. Batches writes with 500ms debounce timer. Old localStorage keys are migrated and removed.

### Script Execution (`src/webroot/js/app.ts`)

Two modes:
- **Simple mode**: progress dialog, toast on completion, output history saved
- **Dev mode**: live terminal with real-time stdout/stderr, toggled via dev-mode switch

### Theme (`src/webroot/js/theme.ts`)

MWC Material 3 via CSS custom properties. 8 color presets (blue, yellow, red, purple, green, orange, pink, cyan, grey). Auto dark/light detection. Monet dynamic colors from wallpaper (Android 12+).

## TypeScript

The WebUI is written in TypeScript with `strict: true`. Run the type checker before committing:

```sh
npx tsc --noEmit
```

Shared interfaces live in `src/webroot/js/types.ts`. When adding a new data shape (e.g., a new JSON endpoint), add its interface there first.

## Pipeline System

Pipelines are text files in `src/pipelines/` listing feature scripts to run:

```
# src/pipelines/full_integrity
gms.sh
target.sh
security_patch.sh
boot_hash.sh
keybox.sh
pif.sh?
```

```
# src/pipelines/root_hide
hma.sh
zygisk_next.sh?
```

- `?` suffix = optional (skipped if file missing, pipeline continues)
- Any script exiting non-zero **aborts** the pipeline
- Feature names are sanitized against `[!/a-zA-Z0-9_-]` before execution
- The `orchestrator.sh` reads the pipeline file line by line

To create a new pipeline: write a text file in `src/pipelines/`, then call `sh orchestrator.sh <name>`.

## Boot Flow

```
KernelSU / APatch:
  service.sh         → inline resetprop_if_diff for ro.* props
                     → vbmeta fixer via read_vbmeta() (guarded)
                     → exits early — boot-completed.sh handles post-boot
  boot-completed.sh  → apply_boot_hardening(), override.description

Magisk:
  service.sh         → inline resetprop_if_diff for ro.* props
                     → vbmeta fixer, additional hardening
                     → poll sys.boot_completed + GMS kill
                     + recovery hiding + 120s delayed re-spoof
```

The `apply_boot_hardening()` function (in `lib/common.sh`) runs `settings put` and `resetprop --delete` for security hardening.

⚠️ **Boot Safety:** Boot scripts must NOT call `apply_prop_hardening()`, `check_prop()`, `disable_rom_spoof_engines()`, or `persistprop()`. See [Boot Safety Contract](./ARCHITECTURE.md#boot-safety-contract) in ARCHITECTURE.md. All boot-time props use inline `resetprop_if_diff` which has full `2>/dev/null || true` guards.

## Config Persistence (`lib/config_env.sh`)

Dual-layer approach:
- **KernelSU**: uses `ksud module config get/set`
- **Magisk/APatch**: falls back to flat files in `/data/adb/Specter/config/*.val`

Both layers are controlled by the same `cfg_get`/`cfg_set` API. The WebUI mirrors this via shell `exec()`.

## Feature Script Patterns

### Idempotency

All features must be safe to run multiple times. Check prerequisites before acting:

```sh
check_network || { log "FEATURE" "Error: No internet"; exit 1; }
[ -d "/data/adb/tricky_store" ] || { log "FEATURE" "Error: Tricky Store not found"; exit 1; }
```

### set -e

All executable scripts use `set -e`. Commands whose failure is expected must be guarded with `|| true`.

**Exception — Boot scripts** (`service.sh`, `boot-completed.sh`): Every `resetprop` call must use `resetprop_if_diff` (which has `2>/dev/null || true` guards internally). Calling `check_prop()` or `apply_prop_hardening()` from boot scripts will cause a bootloop — these functions lack error guards and `set -e` aborts on the first unguarded failure at a critical boot stage.

### Logging

Use the `log()` function from `lib/common.sh`:

```sh
log "FEATURE" "Start"
log "FEATURE" "Downloading..."
log "FEATURE" "Finish"
```

Format: `[FEATURE] message`

## RKA Subsystem

`src/rka/jsonarray.sh` is a pure-awk JSON array manipulation library. Used by `features/rka.sh` to provision Remote Key Attestation config for the PassIt app. The config file lives at `/data/user/<UID>/io.github.mhmrdd.libxposed.ps.passit/files/rka_configs.json`.
