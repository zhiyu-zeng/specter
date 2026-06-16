#!/system/bin/sh
MODDIR=${0%/*}

. "$MODDIR/../lib/common.sh"
. "$MODDIR/../lib/config_env.sh"
. "$MODDIR/../lib/paths.sh"
. "$MODDIR/../lib/urls.sh"

log "HMA" "Start"

_installed_pkgs=$(pm list packages 2>/dev/null) || log "HMA" "Warning: Failed to list installed packages"

if echo "$_installed_pkgs" | grep -q "org.frknkrc44.hma_oss"; then
  _target_dir="$HMA_DIR"
  _target_file="$HMA_FILE"
  _found="HMA-OSS"
elif echo "$_installed_pkgs" | grep -q "com.tsng.hidemyapplist"; then
  _target_dir="/data/user/0/com.tsng.hidemyapplist/files"
  _target_file="$_target_dir/config.json"
  _found="HMA"
elif echo "$_installed_pkgs" | grep -q "com.google.android.hmal"; then
  _target_dir="/data/user/0/com.google.android.hmal/files"
  _target_file="$_target_dir/config.json"
  _found="HMAL"
else
  log "HMA" "No HMA variant installed, skipping"
  unset _installed_pkgs
  log "HMA" "Finish"
  exit 0
fi

log "HMA" "Found $_found"

TEMP_FILE="/data/local/tmp/.specter_hma_config"
_install_ok=0

if check_network; then
  if download "$HMA_CONFIG_URL" "$TEMP_FILE" 2>/dev/null && [ -s "$TEMP_FILE" ]; then
    _pkg=$(echo "$_target_dir" | cut -d"/" -f5)
    _uid=$(pm list packages -U 2>/dev/null | grep "^package:$_pkg uid:" | sed "s/.*uid://") || _uid=0

    # Try direct install (works on Magisk, boot, action.sh)
    mkdir -p "$_target_dir" 2>/dev/null
    if cp "$TEMP_FILE" "$_target_file" 2>/dev/null; then
      chmod 600 "$_target_file" 2>/dev/null
      chown "$_uid:$_uid" "$_target_file" 2>/dev/null
      chown "$_uid:$_uid" "$_target_dir" 2>/dev/null
      _install_ok=1
    else
      # Sandboxed (KSU/APatch WebUI) — use su to escape namespace
      su -c "mkdir -p '$_target_dir' && cp '$TEMP_FILE' '$_target_file' && chmod 600 '$_target_file' && chown $_uid:$_uid '$_target_file' && chown $_uid:$_uid '$_target_dir'" 2>/dev/null && _install_ok=1
    fi

    if [ "$_install_ok" = "1" ]; then
      log "HMA" "Config installed for $_found"
    else
      log "HMA" "Config download succeeded but install failed"
    fi
    rm -f "$TEMP_FILE"
  else
    log "HMA" "Download returned empty"
  fi
fi

unset _installed_pkgs _target_dir _target_file _found _uid _pkg _install_ok TEMP_FILE
log "HMA" "Finish"
exit 0
