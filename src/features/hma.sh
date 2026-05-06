#!/system/bin/sh
set -e
MODDIR=${0%/*}
. "$MODDIR/../lib/common.sh"
. "$MODDIR/../lib/paths.sh"
. "$MODDIR/../lib/urls.sh"

log "HMA" "Start"

_installed_pkgs=$(pm list packages 2>/dev/null) || log "HMA" "Warning: Failed to list installed packages"

_injected=false

if echo "$_installed_pkgs" | grep -q "org.frknkrc44.hma_oss"; then
  _target_dir="/data/user/0/org.frknkrc44.hma_oss/files"
  _target_file="$_target_dir/config.json"
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

if check_network; then
  ensure_dir "$_target_dir"
  _downloaded=$(download "$HMA_CONFIG_URL" 2>/dev/null)
  if [ -n "$_downloaded" ]; then
    printf '%s' "$_downloaded" > "$_target_file" 2>/dev/null && log "HMA" "Config downloaded and written to $_found"
    chmod 600 "$_target_file" 2>/dev/null
    _uid=$(stat -c "%u" "$_target_dir" 2>/dev/null) || _uid=0
    chown "$_uid:$_uid" "$_target_file" 2>/dev/null
    _injected=true
  fi
  [ "$_injected" != "true" ] && log "HMA" "Download failed, using built-in template"
fi

if [ "$_injected" != "true" ]; then
  log "HMA" "Writing built-in template"
  ensure_dir "$_target_dir"
  cat > "$_target_file" <<'TEMPLATE'
{"configVersion":93,"templateName":"Specter Blacklist","blacklist":["com.topjohnwu.magisk","com.topjohnwu.magisk.detector","io.github.vvb2060.mahoshojo","io.github.vvb2060.keyattestation","icu.nullptr.nativetest","icu.nullptr.applistdetector","com.scottyab.rootbeer","com.scottyab.rootbeer.sample","com.kimchangyoun.rootbeerfresh","com.kimchangyoun.magiskdetector","com.zhenxi.hunter","com.byxiaorun.detector","com.jrummyapps.rootchecker","com.devadvance.rootcloak","com.devadvance.rootcloakplus","com.reveny.nativechecker","com.reveny.environmentchecker","com.reveny.rootchecker"],"whitelist":[]}
TEMPLATE
  chmod 600 "$_target_file" 2>/dev/null
  _uid=$(stat -c "%u" "$_target_dir" 2>/dev/null) || _uid=0
  chown "$_uid:$_uid" "$_target_file" 2>/dev/null
  log "HMA" "Built-in template written"
fi

unset _installed_pkgs _target_dir _target_file _found _injected _uid _downloaded
log "HMA" "Finish"
exit 0
