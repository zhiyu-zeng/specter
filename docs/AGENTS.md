# AI Agent Instructions - Specter

## Build & Check

```sh
npm run build          # vite build → copy files → zip module → module.zip
npm run dev            # Vite dev server for WebUI (hot-reload)
npx tsc --noEmit       # TypeScript strict type check (run before committing)
```

Lint shell scripts before committing:
```sh
find src/ -name '*.sh' -exec shellcheck {} +
```

## Source Layout

| Directory | Purpose |
|---|---|
| `src/lib/` | Shared shell libraries - single source of truth |
| `src/features/` | One file = one feature, run by orchestrator |
| `src/pipelines/` | Text files listing features to run in order |
| `src/webroot/js/` | WebUI TypeScript modules (21 .ts files, Vite-bundled) |
| `src/webroot/common/` | Scripts triggered from WebUI directly |
| `src/rka/` | Remote Key Attestation (jsonarray.sh) |
| `Module/` | **Build output - never edit directly** |

## Shell Script Conventions

### `exit` vs `return`

| Context | Use |
|---|---|
| `features/*.sh` | `exit` (run as subprocess) |
| `orchestrator.sh`, `service.sh`, `boot-completed.sh` | `exit` |
| `customize.sh`, `uninstall.sh` | `return` (sourced by installer) |
| `action.sh` | `exit` (standalone - Magisk/KSU runs as subprocess) |
| `lib/*.sh` | Never call `exit` or `return` at top level |

### Path Resolution

| Script location | Path to `lib/common.sh` |
|---|---|
| `features/*.sh` | `"$MODDIR/../lib/common.sh"` |
| Root scripts (`service.sh`, `orchestrator.sh`, etc.) | `"$MODDIR/lib/common.sh"` |
| `webroot/common/*.sh` | Strip 3 levels via `MODDIR="${MODDIR%/*}"`, then `lib/common.sh` |

### Feature Script Contract

```sh
#!/system/bin/sh
set -e
MODDIR=${0%/*}
. "$MODDIR/../lib/common.sh"
. "$MODDIR/../lib/paths.sh"

log "FEATURE" "Start"
# idempotent, check prerequisites first
log "FEATURE" "Finish"
exit 0
```

- End every feature script with `exit 0`
- All executable scripts use `set -e` - intentionally failing commands must use `|| true`
- Never `exit 1` without a `log "ERROR"` message first
- Check prerequisites with `check_network`, `[ -f ... ]` before doing work

## Keybox Revocation

- **Google's endpoint** is the authority for revocation: `check_google_revocation(serial)` downloads Google's attestation status list and checks if the serial is present
- **Private keyboxes** (`kb_private=true`) are also checked against Google's endpoint
- Revocation is a **warning**, not a block - the keybox is installed but the UI shows a "Revoked" badge
- The rawbin catalog is used only for identity (source/version/text/up-to-date), not revocation

## Git Conventions

Commit format: `type: description`

Types: `fix:`, `feat:`, `refactor:`, `chore:`, `docs:`, `test:`

## Constraints

- **NEVER** edit `Module/` or `module/` - these are build artifacts
- **NEVER** commit secrets, API tokens, or keybox files
- **NEVER** use `su -c` in feature scripts - module already runs as root
- **NEVER** hardcode `/data/adb/modules/Specter` - use `$MODDIR`
- **NEVER** edit `.js` files - the WebUI is TypeScript; edit the `.ts` source files in `src/webroot/js/`

### Boot Script Safety

- `service.sh` and `boot-completed.sh` run in critical boot phases. Every `resetprop` call must use `resetprop_if_diff` (has `2>/dev/null || true` guards) — never `check_prop()`.
- Shared functions from `common.sh` (`apply_prop_hardening()`, `check_prop()`, `disable_rom_spoof_engines()`, `persistprop()`) must NOT be called from boot scripts. They lack error guards or write to persistent storage. A single unguarded failure with `set -e` causes a bootloop.
- Boot scripts use inline `resetprop_if_diff` calls. The only shared functions safe to call are `resetprop_if_diff`, `resetprop_if_match`, `apply_boot_hardening`, and `hide_recovery_folders` — all internally have `|| true` on every fallible command.
- `apply_prop_hardening()` is for on-demand use only (called from `cleanup.sh` and WebUI "Clear All Detection Traces" action). Never call it from boot scripts.
