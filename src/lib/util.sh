# shellcheck shell=sh
ensure_dir() { mkdir -p "$1" 2>/dev/null; }

_escape_json() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

version_ge() {
  _v_a="$1" _v_b="$2"
  _v_saved_ifs="$IFS"; IFS='.'; set -- $_v_a; _v_a1=${1:-0} _v_a2=${2:-0} _v_a3=${3:-0}
  set -- $_v_b; _v_b1=${1:-0} _v_b2=${2:-0} _v_b3=${3:-0}
  IFS="$_v_saved_ifs"
  [ "$_v_a1" -gt "$_v_b1" ] && unset _v_a _v_b _v_saved_ifs _v_a1 _v_a2 _v_a3 _v_b1 _v_b2 _v_b3 && return 0
  [ "$_v_a1" -lt "$_v_b1" ] && unset _v_a _v_b _v_saved_ifs _v_a1 _v_a2 _v_a3 _v_b1 _v_b2 _v_b3 && return 1
  [ "$_v_a2" -gt "$_v_b2" ] && unset _v_a _v_b _v_saved_ifs _v_a1 _v_a2 _v_a3 _v_b1 _v_b2 _v_b3 && return 0
  [ "$_v_a2" -lt "$_v_b2" ] && unset _v_a _v_b _v_saved_ifs _v_a1 _v_a2 _v_a3 _v_b1 _v_b2 _v_b3 && return 1
  [ "$_v_a3" -ge "$_v_b3" ] && unset _v_a _v_b _v_saved_ifs _v_a1 _v_a2 _v_a3 _v_b1 _v_b2 _v_b3 && return 0
  unset _v_a _v_b _v_saved_ifs _v_a1 _v_a2 _v_a3 _v_b1 _v_b2 _v_b3
  return 1
}

run_device_info() {
  for _rdi_root in "$@"; do
    [ -n "$_rdi_root" ] || continue
    [ -f "$_rdi_root/webroot/common/device-info.sh" ] && sh "$_rdi_root/webroot/common/device-info.sh" && return 0
  done
  return 1
}
