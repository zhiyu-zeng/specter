# shellcheck shell=sh
log() {
  _l_tag="$1" _l_msg="$2"
  printf '[%s] [%s] %s\n' "$(date '+%T')" "$_l_tag" "$_l_msg"
  [ -x /system/bin/log ] && /system/bin/log -t "Specter" -p i "$_l_tag: $_l_msg" 2>/dev/null || true
  unset _l_tag _l_msg
}

die() {
  log "ERROR" "$1"
  [ -x /system/bin/log ] && /system/bin/log -t "Specter" -p f "$1" 2>/dev/null || true
  exit 1
}

log_rotate() {
  _lr_path="$1" _lr_max="${2:-262144}" _lr_keep="${3:-3}"
  [ -f "$_lr_path" ] || return 0
  _lr_size=$(stat -c%s "$_lr_path" 2>/dev/null || echo "0")
  [ "$_lr_size" -lt "$_lr_max" ] 2>/dev/null && return 0
  for _lr_i in $(seq "$_lr_keep" -1 1); do mv "${_lr_path}.$((_lr_i - 1))" "${_lr_path}.$_lr_i" 2>/dev/null || true; done
  : > "$_lr_path"
  unset _lr_path _lr_max _lr_keep _lr_size _lr_i
}
