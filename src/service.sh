#!/system/bin/sh
set -e
MODDIR=${0%/*}
. "$MODDIR/lib/common.sh"
. "$MODDIR/lib/package_list.sh"

log "SERVICE" "Setting boot properties"

# ============================================================================
# EARLY BOOT PROPS (immediate, no wait)
# ============================================================================

# --- Bootloader / VBMeta state ---
resetprop_if_diff ro.boot.vbmeta.device_state locked
resetprop_if_diff vendor.boot.vbmeta.device_state locked
resetprop_if_diff ro.boot.verifiedbootstate green
resetprop_if_diff vendor.boot.verifiedbootstate green
resetprop_if_diff ro.boot.flash.locked 1
resetprop_if_diff ro.boot.veritymode enforcing

# --- Warranty & debug bits ---
resetprop_if_diff ro.boot.warranty_bit 0
resetprop_if_diff ro.warranty_bit 0
resetprop_if_diff ro.vendor.boot.warranty_bit 0
resetprop_if_diff ro.vendor.warranty_bit 0
resetprop_if_diff ro.debuggable 0
resetprop_if_diff ro.force.debuggable 0
resetprop_if_diff ro.secure 1
resetprop_if_diff ro.adb.secure 1
resetprop_if_diff ro.build.type user
resetprop_if_diff ro.build.tags release-keys

# --- OEM-specific props ---
resetprop_if_diff ro.secureboot.lockstate locked
resetprop_if_diff ro.boot.realme.lockstate 1
resetprop_if_diff ro.boot.realmebootstate green
resetprop_if_diff ro.is_ever_orange 0

# --- Recovery mode hiding ---
resetprop_if_match ro.bootmode recovery unknown
resetprop_if_match ro.boot.bootmode recovery unknown
resetprop_if_match vendor.boot.bootmode recovery unknown
resetprop_if_match ro.boot.mode recovery unknown

# --- USB / ADB lockdown ---
resetprop_if_diff sys.oem_unlock_allowed 0
resetprop_if_diff ro.oem_unlock_supported 0
resetprop_if_diff persist.sys.usb.config none
resetprop_if_diff sys.usb.config mtp
resetprop_if_diff service.adb.root 0

# --- Emulation detection ---
resetprop_if_diff ro.kernel.qemu 0
resetprop_if_diff ro.boot.qemu 0

# --- SELinux ---
resetprop_if_diff ro.boot.selinux enforcing
[ "$(getprop ro.boot.selinux)" = "enforcing" ] && resetprop_if_diff ro.build.selinux 1

# Protect SELinux policy files from userspace toggling
if [ "$(toybox cat /sys/fs/selinux/enforce 2>/dev/null)" = "0" ]; then
  chmod 640 /sys/fs/selinux/enforce 2>/dev/null || true
  chmod 440 /sys/fs/selinux/policy 2>/dev/null || true
fi

# --- Crypto ---
resetprop_if_diff ro.crypto.state encrypted

# --- Build identity — all variant props ---
while IFS= read -r _prop; do
  [ -z "$_prop" ] && continue
  case "$_prop" in
    *.build.type) resetprop_if_diff "$_prop" user ;;
    *.build.tags) resetprop_if_diff "$_prop" release-keys ;;
  esac
done <<PROPS
$(resetprop 2>/dev/null | grep -oE 'ro\.[^.]+\.build\.(type|tags)' || true)
PROPS
unset _prop

# --- Additional hardening ---
resetprop_if_diff ro.boot.veritymode.managed yes
resetprop_if_diff sys.usb.adb.disabled 1
resetprop_if_diff ro.hardware.virtual_device 0

# --- Vbmeta fixer — read real size/digest from block device ---
_vbmeta_out=$(read_vbmeta 2>/dev/null || echo "")
if [ -n "$_vbmeta_out" ]; then
  _vbsize="${_vbmeta_out%% *}"
  _vbhash="${_vbmeta_out#* }"
  resetprop -n ro.boot.vbmeta.size "$_vbsize" 2>/dev/null || true
  resetprop_if_diff ro.boot.vbmeta.hash_alg sha256
  resetprop_if_diff ro.boot.vbmeta.avb_version 2.0
  if [ -n "$_vbhash" ] && [ ! -f "/data/adb/boot_hash" ]; then
    resetprop -n ro.boot.vbmeta.digest "$_vbhash" 2>/dev/null || true
  fi
fi
unset _vbmeta_out _vbsize _vbhash

log "SERVICE" "Boot properties set"

# ============================================================================
# AFTER BOOT COMPLETED
# ============================================================================

# KernelSU / APatch: boot-completed.sh handles hardening
[ "$KSU" = "true" ] && {
  log "SERVICE" "KernelSU/APatch detected - boot-completed.sh handles hardening"
  exit 0
}

# Magisk: poll sys.boot_completed, then apply hardening
log "SERVICE" "Magisk detected - waiting for boot completion"
while [ "$(getprop sys.boot_completed)" != "1" ]; do
  sleep 1
done
log "SERVICE" "Boot completed - applying hardening"

# Apply boot hardening (settings + prop deletes)
apply_boot_hardening
log "SERVICE" "Boot hardening applied"


# Hide TWRP / OrangeFox / FOX recovery folders from /sdcard
log "SERVICE" "Hiding recovery folders..."
hide_recovery_folders
log "SERVICE" "Recovery folders hidden"

log "SERVICE" "Running boot-time features..."

sh "$MODDIR/features/boot_hash.sh" 2>/dev/null || true
sh "$MODDIR/features/security_patch.sh" 2>/dev/null || true

disable_bootloader_spoofer

sh "$MODDIR/features/suspicious_props.sh" >/dev/null 2>&1 || true

block_rom_spoof_engines

log "SERVICE" "Boot-time features done"

# Delayed spoofing - 120s delay to re-apply props that system may have overridden
(
  sleep 120
  log "SERVICE" "Delayed spoofing - reapplying critical props"
  resetprop_if_diff ro.crypto.state encrypted
  resetprop_if_diff ro.build.tags release-keys
  hide_recovery_folders
) &

log "SERVICE" "Done"
