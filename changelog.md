# v1.4.4.07

## Type Safety & Code Quality

- **Zero `as any` casts**: all ~71 `as any` occurrences eliminated across 30+ TypeScript files. Replaced with proper typed intersections (`HTMLElement & { selected: boolean }`, `HTMLButtonElement`), union types (`type: 'success' | 'error' | 'info' | 'warning'`), and explicit type assertions
- **`ChildProcess` overloads**: `on('exit')` and `on('error')` events now have proper parameter types instead of `(...args: unknown[]) => void`
- **`tsconfig.json` strictness**: enabled `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` — codebase compiles cleanly with zero errors
- **`window-global.ts`** helper: single typed abstraction for dynamic window property access (`getGlobal<T>`, `setGlobal`, `deleteGlobal`), eliminating all `window as unknown as Record<string, unknown>` patterns from consumer modules
- **Typed error hierarchy**: `SpecterError` (base) → `BridgeError` / `ScriptError` / `TimeoutError` / `ConfigError` with machine-readable `.code` and optional `.context` payload — replaces bare `Error` throws throughout bridge.ts
- **TSDoc documentation**: all public API exports across 6 core modules (`bridge.ts`, `cfg.ts`, `toast.ts`, `utils.ts`, `color-utils.ts`, `window-global.ts`) now have typedoc-style comments

## Shell

- **`version_ge()`**: pure POSIX-sh implementation (IFS splitting + arithmetic comparison) — no longer depends on `awk`, fixing compatibility with KernelSU/APatch environments where toybox lacks awk
- **`bridge.ts` callback system**: rewritten from fragile `window[cbName]` global namespace pollution to a private `Map<string, callback>` registry with individually-named `__sp_*` globals and explicit cleanup on completion/timeout/error

## Testing

- **vitest infrastructure**: 7 test files, 65 tests covering bridge integration (KernelSU mock with exec/runScript/spawnScript), config caching, toast notification lifecycle, colour preset matching, utility functions, window-global helper, and accessibility patterns
- **CI integration**: vitest step added to `.github/workflows/build-test.yml` alongside existing shell test runner
- **Shell tests**: 16 tests across 12 test files, all passing

## Infrastructure

- **`vitest.config.ts`** with happy-dom environment for DOM-dependent tests
- **`package.json`** — `npm test` and `npm run test:watch` scripts added
- **CI badge** added to README

## Removed
- **Recovery feature deleted entirely**: `src/features/recovery.sh`, `hide_recovery_folders()` from `props.sh`, recovery toggle from WebUI (index.html, constants.ts, all lang files), `recovery_detected` from device-info JSON + TypeScript types + mock, stale references in cleanup.sh, boot_core.sh dispatch, and all recovery tests
- **Prop handler removed from scheduler**: boot state props are one-time at boot, no need for hourly re-runs (`scheduler.sh` prop_handler task deleted)

## Added
- **Scheduler system** (`src/lib/scheduler.sh`): central periodic task daemon — runs keybox_info.sh every 6h and auto_target.sh every 5min; uses inotifyd for app-install triggered scans; manages PID/task lifecycle
- **Region props** (`props.sh`): `detect_region()` + `apply_region_props()` sets IMS/locale props per region (CN, IN, RU, JP, KR, BR), gated by `region_props` config
- **Boot logging**: boot_core.sh now logs to `$SPECTER_DIR/log/boot.log` with rotation; `log.sh` writes to Android logcat + added `log_rotate()` helper
- **Denylist merge at boot**: `target.sh --merge-denylist` imports magisk denylist packages into target.txt
- **`post-fs-data.sh` async boot_core.sh**: sleep-15 fallback for KSU/APatch module managers that skip boot-completed.sh

## Changed
- **Keybox boot race fixed**: keybox_info.sh delayed 60s (`sleep 60; sh ...`) so network is ready before catalog download
- **Auto Target → one-shot scan**: daemon loop replaced with single-pass scan tracking seen packages via `auto_known_packages.txt`; no longer checks TEE status for `?` suffix; no PID file, no interval loop; now defaults to ON
- **WebUI target-apps.ts — click split**: row click toggles unchecked↔bare (target) or unchecked↔blacklisted (blacklist); circle click cycles bare→conditional→force→bare. Removed unused `TARGET_STATE_ORDER`
- **Target merge helpers extracted**: `_merge_setup`, `_merge_cleanup`, `_merge_load_existing`, `_normalize_pkg`, `_append_missing` moved from target.sh into target_common.sh; teeBroken→? default suffix fallback removed
- **Props**: `sp_try()` saves originals to `PERSIST_RESTORE_FILE` for uninstall restore; `apply_boot_props` now includes `ro.boot.warranty_bit:0`; `hexpatch_deleteprop()` simplified (no more magiskboot hexpatch, always resetprop -p --delete)
- **rom_fingerprint.sh**: LineageOS camera packagelist scrub (`vendor.camera.aux.packagelist`, `persist.vendor.camera.privapp.list`), `vendor.lineage_health` service kill, `ro.product.vendor.name` added to prefix list, hexpatch calls → direct `resetprop --delete`
- **action.sh**: full pipeline wrapped with `tee -a "$ACTION_LOG"` + log rotation
- **desc.sh**: removed "skip if unchanged" optimization (always writes new description)
- **device.ts**: added missing `t()` helper (`getTranslation(key) || fallback`) so TEE labels render correctly
- **WebUI i18n**: 10 new keys (`tee_broken`, `tee_normal`, `dialog_confirm`, `boot_harden_dialog_*`, `kb_refresh_btn`, `clear_history_btn`, `home_events_initial`, `auto_target_interval_aria`) synced across all 5 languages
- **`package.json`**: zip filename now `Specter-v{version}.zip` (v prefix)
- **`update.json`**: version 1.4.4.07, versionCode 14407

## Removed Features
- `src/features/recovery.sh`, `hide_recovery_folders()`, `toggle_recovery` toggle
- `recovery_detected` field from InfoJson type + device-info.sh + dev-mock
- `tests/test_recovery.sh`
- `suspicious_props` (consolidated into boot_state_props.sh in v1.4.4)
- Stale `toggle_recovery` reference in test_boot_core.sh
- `toggle-action_pif` default override (was `'0'`)
- Inline prop handler loop + auto_target daemon from boot_core.sh (replaced by scheduler)

## Bug Fixes
- Keybox info showing "Generic" at boot (network race): added 60s delay
- device.ts `ReferenceError` on TEE label rendering: added missing `t()` translation helper
- `desc.sh` redundant overwrite: removed skip-if-unchanged optimization
- auto_target interval field in WebUI no longer starts/stops daemon (one-shot only)

# v1.4.4

## New
- ADB Disabler - disable USB debugging, developer options, and OEM unlock at boot
- GMS sub-toggles: force-stop vs clear data, configurable per action
- Interactive WebUI dialogs for ADB Disabler, Boot Hardening, ROM Fingerprint, Prop Handler, GMS
- Conflict resolution UI with live toggle switching
- Security patch now fetches real date from source.android.com, outputs all=YYYY-MM-DD format
- target.sh --merge mode (incremental add, preserves existing target.txt)
- Long-press nav ring and back popup intercept in WebUI navigation
- Per-feature logging to $SPECTER_DIR/log/ at boot

## Changed
- Boot state props, build spoofing, and suspicious props cleanup consolidated into boot_state_props.sh
- boot_core.sh runs disable_bootloader_spoofer at boot (was only in cleanup action)
- Background daemon loops use PID files for clean lifecycle management
- Security patch WebUI fallback: shows build_patch when spoofed value missing
- TEE detection uses A/B slot suffix for vbmeta device; zero-hash treated as unavailable
- HMA config download tries busybox wget first, falls back to download()
- cleanup.sh now clears log buffers, ANR traces, kernel debug; removed remote control app data
- pif.sh detects module type from module.prop instead of probing for script files
- Installed keybox target replaces previous if different (with backup)

## Removed
- bootloader_spoofer.sh and suspicious_props.sh (consolidated into other features)
- PIHook detection from rom_spoof_cleanup.sh and cleanup.sh
- Remote control app data cleanup, delayed boot spoofing loop, duplicate boot hash file
- Unused full_integrity and root_hide pipelines

## Refactored
- Monolithic common.sh split into modular libs: log.sh, util.sh, network.sh, detect.sh, paths.sh, props.sh, keybox.sh, conflicts.sh
- target_common.sh created for shared target generation logic (TEESimulator, blacklist, customize.txt, TEE status)
- Action pipeline now uses orchestrator.sh with toggle: prefix gating per step
- target_merge.sh is now a thin wrapper around target.sh --merge

## Installer
- Rewritten _vol() with live countdown and interactive Vol- toggle
- Merged keybox + target prompts into single "Run full setup?" prompt
- Keybox installation delegates to features/keybox.sh

## Bug Fixes
- Fixed sp_persist() reading original value before writing - prevented HyperOS bootloops
- Fixed block_rom_spoof_engines() backing up all pixelprops before deletion
- Fixed WebUI-triggered features escaping KSU/APatch mount namespace via nsenter -t 1 -m
- Fixed resetprop -w polling interval and sleep timing in service.sh
- Fixed A/B slot suffix handling in vbmeta.sh and tee.sh
- Fixed GMS targets in FIXED_TARGETS; PIF toggle consistency; adb_disabler mtp fallback
- Fixed equalize sub-toggle width in dialog list items
- Fixed security patch WebUI showing placeholder - fall back to ro.build.version.security_patch when no spoofed value
- Fixed list-item-content description text wrapping with min-width: 0 and spacer margin-left: auto
- Fixed keybox_info.sh JSON validity for empty private values and softbanned status
- Fixed remove set -e from target.sh, gms.sh, orchestrator.sh for mksh compatibility

# v1.4.3

## Home Page Redesign
- **Hero-grid layout**: keybox card + security patch card side by side; compact mini-info row (version, root, TEE) hidden by default
- **Inline recent activity**: lazy DOM — 4 items on load, "Show all" builds remaining on click; copy-to-clipboard on each entry; clear button
- **Security patch card**: shows spoofed patch date, TEE status (Normal/Broken), and PIF spoofed device name — no "Current"/"Outdated" pill
- **Keybox card**: provider name + version + Latest/outdated badge + Active/Revoked/Softbanned status in a single card
- **Auto-refresh on home tab**: data refreshes on every home tab visit (rAF + `onHomeShow` callback); full rewrite of app.ts phase pipeline
- **localStorage cache removed** for device/keybox info — JSON on disk is always the source of truth; `fetch()` uses `{ cache: 'no-cache' }` to prevent WebView HTTP caching

## Keybox Status Decoupled
- **Shell-daemon approach**: `keybox_info.sh` runs at boot, periodically every 6h (via `boot_core.sh`), and after every install; revocation checking (catalog + Google) happens entirely in the shell
- **WebUI reads pre-computed JSON only**: no more catalog download, no Google revocation text fetch, no `cfgGet` — the WebUI just reads `keybox_info.json` from disk
- **`action.sh` calls `keybox_info.sh`**: after the action pipeline, so keybox status stays fresh without a separate trigger
- **Removed `exec` parameter** from `refreshKeyboxStatus()` — always reads disk, never re-runs the script

## RKA Feature Removed
- **Full deletion**: `src/features/rka.sh`, `src/rka/jsonarray.sh`, `IDFILE` path, `RKA_HOST`/`RKA_TCP`/`RKA_TOKEN` vars in `urls.sh`
- **Uninstall cleanup removed**: RKA config file no longer wiped on uninstall
- **UI entry removed**: "Update RKA Config" list item removed from tools page
- **i18n keys removed**: `advance_upd_rka` and `advance_upd_rka_desc` from all 5 languages
- **Build updated**: `src/rka` removed from `build:module` cp paths in `package.json`
- **README updated**: RKA removed from feature list

## PIF .prop Support & Diagnostics
- **PIF model detection**: `device-info.sh` reads 6 paths — 2 `.prop` files first (`/data/adb/pif.prop`, `/data/adb/modules/playintegrityfix/custom.pif.prop`), then 4 legacy `.json` files
- **New `pif_model` field** in `InfoJson` type; displayed on security patch card as "Spoofed Device"
- **PIF preflight checks**: `pif.sh` probes reachability of `developer.android.com` and `flash.android.com` via `busybox wget`; if unreachable, reports ping/v6/curl diagnostics
- **Enhanced `autopif.sh` failure message**: suggests installing curl if `busybox wget` fails on IPv6-only hosts

## Typography & CSS Polish
- **Typography tuning**: keybox provider name and spoofed device text truncate at 120px; security patch date uses normal font (no monospace)
- **Top bar**: taller (64px), surface-container background on scroll, heavier shadow
- **Button/card shapes**: filled buttons use 9999px pill shape; card corners reduced from large to medium
- **Refresh button removed**: replaced by auto-refresh on home entry + per-card refresh icon on keybox card footer
- **Secondary container colors** for tonal buttons, filter chips, segmented buttons (was primary)

## Infrastructure
- `package.json` build:module updated: `src/rka` removed from cp paths

# v1.4.2

## Performance
- Network check 3× faster: 1 DNS + 1 HTTP (7s max) vs 6 retries (21s)
- One-pass keybox_info.json read in desc.sh; skip refresh if description unchanged
- TEE readiness: retry loop (5× 500ms) instead of fixed sleep
- Action pipeline sources desc.sh directly instead of full boot_core.sh
- Target merge uses single `pm list packages` instead of two

## HMA Config
- Fixed silent empty download: `printf` chokes on 521KB variable in busybox ash — pass target file directly to `download()` instead
- `download()` hardened: User-Agent header, non-empty output validation, reliable temp cleanup

## Boot & Description
- `keybox_info.sh` backgrounded at boot (non-blocking)
- Catalog + Google revocation analysis restored for boot/install-time description (keybox source, version, revocation status)
- `security_patch.sh` runs at boot so description shows patch date without WebUI
- Redundant `refresh_desc.sh` calls pruned from 4 feature scripts; redundant `keybox_info.sh` calls pruned from keybox.sh
- `refreshKeyboxStatus(exec)` param to skip shell re-exec when data is fresh
- Keybox install flow manually calls `refresh_desc.sh` + `refreshKeyboxStatus(false)` to avoid redundant re-exec
- `keybox_info.sh` checks network before catalog download for reliability

## WebUI
- Dynamic i18n: English statically imported; others fetched at runtime with localStorage cache (76K bundle)
- AMOLED theme mode with true-black CSS overrides, segmented button, translations
- `Promise.all` for refresh button — device, keybox, and catalog fetch in parallel
- Catalog analysis moved to browser `fetch()` — parallel catalog + Google revocation check
- Enriched keybox data written back to disk + description refreshed after analysis
- Network chip uses hardcoded MD3 reference colors (green/red) for unambiguous readability across Monet themes
- Global `user-select: none` prevents accidental text selection on mobile (with input/contenteditable exceptions)
- App Targeting overlay back button correctly routed via `history.back()` — no longer triggers global nav
- Copy buttons for terminal output and activity history entries (one-tap with toast feedback)
- `decodeURI` → `decodeURIComponent` bug fix for contributor links
- Responsive contributors grid (`auto-fit` instead of fixed `1fr 1fr`)
- `data-i18n` attributes on preset chips (declarative translation)

## Other
- `target_applied` marker removed — obsolete since `target_merge.sh` handles incremental updates
- Theme: `cfgSet('theme_preset', 'monet')` restored so switching to Monet persists across reboot
- Color mapping: low-saturation wallpaper colors resolve to `'blue'` preset instead of `'grey'`
- `.gitignore` updated with `web/` workspace patterns
- `keybox_format` field removed from device info; `serial`/`is_private` added to KeyboxInfoJson
- Dead code removed: 4 unused i18n keys from all languages, dead imports (spawnScript, cfgFlush, appendToOutput), APP_CATALOG constant, refreshControlToggles import
- OEM unlock toggle no longer suppressed — `ro.oem_unlock_supported`, `sys.oem_unlock_allowed`, and `settings put global oem_unlock_allowed` removed from hardening (zero detection impact, only hides the UI toggle)

## Infrastructure
- VitePress documentation site split to separate repo [`specter-web`](https://github.com/dpejoh/specter-web)
- Deployed via Cloudflare Pages at [specter.dpejoh.com](https://specter.dpejoh.com)

## Contributors
- @myst-25 — architecture review, recommendations, and UI/UX improvements (PR #4)

# v1.4.1

## Control System Fixes
- **Recovery toggle**: ON now runs `hide_recovery_folders()` correctly
- **Toggle switch writes fixed**: `sw.toggleAttribute` → `sw.selected` so `md-switch` fires `change` events
- **Action pipeline config path**: `action.sh` sources `lib/paths.sh` so `$CONFIG_DIR` resolves
- **Keybox detection fixed**: removed `check_network` gate and `set -e` from `keybox_info.sh`
- **Catalog serial format**: added `printf '%u'` hex→decimal conversion; matching loop tries both
- **Multi-cert decode fixed**: `/-----END CERTIFICATE-----/q` stops after first cert; base64 whitespace stripped
- **Keybox status stale**: `keybox.sh` calls `keybox_info.sh` after install; WebUI calls `refreshKeyboxStatus()`
- **Config simplified**: removed `ksud module config` fallback; `.val` files only
- **Conflict system**: `apply_conflict_toggles()` deleted; conflicts write `conflict_*` keys only
- **Action pipeline**: `set -e` removed; each step guarded with `|| true`
- **Delayed spoofing**: gated on recovery toggle via `_feature_should_run()`

## Boot & TEE
- **One-time boot markers**: tee and ROM spoof cleanup run once after install
- **Boot feature list trimmed**: dispatches recovery, boot_hardening, suspicious_props, lsposed only
- **TEE attestation**: moved to boot via APK ContentProvider with cached status + hash
- **target.txt merges** missing apps instead of overwriting; order preserved

## Keybox
- **Softbanned status**: new `softbanned` boolean; `findWorking()` and raw serving exclude softbanned
- **Auto-override**: `POST /set-auto-override` and `/clear-auto-override` endpoints
- **Set-status endpoint**: `POST /catalog/set-status` replaces toggle-softban; checks Google revocation
- **Three-state chip**: Active/Softbanned/Revoked with dropdown

## Module Description
- **Dynamic description**: manager apps show live keybox source, revocation, app count, patch date
- **Real-time refresh**: recomputed on keybox install, target edit, or patch change
- **Tricky Store/conflict detection** shown in description
- **`refresh_desc.sh`** for on-demand refresh; WebUI calls it after writes

## Other
- APK bundling; Suspicious Props toggle added to UI; USB debugging code removed; TEE APK self-removes

# v1.4.0

## Performance
- **Page renders instantly**: placeholders, code splitting (490KB→4 chunks), inlined CSS, parallel MWC download
- **Native `<select>`**: eliminated 120KB MWC select chunk
- **Back button**: first press Home, second exits
- **Offline detection**: 2000ms→800ms

## Theme
- **Theme flash eliminated**: inline script sets CSS vars before first paint; cached in localStorage
- **MCU library replaced**: 97KB → 7.5KB lookup table; Monet accent mapped to closest preset

## i18n
- **English strings inlined**; non-English cached in localStorage

## Boot State Properties
- **Vendor boot props** reset alongside `ro.boot.*`; `ro.build.flavor` spoofed; Realme props added
- **Recovery bootmode** masked; toggle added to Control

## Other
- Security Patch fetched from source.android.com; suspicious props backed up before delete
- Google Services section in Tools; module zip 175KB→159KB

# v1.3.3

## Features
- **Dynamic module description**: priority-based status line (keybox, revocation, apps, patch)
- **One-time TEE check**: APK downloaded, run, self-deletes after caching result
- **"Fix PIF Detection" button restored**: boot function only set guard props — `block_rom_spoof_engines()` now actively removes `pihook`/`pixelprops`

## Boot Refactor
- **`apply_boot_props()`**: early boot only, no AVB override, Magisk-only
- **Unified boot logic**: `lib/boot_core.sh` for both `service.sh` and `boot-completed.sh`
- **`_feature_should_run()`**: single toggle+conflict gate
- **Feature scripts extracted**: `boot_hardening.sh`, `bootloader_spoofer.sh`, `rom_spoof.sh`
- **Toggle/LSPosed/recovery/hardening fixes** for KSU and Magisk parity

## Installer
- **Module detection**: reads module.prop for variant; consolidated `detect_root_solution()`
- **Conflict registry**: extracted to `config/conflicts.txt`

## Other
- 14 conflict tests; `twrp.sh`→`recovery.sh`; dead code removed

# v1.3.2

## Conflict Type System
- **Aggressive vs passive**: aggressive (TSupport, Yurikey, IntegrityBox) renamed to `.bak`; passive (TreatWheel, NoHello, SensitiveProps) coexist with deferred toggles
- **`_conflict_claimed()`** honors priority choice; passive skips rename, only recalculates toggles
- **Treat Wheel**: corrected from 3 features to just `boot_hardening`
- **Sensitive Props**: corrected from 3 features to `boot_hardening`, `suspicious_props`

## Other
- TEE status detection: reads both `tee_status` and `tee_status.txt` formats
- `disable_dev_options()` removed; all vol-key conflict prompts removed (fully automatic)

# v1.3.1

## WebUI Restructure
- **app.ts split**: 844→140 lines; 5 domain modules extracted
- **target-apps.ts**: 7 mutable vars eliminated, state local to closure

## Performance
- **Batch config init**: single exec reads all `.val` files (~15× fewer round trips)
- **HTTP fetch cache**: TTL-based; network polling 3s→15s

## APatch / KSU
- **`download()` PATH**: added `/data/adb/ap/bin:/data/adb/ksu/bin` for busybox
- **Keybox fallback**: real provider URLs, `download()` instead of `--spider`

## Type Safety
- **17 MDC elements typed**: ~60 `as any` eliminated; dialog factory; zero type errors

## Other
- System fallback for security patch; nav bar indicator fixed; responsive browse button

# v1.3.0

## VBMeta / Boot Hash
- **`read_vbmeta()` removed**: raw partition SHA-256 was incorrect
- **`boot_hash.sh` rewritten**: system prop → `/proc/cmdline` → user config → stored file; no zero fallback
- **`/proc/cmdline` source**: bootloader digest survives module interference

## Installer
- **Timeout on vol-key prompts** (8s default); download timeout guard (30s)

## New Features
- **Interactive App Targeting overlay**: full M3 sub-page, 4-state cycling, blacklist mode, DenyList import
- **App Catalog management**: CRUD, sortable, JSON import/export
- **Security Patch dialog**: M3 date input with auto-generate
- **Binary-level prop deletion**: `hexpatch_deleteprop()` via magickboot
- **Periodic suspicious props re-cleaning** (hourly)
- **File permission hardening**: /proc/cmdline, /proc/net/unix, install-recovery.sh, addon.d

## Conflict Resolution
- **`apply_conflict_toggles()`** writes both `toggle_*` and `toggle_action_*`
- **NoHello narrowed**: 7→1 feature; `refreshControlToggles()` missing recovery entry fixed
- **New registry entries**: Sensitive Props, Yurikey, Integrity Box

## i18n
- **All 4 translations** synced to 180 keys; 24 missing Control keys added; 26 new keys

## Removed Features
- **`boot_hash.sh` removed**: boot hash is automatic
- **`pif2.sh` removed**: boot-time `block_rom_spoof_engines` covers it
- **SmartMerge removed**: replaced by App Targeting overlay
- **WebUI tab persistence removed**: always opens Home

## Other
- PIF default off; `post-fs-data.sh` for early conflict resolution; hex→decimal serial safety

# v1.2.0

## Feature Toggle System
- **Control page**: per-feature toggles for boot behavior and action pipeline; values stored as `.val` files

## Conflict Resolution System
- **Data-driven registry**: single source of truth; adding a module is one entry
- **`apply_conflict_toggles()`**: auto-enables/disables based on priority
- **Config migration**: old conflict files migrated; backup system for uninstall
- **WebUI integration**: `conflicts.sh` exposes JSON; toggles refresh live

## WebUI
- **Setup + Maintain merged** into Tools (5→4 tabs); old hashes auto-migrate
- **Dialogs rewritten per M3 spec**: no inline styles, proper ARIA

## Other
- No forced target.txt on install; action pipeline individually gated
- `gms.sh` kills droidguard by name pattern; `target.sh` uses `_is_teesimulator`
- `docs/CONFLICTS.md` added; README simplified

# v1.1.0

- **GMS stability**: no multi-package force-stop (caused logouts); Play Store-only kill
- **Property system**: `sp_try()` replaces `resetprop_if_diff`/`resetprop_if_match`; `sp_persist()` replaces `persistprop`
- **New scripts**: `kill_play_store.sh`, `suspicious_props.sh`, `package_list.sh`
- **`post-fs-data.sh` merged** into `service.sh`
- **WebUI navigation**: Actions/Adevanced/Keybox/Tools → Home/Setup/Maintain/Settings; Danger Zone added
- **URL hash routing** with popstate; tab persistence; RTL centering
- **Logging**: 16/18 scripts follow `[TAG] Start/Finish` pattern

# v1.0.0

- **Rebranded from Yurikey to Specter**
- **Architecture**: vanilla JS → strict TypeScript + Vite; BeerCSS → MWC; static colors → Material Color Utilities + Monet
- **Pipeline orchestration** via `orchestrator.sh`; shared `lib/common.sh`; config via `ksud module config`
- **Keybox**: Google revocation checking, multi-source catalog, custom install, status card, backup/restore
- **~40+ boot props** with delayed spoofing; VBMeta from block device; CROM hook detection
- **16 modular feature scripts**, multi-root support (Magisk/KSU/APatch)
- **WebUI**: M3 pill nav, 5 languages, 9 color presets, dark/light/auto, page transitions
- **CI/CD**: GitHub Actions, TS checking, automated module zip + update.json
