# Specter - Architecture

## Philosophy

- **TypeScript + Vite** for the WebUI (builds MWC + TS into bundled JS)
- **Runtime bridge detection** - works on KernelSU, APatch (identical `window.ksu`), and Magisk. No single-vendor lock-in.
- **`@material/web` (MWC)** - Google's official Material 3 Web Components
- **`ksud module config`** instead of `localStorage` (survives app uninstall)
- **`boot-completed.sh`** for KernelSU/APatch (proper boot event) + **`service.sh` with `sys.boot_completed` polling fallback** for Magisk
- **`config_env.sh`** - shared config persistence layer with `ksud` + file fallback (works on Magisk/APatch/KSU)
- **Zero CDN dependencies at runtime** - everything bundled locally by Vite
- **Single shared shell library** (`lib/`) - eliminates all copy-paste
- **Single orchestrator** for both action button and WebUI
- **`$MODDIR` everywhere** - no hardcoded paths

---

## Directory Layout

```
specter/
├── .github/workflows/
│   ├── build-test.yml                    # CI: lint + build + test
│   └── build-release.yml                 # CI: build, sign, release
│
├── src/                                  # SOURCE directory (developer edits here)
│   ├── META-INF/
│   │   └── com/google/android/
│   │       ├── update-binary             # Magisk legacy installer
│   │       └── updater-script            # Contains only: #MAGISK
│   │
│   ├── module.prop                       # Module metadata
│   │
│   ├── lib/                              # Shared shell libraries (single source of truth)
│   │   ├── paths.sh                      #   All module & system path constants
│   │   ├── urls.sh                       #   All remote URLs (keybox, configs, update)
│   │   ├── common.sh                     #   Shared functions: log, download, die,
│   │   │                                 #   check_prop, resetprop_*, persistprop,
│   │   │                                 #   hide_recovery_folders, apply_prop_hardening,
│   │   │                                 #   apply_boot_hardening, read_vbmeta,
│   │   │                                 #   version_ge, run_device_info,
│   │   │                                 #   _parse_serial, decode_keybox_serial,
│   │   │                                 #   find_kmInstallKeybox, resolve_module_root,
│   │   │                                 #   check_google_revocation, disable_rom_spoof_engines,
│   │   │                                 #   decode_keybox_blob
│   │   ├── config_env.sh                 #   Config persistence: ksud module config with file fallback (cfg_get, cfg_set)
│   │   └── package_list.sh              #   Fixed target.txt entries + app lists + SUSPICIOUS_PROPS + BLACKLIST_EXTRA
│   │
│   ├── features/                         # One file = one feature, one responsibility
│   │   ├── keybox.sh                     #   Download, validate (keys + ID), check Google revocation, install keybox
│   │   ├── target.sh                     #   Generate target.txt
│   │   ├── security_patch.sh             #   Spoof security patch date
│   │   ├── boot_hash.sh                  #   Set verified boot hash
│   │   ├── pif.sh                        #   Update Play Integrity Fix fingerprints
│   │   ├── pif2.sh                       #   Clean PIF props (pihook/pixelprops)
│   │   ├── hma.sh                        #   Deploy HMA-OSS config
│   │   ├── zygisk_next.sh                #   Configure Zygisk Next
│   │   ├── rka.sh                        #   Provision remote key attestation
│   │   ├── cleanup.sh                    #   Clear all detection traces
│   │   ├── gms.sh                        #   Kill & clear Google Play Store
│   │   ├── kill_all.sh                   #   Kill all detector apps
│   │   ├── widevine.sh                   #   Fix Widevine L1
│   │   ├── lsposed.sh                    #   Clean LSPosed ODEX traces
│   │   ├── twrp.sh                       #   Delete TWRP folder
│   │   ├── keybox_info.sh               #   Check keybox status (Google revocation + catalog identity)
│   │   ├── suspicious_props.sh           #   Scan for leftover persistent props from modding tools
│   │   └── suspicious_props_clean.sh     #   Scan + clean all suspicious props
│   │
│   ├── orchestrator.sh                   # Single entry point for all pipelines
│   │
│   ├── pipelines/                        # Pipeline definitions (text files)
│   │   ├── full_integrity                #   gms → target → security_patch → boot_hash → keybox → pif?
│   │   └── root_hide                     #   hma → zygisk_next?
│   │
│   ├── customize.sh                      # Installation (sourced by installer - uses $MODPATH)
│   ├── service.sh                        # Boot-time property spoofer (late_start service)
│   ├── boot-completed.sh                 # KernelSU/APatch only: runs at ACTION_BOOT_COMPLETED
│   ├── uninstall.sh                      # Clean removal (sourced - uses $MODDIR from $0)
│   ├── action.sh                         # Thin wrapper → calls orchestrator.sh
│   │
│   ├── rka/                              # Remote Key Attestation subsystem
│   │   └── jsonarray.sh                  #   Shell JSON array library (pure awk)
│   │
│   └── webroot/                          # WebUI SOURCE (Vite bundles this → Module/webroot/)
│       ├── config.json                   # KernelSU WebUI config (title, icon)
│       ├── index.html                    # Single HTML - MWC components declared here
│       ├── css/
│       │   └── app.css                   # MWC theme vars + page layout
│       ├── js/                           # 21 TypeScript modules (Vite-bundled)
│       │   ├── app.ts                    # Main entry - wires UI, navigation, actions
│       │   ├── bridge.ts                 # Bridge detection (ksu.exec), spawnScript, runScript
│       │   ├── cfg.ts                    # Config persistence (ksud + file fallback)
│       │   ├── clock.ts                  # Clock display
│       │   ├── constants.ts              # Shared constants (timeout, URLs, storage keys)
│       │   ├── contributors.ts           # Contributor grid
│       │   ├── dev-mock.ts               # Dev mock for browser testing
│       │   ├── device.ts                 # Device info + keybox status refresh
│       │   ├── dialog.ts                 # Error/simple dialog helpers
│       │   ├── file-browser.ts           # File picker for custom keybox
│       │   ├── history.ts                # Script output history viewer
│       │   ├── i18n.ts                   # Async translation loader
│       │   ├── material.ts               # MWC component imports
│       │   ├── network.ts                # Online/offline detection
│       │   ├── redirect.ts               # URL opener (injection-safe)
│       │   ├── state.ts                  # Friendly name mappings for scripts
│       │   ├── terminal.ts               # Live terminal output
│       │   ├── theme.ts                  # Theme engine (monet + presets)
│       │   ├── toast.ts                  # Toast notifications
│       │   ├── types.ts                  # Shared TypeScript interfaces
│       │   └── utils.ts                  # escapeHtml(), shellEscape()
│       ├── json/
│       │   ├── dev.json                  # Contributors list
│       │   ├── module_paths.json         # Runtime module path (written by customize.sh)
│       │   └── info.json                 # Device info (generated by device-info.sh)
│       ├── lang/
│       │   ├── source/string.json        # English source strings
│       │   └── *.json                    # 4 translation files (ar, es, ru, zh)
│       ├── assets/
│       │   ├── material-icons.css        # Material Icons font CSS
│       │   └── material-icons-outlined.css
│       └── common/                       # WebUI-triggered scripts
│           ├── device-info.sh            # Sources lib/common.sh for log() consistency
│           ├── lsposed2.sh               # Delegates to features/lsposed.sh
│           ├── twrp.sh                   # Delegates to features/twrp.sh
│           └── pif2.sh                   # Delegates to features/pif2.sh
│
├── Module/                               # BUILD OUTPUT - gitignored, generated by npm run build
│   └── ...                               # Identical structure, webroot/ is Vite-bundled
│
├── vite.config.js                        # Vite config: root=src/webroot, outDir=Module/webroot
├── package.json                          # deps: @material/web, @material/material-color-utilities. devDeps: vite
├── .gitignore
├── docs/                                 # Documentation
│   ├── ARCHITECTURE.md
│   ├── AGENTS.md
│   ├── CONTRIBUTING.md
│   └── DEVELOPMENT.md
├── changelog.md
├── README.md
├── config.json                           # Root config (HMA config, not bundled)
├── update.json                           # OTA update manifest
├── string.yml                            # i18n sync config
└── module.zip                            # Built module zip (auto-generated, gitignored)
```

---

## Execution Flow

```
Action button
  → action.sh
    → set -e; MODDIR=${0%/*}; . "$MODDIR/lib/common.sh"
    → sh "$MODDIR/orchestrator.sh" full_integrity || exit $?
      → reads pipelines/full_integrity
      → sh features/gms.sh
      → sh features/target.sh
      → sh features/security_patch.sh
      → sh features/boot_hash.sh
      → sh features/keybox.sh
      → sh features/pif.sh?          (? = optional, skips if file missing with warning)
    → run_device_info "$MODDIR"       (writes webroot/json/info.json)

WebUI button
  → bridge detection (window.ksu.exec)
  → reads module_paths.json → MODULE.MODDIR
  → spawnScript(scriptName, 'feature')
  → stdout/stderr piped to dialog + history log
  → features/keybox.sh             (same script, same contract)

Boot (KernelSU / APatch):
  → service.sh (late_start service, non-blocking)
    → inline resetprop_if_diff for ro.boot.*, ro.build.*, etc.
    → inline resetprop_if_match for recovery mode hiding
    → vbmeta fixer via read_vbmeta() (wrapped in || echo "")
    → exits early - boot-completed.sh handles post-boot hardening
  → boot-completed.sh (at ACTION_BOOT_COMPLETED)
    → apply_boot_hardening()       (settings put + resetprop)
    → cfg_set for override.description

Boot (Magisk):
  → service.sh (late_start service)
    → inline resetprop_if_diff for ro.boot.*, ro.build.*, etc.
    → vbmeta fixer, additional hardening (inline)
    → polls sys.boot_completed (while/getprop loop) for post-boot actions
    → apply_boot_hardening()       (done inline in service.sh)
    → hide_recovery_folders()
    → delayed re-spoof after 120s (background subshell)
```

---

## Contracts & Patterns

### `return` vs `exit` - The Boundary Rule

| Context | Execution Method | Use |
|---|---|---|
| Feature scripts (`features/*.sh`) | `sh features/foo.sh` (subprocess) | **`exit`** |
| Orchestrator (`orchestrator.sh`) | `sh orchestrator.sh` (subprocess) | **`exit`** |
| Library scripts (`lib/*.sh`) | Sourced via `. lib/common.sh` | **Never call `exit` or `return` at top level** |
| `customize.sh` | Sourced by installer | **`return`** |
| `service.sh` | Subprocess (Magisk/KSU runs it) | **`exit`** |
| `boot-completed.sh` | Subprocess (KSU runs it) | **`exit`** |
| `uninstall.sh` | Sourced by installer | **`return`** |
| `action.sh` | Subprocess (KSU/Magisk runs it) | **`exit`** |

All executable scripts use `set -e` for early error detection.

### Every Script Follows Path Contracts

| Script location | `$MODDIR` resolves to | Path to `lib/common.sh` |
|---|---|---|
| `features/keybox.sh` | `.../Specter/features` | `"$MODDIR/../lib/common.sh"` |
| `orchestrator.sh` | `.../Specter` | `"$MODDIR/lib/common.sh"` |
| `service.sh` | `.../Specter` | `"$MODDIR/lib/common.sh"` |
| `boot-completed.sh` | `.../Specter` | `"$MODDIR/lib/common.sh"` |
| `action.sh` | `.../Specter` | `"$MODDIR/lib/common.sh"` |
| `customize.sh` | **N/A - sourced by installer** | Use `$MODPATH` (provided by installer) |
| `uninstall.sh` | `.../Specter` | `"$MODDIR/lib/common.sh"` |
| `webroot/common/device-info.sh` | `.../Specter/webroot/common` | Strips 3 levels to module root, then `lib/common.sh` |

### Feature Script Contract

```sh
#!/system/bin/sh
set -e
MODDIR=${0%/*}               # resolves to .../Specter/features
. "$MODDIR/../lib/common.sh" # go up one level to module root, then into lib/
. "$MODDIR/../lib/paths.sh"

log "FEATURE" "Start"
# ... one responsibility, idempotent, check prerequisites first ...
log "FEATURE" "Finish"
exit 0
```

- Exits `0` on success, `1` on failure
- All output via `log()`
- **Idempotent** - safe to run multiple times
- **Checks prerequisites** - if a required module is missing, log + exit 0 (skip gracefully)

### Orchestrator With Conditional Execution & Sanitization

```sh
while IFS= read -r line; do
    [ -z "$line" ] && continue
    [ "${line#\#}" != "$line" ] && continue

    feature="$line"
    optional=false
    [ "${feature%\?}" != "$feature" ] && optional=true && feature="${feature%\?}"

    case "$feature" in *[!/a-zA-Z0-9_-]*) die "Invalid feature name" ;; esac
    FEATURE_PATH="$MODDIR/features/$feature"
    if [ "$optional" = "true" ] && [ ! -f "$FEATURE_PATH" ]; then
        log "ORCH" "Warning: Optional feature '$feature' not found - skipping"
        continue
    fi

    log "ORCH" "Running: $feature"
    if ! sh "$FEATURE_PATH"; then
        die "Pipeline aborted: $feature failed"
    fi
done < "$PIPELINE_FILE"
```

### Pipeline Definitions

**`pipelines/full_integrity`:**
```
gms.sh
target.sh
security_patch.sh
boot_hash.sh
keybox.sh
pif.sh?
```

**`pipelines/root_hide`:**
```
hma.sh
zygisk_next.sh?
```

---

## Boot - Dual Strategy (KernelSU `boot-completed.sh` + Magisk Polling Fallback)

**KernelSU / APatch** support a dedicated `boot-completed.sh` that runs at `ACTION_BOOT_COMPLETED`.
**Magisk** does NOT support this - it only has `service.sh` (late_start service).

This architecture uses **both**, with a conditional check:

```sh
# src/boot-completed.sh - KernelSU/APatch only: runs EXACTLY at boot completed
#!/system/bin/sh
set -e
MODDIR=${0%/*}
# Guard: KernelSU and APatch both set $KSU=true; skip if not running under them
[ -z "$KSU" ] && exit 0

. "$MODDIR/lib/common.sh"
. "$MODDIR/lib/paths.sh"
. "$MODDIR/lib/config_env.sh"

log "BOOT" "Boot completed - finalizing"

apply_boot_hardening

# Dynamic module description
_release=$(getprop ro.build.version.release 2>/dev/null || echo "Unknown")
if [ -f "$TARGET_FILE" ]; then
    cfg_set "override.description" "Active | $_release"
else
    cfg_set "override.description" "Run action button to set up keybox"
fi
```

```sh
# src/service.sh - runs on BOTH KernelSU and Magisk (late_start service)
# On KernelSU/APatch: only sets ro.* properties (boot-completed.sh handles the rest)
# On Magisk: sets ro.* properties AND polls sys.boot_completed for post-boot actions
#!/system/bin/sh
set -e
MODDIR=${0%/*}
. "$MODDIR/lib/common.sh"
. "$MODDIR/lib/package_list.sh"

# Immediate ro.* property resets
resetprop_if_diff ro.boot.vbmeta.device_state locked
# ... (all ro.* props) ...

# KernelSU/APatch: exit early - boot-completed.sh handles post-boot
[ "$KSU" = "true" ] && exit 0

# Magisk: poll sys.boot_completed for settings that need a booted system
while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 1; done
apply_boot_hardening

# GMS killer
for _pkg in $GMS_KILL_LIST; do am force-stop "$_pkg" 2>/dev/null || true; done
hide_recovery_folders

# Delayed re-spoof after 120s
( sleep 120; resetprop_if_diff ro.crypto.state encrypted; ... ) &
```

**Boot script order:**
```
KernelSU / APatch:
  service.sh         → immediate property resets (inline resetprop_if_diff)
  boot-completed.sh  → apply_boot_hardening(), override.description

Magisk:
  service.sh         → immediate property resets + polling for post-boot actions
                       (GMS kill, recovery hiding, delayed spoof)
```

⚠️ **Critical:** `apply_prop_hardening()` and `check_prop()` are NEVER called from boot scripts. See [Boot Safety Contract](#boot-safety-contract). All boot-time props are set via inline `resetprop_if_diff` calls with full `2>/dev/null || true` guards.

The `apply_boot_hardening()` function (defined in `lib/common.sh`):
```sh
apply_boot_hardening() {
  settings put global development_settings_enabled 0
  settings put global adb_enabled 0
  settings put global oem_unlock_allowed 0
  settings put global adb_wifi_enabled 0
  settings put global adb_wifi_port -1
  resetprop --delete persist.service.adb.enable 2>/dev/null || true
  resetprop --delete persist.service.debuggable 2>/dev/null || true
  resetprop -n persist.sys.developer_options 0
}
```

## Boot Safety Contract

Boot scripts (`service.sh`, `boot-completed.sh`) run in a different risk environment than feature scripts or on-demand actions.

### The Constraint

- **`post-fs-data` stage is BLOCKING** — the boot process pauses until the script finishes or 40s elapses. An unhandled error at this stage can stall boot indefinitely.
- **`late_start service` stage is NON-BLOCKING** — but failures can still cascade into bootloops depending on the root solution's error handling.

### The Rule

**Boot scripts must use inline `resetprop_if_diff`, never shared abstraction functions like `apply_prop_hardening()` / `check_prop()`.**

```
                    resetprop_if_diff()          check_prop()
                    ─────────────────           ─────────────
Read guard         2>/dev/null || echo ""       none
Write guard        2>/dev/null || true          none
Root fallback      setprop for legacy           always resetprop -n
```

`resetprop_if_diff()` has full guards on every `resetprop` call. `check_prop()` does not — it was designed for on-demand use where a failure means a toast error, not a bricked device.

With `set -e` at the top of every boot script, an unguarded `resetprop` failure immediately aborts the script. In a blocking or critical boot stage, this prevents the system from completing its boot sequence.

### What Is Safe at Boot

Safe — uses `resetprop_if_diff` or explicit `|| echo ""` / `|| true`:
- All `ro.boot.*`, `ro.build.*`, `ro.debuggable`, `ro.secure`, etc.
- `read_vbmeta()` — because the caller wraps it in `|| echo ""` before passing through
- `resetprop_if_match()` — same guards as `resetprop_if_diff`
- `apply_boot_hardening()` — every internal command has `|| true`

Not safe at boot — lacks error guards or writes to persistent storage:
- `check_prop()` — no `2>/dev/null || echo ""` on read, no `2>/dev/null || true` on write (unless explicitly added by caller)
- `apply_prop_hardening()` — internally calls `check_prop()` 30+ times
- `disable_rom_spoof_engines()` — uses `persistprop()` which writes to `/data/property/persistent_properties`
- `persistprop()` — writes persistent properties at a stage where system services may be initializing

### Design Principle

| Context | Style | Error handling |
|---|---|---|
| Boot scripts | Inline `resetprop_if_diff` | Every call guarded |
| Feature scripts | Shared functions with `set -e` | Failure = action error toast |
| Install (customize.sh) | Sourced, no `set -e` | Failure = install abort |

### Root Manager Detection - Environment Variables

```sh
# KernelSU sets KSU=true, APatch also sets KSU=true (compat), Magisk sets MAGISK_VER_CODE
# service.sh's `[ "$KSU" = "true" ]` correctly identifies KSU/APatch
# boot-completed.sh's `[ -z "$KSU" ]` checks for unset (non-KSU/non-APatch)
```

`device-info.sh` root detection order: SukiSU-Ultra → KernelSU-Next → KernelSU → APatch → Magisk.

### `module.prop`

```
id=Specter
name=Specter Manager
version=v4.0.0
versionCode=400
author=Specter Dev
description=A systemless module to get strong integrity so easily
updateJson=https://raw.githubusercontent.com/dpejoh/specter/main/update.json
```

---

## Build Process

```sh
# One command
npm ci
npm run build
```

`npm run build` runs:
1. `vite build` → bundles `src/webroot/` (MWC + JS + CSS) into `Module/webroot/`
2. `npm run build:module` → copies shell scripts, lib/, features/, pipelines/, rka/, webroot assets/lang/json/common/ into Module/
3. Removes `Module/webroot/*.map` files
4. `npm run build:zip` → zips Module/ → `module.zip`

**`vite.config.js`:**
```js
import { defineConfig } from 'vite'
export default defineConfig({
  root: 'src/webroot',
  base: './',
  build: {
    outDir: '../../Module/webroot',
    emptyOutDir: true,
  },
})
```

**`package.json`:**
```json
{
  "name": "specter",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && npm run build:module && rm -f Module/webroot/*.map && npm run build:zip",
    "build:module": "mkdir -p Module && cp -r src/META-INF src/module.prop src/lib src/features src/pipelines src/rka Module/ && cp src/*.sh Module/ && cp -r src/webroot/assets Module/webroot/ && cp -r src/webroot/lang Module/webroot/ && cp -r src/webroot/json Module/webroot/ && cp -r src/webroot/common Module/webroot/ && cp src/webroot/config.json Module/webroot/",
    "build:zip": "cd Module && rm -f ../module.zip && zip -r ../module.zip . && cd .."
  },
  "devDependencies": {
    "vite": "^8.0.4"
  },
  "dependencies": {
    "@material/material-color-utilities": "^0.4.0",
    "@material/web": "2.4.1"
  }
}
```

---

## Shared Library (`lib/`)

### `lib/common.sh` - Central Utility Functions

```sh
log()                          # Tagged logging: "[FEATURE] message"
die()                          # log + exit 1
download()                     # curl with wget fallback, optional sha256 verify
check_network()                # Connectivity check via ping + HTTP
check_prop()                   # On-demand prop set (no boot-safe guards — see Boot Safety Contract)
resetprop_if_diff()            # Conditional prop set if different (boot-safe, has 2>/dev/null || true)
resetprop_if_match()           # Conditional prop set if matches pattern (boot-safe)
persistprop()                  # Persistent prop set + backup — NOT safe at boot
hide_recovery_folders()        # Remove/hide TWRP/OrangeFox/PBRP folders from /sdcard
apply_prop_hardening()         # Lock down security props — on-demand only, NEVER at boot
apply_boot_hardening()         # settings put + resetprop for security hardening (boot-safe)
ensure_dir()                   # mkdir -p
_escape_json()                 # Sanitize string for JSON embedding
version_ge()                   # Semantic version comparison (awk-based)
read_vbmeta()                  # Read real vbmeta block device → size + sha256 digest
run_device_info()              # Find and execute device-info.sh across possible paths
_parse_serial()                # Parse ASN.1 DER-encoded certificate serial
decode_keybox_serial()         # Extract serial from keybox certificate (base64 → hex → DER)
check_google_revocation()      # Check keybox serial against Google's attestation endpoint
find_kmInstallKeybox()         # Locate KmInstallKeybox vendor binary
resolve_module_root()          # Resolve module root from script path (webroot/common/ support)
disable_rom_spoof_engines()    # Detect and disable ROM spoof engines (pihooks/pixelprops/entryhooks)
decode_keybox_blob()           # Reverse shuffled base64 → plain base64 → decode (shared alphabet with rawbin)
STD_ALPHABET / SHUFFLED_ALPHABET  # Custom base64 alphabet for keybox delivery obfuscation
```

### `lib/config_env.sh` - Config Persistence

```sh
cfg_get()    # Read config: ksud → flat-file fallback
cfg_set()    # Write config: ksud → flat-file fallback
```

### `lib/package_list.sh` - App Lists

```
FIXED_TARGETS        # 7 hardcoded target.txt entries for Tricky Store
DETECTOR_APPS        # ~57 detector/integrity-check packages
GMS_APPS             # 8 Google/GMS packages (core)
GMS_KILL_LIST        # 14 GMS packages for force-stop (used by gms.sh, service.sh)
REMOTE_CONTROL_APPS  # 13 remote control apps
TOOL_APPS            # 9 tool/root apps
```

### `lib/urls.sh` - Remote URLs

```sh
KEYBOX_URL="https://rawbin.netlify.app/key"
ATTESTATION_URL="https://rawbin.netlify.app/clips/attestation"
HMA_CONFIG_URL="https://rawbin.netlify.app/clips/config"
CATALOG_URL="https://rawbin.netlify.app/key/catalog"
GOOGLE_REVOCATION_URL="https://android.googleapis.com/attestation/status?encrypted=1"
RKA_HOST="rp.mhmrdd.me"
RKA_TCP=59416
RKA_TOKEN="${RKA_TOKEN:-yurikey-5b70e270d6d69cd399c59ca3d62ccf6e}"
```

### `lib/paths.sh` - Path Constants

```sh
TRICKY_DIR="/data/adb/tricky_store"
TARGET_FILE="$TRICKY_DIR/keybox.xml"
BACKUP_FILE="$TRICKY_DIR/keybox.xml.bak"
LOCKED_FILE="$TRICKY_DIR/locked.xml"
LOCKED_BACKUP="$TRICKY_DIR/locked.xml.bak"
TARGET_TXT="$TRICKY_DIR/target.txt"
SECURITY_PATCH_FILE="$TRICKY_DIR/security_patch.txt"
TEE_STATUS="$TRICKY_DIR/tee_status"
BOOT_HASH_FILE="/data/adb/boot_hash"
HMA_DIR="/data/user/0/org.frknkrc44.hma_oss/files"
HMA_FILE="$HMA_DIR/config.json"
IDFILE="/data/local/tmp/.rka_id"

# Derived paths (require MODDIR set before sourcing):
BBIN="$_root/bin"
CONFIG_DIR="$_root/config"
MIGRATION_MARKER="$_root/.migrated"
PERSIST_RESTORE_FILE="/data/adb/Specter/persist_backup.txt"
```

---

## WebUI Architecture

The WebUI is written in **TypeScript with strict mode** (`strict: true`). Vite compiles `.ts` files to bundled `.js` at build time. A shared `types.ts` provides interfaces for all data shapes (`InfoJson`, `KeyboxInfoJson`, `KsuBridge`, etc.).

### Device Info Flow

Scripts run → await completion → fetch JSON exactly once. No polling, no stale reads, no `?ts=` cache busting:

```
refreshDevice()
  → runScript('device-info.sh') → await
  → fetch('/json/info.json') → applyAllDeviceInfo(data)

refreshKeyboxStatus()
  → runScript('keybox_info.sh') → await
  → fetch('/json/keybox_info.json') → applyKeyboxStatus(data)
```

### Bridge Detection (`bridge.ts`)

Single bridge tier: `window.ksu.exec` (KernelSU/APatch native bridge). Falls back to `spawn` via `window.ksu.spawn` if available, else emulates via `_runScriptRaw`.

Returns `{ stdout, stderr }` with `on('data')` and `on('exit')` event emitters for live terminal output. `exec()` returns `{ stdout, stderr }` for simple commands.

### Config Persistence (`cfg.ts`)

WebUI calls `ksud module config` via shell exec, with flat-file fallback - mirrors `config_env.sh` behavior. Includes a debounce-based flush system for batch writes. Uses `shellEscape` from `utils.ts` for shell-safe single-quote escaping to prevent command injection. Old localStorage keys are migrated and then removed.

### Script Execution (`app.ts`)

Two modes:
- **Simple mode** (default): Shows a progress dialog, captures output, shows toast on completion
- **Dev mode**: Shows a live terminal with real-time stdout/stderr streaming

### Theme (`theme.ts`)

MWC Material 3 design tokens via CSS custom properties. Supports:
- 8 color presets (blue, yellow, red, purple, green, orange, pink, cyan, grey)
- Auto-detects system dark/light via `prefers-color-scheme`
- Monet dynamic color extraction from wallpaper (Android 12+)

### i18n (`i18n.ts`)

Async translation loader using `lang/*.json` files. English uses `source/string.json`. Falls back gracefully. Supports `data-i18n` on light DOM content. Available languages: en, zh, ru, es, ar.

---

## `customize.sh` - Installer

`sourced by the installer`, uses `$MODPATH` (provided by the installer environment):

```sh
. "$MODPATH/lib/common.sh"
. "$MODPATH/lib/urls.sh"
. "$MODPATH/lib/paths.sh"

# Vol key listener (no `local` keyword - pure POSIX sh)
_vol() {
  while true; do
    _vol_key=$(getevent -qlc 1 2>/dev/null)
    case "$_vol_key" in
      *KEY_VOLUMEUP*)   unset _vol_key; return 0 ;;
      *KEY_VOLUMEDOWN*) unset _vol_key; return 1 ;;
      *KEY_POWER*)      unset _vol_key; return 2 ;;
    esac
    unset _vol_key
  done
}

# Optional keybox install with vol key prompt
# Write module_paths.json for WebUI path discovery
# Bootstrap device info
```

---

## Feature Reference

| Feature | Pipeline | Description | Prerequisites |
|---|---|---|---|
| `gms.sh` | full_integrity | Force-stop + clear Play Store cache | None |
| `target.sh` | full_integrity | Generate Tricky Store target.txt | Tricky Store |
| `security_patch.sh` | full_integrity | Spoof security patch date to previous month | Tricky Store |
| `boot_hash.sh` | full_integrity | Write vbmeta digest for boot hash | None |
| `keybox.sh` | full_integrity | Download, validate (keys + ID), check Google revocation, install keybox | Network, Tricky Store |
| `pif.sh` | full_integrity? | Update Play Integrity Fix fingerprint | Network, PIF installed |
| `hma.sh` | root_hide | Deploy HMA-OSS config | Network, HMA-OSS installed |
| `zygisk_next.sh` | root_hide? | Configure Zygisk Next (denylist, memory) | Zygisk Next |
| `rka.sh` | - | Provision Remote Key Attestation config | PassIt installed |
| `cleanup.sh` | - | Clear detector traces, temp files, ADB props | Boot completed |
| `kill_all.sh` | - | Force-stop + clear all detector + GMS apps | None |
| `widevine.sh` | - | Download attestation key + run KmInstallKeybox | Network, Qualcomm device |
| `lsposed.sh` | - | Delete LSPosed base.odex traces | None |
| `twrp.sh` | - | Delete TWRP folder on internal storage | None |
| `pif2.sh` | - | Disable ROM spoof engines (pihooks/pixelprops/entryhooks) — thin wrapper around `disable_rom_spoof_engines()` | None |
| `suspicious_props.sh` | - | Scan for leftover persistent props from modding tools, Xposed, debug state | None |
| `suspicious_props_clean.sh` | - | Wrapper that calls `suspicious_props.sh --clean` | None |
| `suspicious_props.sh` | - | Scan for leftover persistent props from modding tools, Xposed, debug state | None |
| `suspicious_props_clean.sh` | - | Wrapper that calls `suspicious_props.sh --clean` | None |
| `keybox_info.sh` | - | Check keybox version + Google revocation status | None |

---

## CI Pipeline

### `build-test.yml`
```yaml
- name: Lint shell scripts
  run: find src/ -name '*.sh' -exec shellcheck {} +
- name: Build
  run: npm ci && npm run build
- name: Verify module structure
  run: test -f Module/module.prop && test -f Module/webroot/index.html
- name: Check no hardcoded paths
  run: ! grep -rn "/data/adb/modules/Specter" Module/lib/ Module/features/
- name: Check no su -c in features
  run: ! grep -rn "su -c" Module/features/
```

### `build-release.yml`
Same build + extract version from changelog, create GitHub Release.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     Module Root                           │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────────┐   │
│  │ customize │   │ service  │   │   boot-completed     │   │
│  │   .sh     │   │   .sh    │   │   (KSU/APatch only)  │   │
│  │ writes    │   │ + Magisk │   └──────────┬───────────┘   │
│  │ module_   │   │ fallback │    boot done (KSU) /         │
│  │ paths.json│   └────┬─────┘    inline in service (Mgk)  │
│  └────┬──────┘        │ boot                               │
│       │ install       ▼                                    │
│       ▼           ┌──────────────────────────────────┐     │
│  ┌─────────────────┤           lib/                    │     │
│  │  ┌────────────┐ ├┐ ┌──────────┐ ┌────────────────┐ ││    │
│  │  │ action.sh  │ ││ │ paths.sh │ │   urls.sh      │ ││    │
│  │  │ (thin      │ ││ │(no hard- │ │(single source  │ ││    │
│  │  │  wrapper)  │ ││ │ coded    │ │ of truth for   │ ││    │
│  │  └────────────┘ ││ │ path)    │ │ all URLs)      │ ││    │
│  │                 ││ └──────────┘ └────────────────┘ ││    │
│  │                 ││ ┌──────────────────────────────┐││    │
│  │                 ││ │       common.sh              │││    │
│  │                 ││ │ log, download, die,          │││    │
│  │                 ││ │ check_prop, resetprop_*,     │││    │
│  │                 ││ │ persistprop, read_vbmeta,    │││    │
│  │                 ││ │ apply_boot_hardening,        │││    │
│  │                 ││ │ version_ge, run_device_info, │││    │
│  │                 ││ │ decode_keybox_serial,        │││    │
│  │                 ││ │ find_kmInstallKeybox, ...    │││    │
│  │                 ││ └──────────────────────────────┘││    │
│  │                 ││ ┌──────────────────────────────┐││    │
│  │                 ││ │    config_env.sh             │││    │
│  │                 ││ │ cfg_get/cfg_set                │││    │
│  │                 ││ │ (ksud + flat-file fallback)  │││    │
│  │                 ││ └──────────────────────────────┘││    │
│  │                 ││ ┌──────────────────────────────┐││    │
│  │                 ││ │     package_list.sh          │││    │
│  │                 ││ │ FIXED_TARGETS, DETECTOR_APPS,│││    │
│  │                 ││ │ GMS_KILL_LIST, TOOL_APPS, ...│││    │
│  │                 ││ └──────────────────────────────┘││    │
│  │                 └──────────────────────────────────┘     │
│  │                                                            │
│  │  ┌──────────────┐     ┌─────────────────────────────┐     │
│  │  │ orchestrator │────→│     pipelines/               │     │
│  │  │    .sh       │     │  full_integrity              │     │
│  │  └──────┬───────┘     │  root_hide                   │     │
│  │         │             └─────────────────────────────┘     │
│  │         ▼                                                  │
│  │  ┌──────────────────────────────────────────────────┐     │
│  │  │               features/                           │     │
│  │  │  keybox  target  security_patch  boot_hash  pif   │     │
│  │  │  pif2  hma  zygisk_next  rka  cleanup  gms       │     │
│  │  │  kill_all  widevine  lsposed  twrp  keybox_info   │     │
│  │  └──────────────────────────────────────────────────┘     │
│  │                                                            │
│  │  ┌──────────────────────────────────────────────────┐     │
│  │  │              webroot/ (Vite-bundled)               │     │
│  │  │  index.html → MWC @material/web 2.4.1             │     │
│  │  │  css/app.css (MWC theme vars)                      │     │
│  │  │  js/ (20 modules: app, bridge, cfg, clock,         │     │
│  │  │      constants, device, history, i18n, theme,      │     │
│  │  │      toast, dialog, file-browser, redirect, ...)  │     │
│  │  │  lang/ (5 language files)                          │     │
│  │  │  json/ (module_paths.json, info.json, dev.json)    │     │
│  │  │  common/ (device-info.sh + delegates)              │     │
│  │  └──────────────────────────────────────────────────┘     │
│  │                                                            │
│  │  ┌──────────────────────────────────────────────────┐     │
│  │  │   rka/ (jsonarray.sh - pure awk JSON library)     │     │
│  └──────────────────────────────────────────────────────────┘
```

---

## File Count Summary

- `lib/` - 5 files (paths, urls, common, config_env, package_list)
- `features/` - 18 files (keybox, target, security_patch, boot_hash, pif, pif2, hma, zygisk_next, rka, cleanup, gms, kill_all, widevine, lsposed, twrp, keybox_info, suspicious_props, suspicious_props_clean)
- `pipelines/` - 2 text files (full_integrity, root_hide)
- `rka/` - 1 file (jsonarray.sh)
- `webroot/` - index.html, config.json, css/app.css, 21 TypeScript modules, 5 lang files, 3 json files, 2 assets, 4 common scripts
- Root scripts - customize.sh, service.sh, boot-completed.sh, uninstall.sh, action.sh, orchestrator.sh (6 files)
