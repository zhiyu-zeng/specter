#!/system/bin/sh
set -e
MODDIR=${0%/*}
. "$MODDIR/../lib/common.sh"

log "PIF2" "Start"
disable_rom_spoof_engines
log "PIF2" "Finish"
exit 0
