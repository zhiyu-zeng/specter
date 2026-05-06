#!/system/bin/sh
set -e
MODULE_ROOT="${0%/*}"
MODULE_ROOT="${MODULE_ROOT%/webroot/common}"
. "$MODULE_ROOT/lib/common.sh"
. "$MODULE_ROOT/lib/paths.sh"

INFO_PATH="$MODULE_ROOT/webroot/json/info.json"

_android_ver=$(_escape_json "$(getprop ro.build.version.release)")
_kernel_ver=$(_escape_json "$(uname -r)")
_version=$(_escape_json "$(grep '^version=' "$MODULE_ROOT/module.prop" | cut -d'=' -f2)")

# Root Implementation
# Strategy: kernel-level root providers first, then userspace
# Most-specific variant checks before generic catch-alls
_root_type="Unknown"
if [ -d "/data/adb/ap" ]; then
  _root_type="APatch"
elif [ -d "/data/adb/ksu" ]; then
  if [ -f "/data/adb/ksu/.dynamic_sign" ]; then
    _root_type="SukiSU-Ultra"
  elif [ -f "/sys/module/kernelsu/parameters/expected_manager_size" ]; then
    _root_type="KernelSU-Next"
  else
    _root_type="KernelSU"
  fi
elif [ -f "/data/adb/magisk" ] || [ -f "/data/adb/magisk.db" ]; then
  _root_type="Magisk"
fi

detect_root_solution

# Keybox format
if [ -f "/data/adb/tricky_store/locked.xml" ]; then
  _keybox_format="locked.xml"
elif [ -f "/data/adb/tricky_store/keybox.xml" ]; then
  _keybox_format="keybox.xml"
else
  _keybox_format="none"
fi

# Security patch date
_patch_date=$(grep '^boot=' /data/adb/tricky_store/security_patch.txt 2>/dev/null | cut -d= -f2 || echo "")

# Flags
_twrp="false"; [ -f "$SPECTER_DIR/twrp" ] && _twrp="true"
_blacklist="false"; [ -f "$SPECTER_DIR/blacklist_enabled" ] && _blacklist="true"

# TEE status
_tee_status="unknown"
if [ -f "/data/adb/tricky_store/tee_status" ]; then
  _tee_val=$(grep -E '^teeBroken=' /data/adb/tricky_store/tee_status | cut -d= -f2 2>/dev/null || echo "")
  case "$_tee_val" in
    true)  _tee_status="broken" ;;
    false) _tee_status="normal" ;;
  esac
fi

# Output JSON
cat <<EOF > "$INFO_PATH"
{
  "android": "$_android_ver",
  "kernel": "$_kernel_ver",
  "root": "$_root_type",
  "root_sol": "$ROOT_SOL",
  "version": "$_version",
  "keybox_format": "$_keybox_format",
  "tee_status": "$_tee_status",
  "security_patch": "$_patch_date",
  "flags": {
    "twrp": $_twrp,
    "blacklist": $_blacklist
  }
}
EOF
unset _android_ver _kernel_ver _root_type _version _keybox_format _tee_status _patch_date _twrp _blacklist