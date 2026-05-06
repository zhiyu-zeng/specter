#!/system/bin/sh
set -e
MODDIR=${0%/*}
. "$MODDIR/../lib/common.sh"
. "$MODDIR/../lib/paths.sh"

log "ZYGISK_NEXT" "Start"

REQUIRED="1.3.0"

ZYNEXT_DIR="/data/adb/modules/zygisksu"
[ ! -d "$ZYNEXT_DIR" ] && ZYNEXT_DIR="/data/adb/modules_update/zygisksu"

ZYNEXT_PROPFILE="$ZYNEXT_DIR/module.prop"
SCRIPT_FILE="$ZYNEXT_DIR/bin/zygiskd"

if [ ! -f "$ZYNEXT_PROPFILE" ]; then
  log "ZYGISK_NEXT" "Error: Zygisk Next module not found at $ZYNEXT_DIR"
  exit 1
fi

CURRENT=$(grep "^version=" "$ZYNEXT_PROPFILE" | cut -d'=' -f2 | cut -d' ' -f1)
log "ZYGISK_NEXT" "Detected Zygisk Next version $CURRENT"

version_ge "$CURRENT" "$REQUIRED" || {
  log "ZYGISK_NEXT" "Error: Zygisk Next version $CURRENT is too low, need $REQUIRED"
  exit 0
}

ensure_dir "$(dirname "$SCRIPT_FILE")"

log "ZYGISK_NEXT" "Setting enforce-denylist to just_umount..."
"$SCRIPT_FILE" enforce-denylist just_umount 2>/dev/null && \
  log "ZYGISK_NEXT" "enforce-denylist set to just_umount" || \
  log "ZYGISK_NEXT" "Warning: Failed to set enforce-denylist"

log "ZYGISK_NEXT" "Setting memory-type to anonymous..."
"$SCRIPT_FILE" memory-type anonymous 2>/dev/null && \
  log "ZYGISK_NEXT" "memory-type set to anonymous" || \
  log "ZYGISK_NEXT" "Warning: Failed to set memory-type"

log "ZYGISK_NEXT" "Setting linker to builtin..."
"$SCRIPT_FILE" linker builtin 2>/dev/null && \
  log "ZYGISK_NEXT" "linker set to builtin" || \
  log "ZYGISK_NEXT" "Warning: Failed to set linker"

log "ZYGISK_NEXT" "Finish"
exit 0
