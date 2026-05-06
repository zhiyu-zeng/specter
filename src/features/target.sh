#!/system/bin/sh
set -e
MODDIR=${0%/*}
. "$MODDIR/../lib/common.sh"
. "$MODDIR/../lib/paths.sh"
. "$MODDIR/../lib/package_list.sh"

log "TARGET" "Start"

[ -d "$TRICKY_DIR" ] || die "Tricky Store data directory not found"

if [ -d "/data/adb/modules/TA_utl" ] || [ -d "/data/adb/modules/.TA_utl" ]; then
  log "TARGET" "Tricky Addon detected, suspending target generation"
  exit 0
fi

_author=$(grep 'author=' /data/adb/modules/tricky_store/module.prop 2>/dev/null | head -1 | cut -d= -f2 | tr '[:upper:]' '[:lower:]')
case "$_author" in
  *jingmatrix*)
    log "TARGET" "TEESimulator detected — locked.xml section"
    _customize="/sdcard/Specter/customize.txt"
    if [ -f "$_customize" ] && [ "$(head -1 "$_customize" 2>/dev/null)" != "#disable" ]; then
      _locked=$(grep -v '^#' "$_customize" | sed 's/[!?]$//' 2>/dev/null || echo "")
      if [ -n "$_locked" ]; then
        [ -f "$TARGET_TXT" ] && cp "$TARGET_TXT" "${TARGET_TXT}.bak"
        _tmp=$(mktemp 2>/dev/null || echo "/data/local/tmp/.specter_tee_$$")
        : > "$_tmp"
        if [ -f "$TARGET_TXT" ] && [ -s "$TARGET_TXT" ]; then
          while IFS= read -r _line || [ -n "$_line" ]; do
            [ -z "$_line" ] && continue
            [ "${_line#\[}" != "$_line" ] && continue
            _skip=false
            for _e in $_locked; do
              case "$_line" in "$_e"|"$_e!"|"$_e?") _skip=true; break ;; esac
            done
            [ "$_skip" = "false" ] && echo "$_line" >> "$_tmp"
          done < "$TARGET_TXT"
        fi
        echo "[locked.xml]" >> "$_tmp"
        for _e in $_locked; do echo "$_e" >> "$_tmp"; done
        mv -f "$_tmp" "$TARGET_TXT"
        rm -f "$_tmp"
        log "TARGET" "Preserved existing entries, appended [locked.xml] section"
        unset _tmp _e _skip _line
      fi
      unset _locked
    fi
    unset _author _customize
    log "TARGET" "Finish (TEESimulator)"
    exit 0
    ;;
esac
unset _author

_count=0
MODULE_ROOT="${MODDIR%/features}"
TEMP_PKGS="$MODULE_ROOT/pkgs.txt"
_TMP_TARGET="${TARGET_TXT}.new.$$"
trap 'rm -f "$TEMP_PKGS" "${TEMP_PKGS}.filtered" "$_TMP_TARGET"' EXIT

teeBroken="false"
[ -f "$TEE_STATUS" ] && teeBroken=$(grep -E '^teeBroken=' "$TEE_STATUS" | cut -d '=' -f2 2>/dev/null || echo "false")
log "TARGET" "TEE status: teeBroken=$teeBroken"

BLACKLIST="$SPECTER_DIR/blacklist.txt"
if [ ! -f "$BLACKLIST" ]; then
  log "TARGET" "Creating default blacklist from DETECTOR_APPS"
  ensure_dir "$SPECTER_DIR"
  {
    for _pkg in $DETECTOR_APPS $BLACKLIST_EXTRA; do
      echo "$_pkg"
    done
  } > "$BLACKLIST"
  log "TARGET" "Default blacklist created"
fi

_customize="/sdcard/Specter/customize.txt"
_customize_mode=""
if [ -f "$_customize" ]; then
  _first=$(head -1 "$_customize" 2>/dev/null || echo "")
  case "$_first" in
    "!") _customize_mode="force_all" ;;
    "?") _customize_mode="condition_all" ;;
    "#disable") _customize_mode="disabled" ;;
    *) _customize_mode="selective" ;;
  esac
  log "TARGET" "customize.txt mode: $_customize_mode"
fi

for entry in $FIXED_TARGETS; do
  echo "$entry" >> "$_TMP_TARGET"
  _count=$((_count + 1))
done

for flag in "-3" "-s"; do
  pkgs=$(pm list packages "$flag" 2>/dev/null) || {
    log "TARGET" "Warning: Failed to list packages (flag $flag)"
    continue
  }
  [ -z "$pkgs" ] && continue
  echo "$pkgs" | cut -d ":" -f 2 > "$TEMP_PKGS"
  if [ -f "$SPECTER_DIR/blacklist_enabled" ] && [ -s "$BLACKLIST" ]; then
    if grep -Fvxf "$BLACKLIST" "$TEMP_PKGS" > "${TEMP_PKGS}.filtered" 2>/dev/null; then
      mv "${TEMP_PKGS}.filtered" "$TEMP_PKGS"
    else
      log "TARGET" "Warning: Blacklist filtering failed"
    fi
  fi

  while read -r pkg; do
    [ -z "$pkg" ] && continue
    _suffix="" _custom_matched=false
    if [ "$_customize_mode" = "selective" ]; then
      _match=$(grep -E "^${pkg}[!?]?$" "$_customize" 2>/dev/null | head -1)
      if [ -n "$_match" ]; then
        _custom_matched=true
        case "$_match" in
          *!) _suffix="!" ;;
          *\?)
            if [ "$teeBroken" = "true" ]; then
              _suffix=""
            else
              _suffix="?"
            fi
            ;;
          *) _suffix="" ;;
        esac
      fi
    fi
    if [ "$_customize_mode" = "force_all" ]; then
      _suffix="!"
    elif [ "$_customize_mode" = "condition_all" ]; then
      _suffix="?"
    fi
    if [ -z "$_suffix" ] && [ "$_custom_matched" != "true" ]; then
      [ "$teeBroken" = "true" ] && _suffix="?"
    fi
    echo "${pkg}${_suffix}" >> "$_TMP_TARGET"
    _count=$((_count + 1))
  done < "$TEMP_PKGS"
  rm -f "$TEMP_PKGS" "${TEMP_PKGS}.filtered"
done

sort -u "$_TMP_TARGET" -o "$_TMP_TARGET"

rm -f "${TARGET_TXT}.bak"
[ -f "$TARGET_TXT" ] && cp "$TARGET_TXT" "${TARGET_TXT}.bak"
mv -f "$_TMP_TARGET" "$TARGET_TXT"

_count=$(wc -l < "$TARGET_TXT")
log "TARGET" "Wrote $_count entries to target.txt"
log "TARGET" "Finish"
exit 0
