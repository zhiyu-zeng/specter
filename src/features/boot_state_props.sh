#!/system/bin/sh
MODDIR=${0%/*}

. "$MODDIR/../lib/common.sh"
. "$MODDIR/../lib/config_env.sh"

[ "$(cfg_get toggle_prop_handler 1)" = "0" ] && exit 0

PROP_FILE="/data/property/persistent_properties"
[ -f "$PROP_FILE" ] || { log "PROPS" "persistent_properties not found"; exit 0; }

if ! strings "$PROP_FILE" 2>/dev/null | grep -qiE "lsposed|hyperceiler|luckytool"; then
  log "PROPS" "No suspicious props found"
  exit 0
fi

log "PROPS" "Suspicious props detected, cleaning..."

cp "$PROP_FILE" "$PROP_FILE.bak" 2>/dev/null || true

strings "$PROP_FILE" 2>/dev/null | grep -iE "lsposed|hyperceiler|luckytool" | while read -r _prop; do
  resetprop -p --delete "$_prop" 2>/dev/null || true
  log "PROPS" "Deleted: $_prop"
done

unset _prop
log "PROPS" "Done"
