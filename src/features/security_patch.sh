#!/system/bin/sh
set -e
MODDIR=${0%/*}
. "$MODDIR/../lib/common.sh"
. "$MODDIR/../lib/paths.sh"

log "SECURITY_PATCH" "Start"

current_year=$(date +%Y 2>/dev/null) || current_year=$(getprop ro.build.version.release 2>/dev/null | cut -d. -f1) || current_year="2026"
current_month=$(date +%m 2>/dev/null) || current_month="01"
current_day=$(date +%d 2>/dev/null) || current_day="05"

if [ "$current_day" -lt 5 ]; then
  if [ "$current_month" -eq 1 ]; then
    target_month=12
    target_year=$((current_year - 1))
  else
    target_month=$((current_month - 1))
    target_year=$current_year
  fi
else
  target_month=$current_month
  target_year=$current_year
fi

formatted_month=$(printf "%02d" "$target_month")
patch_date="${target_year}-${formatted_month}-05"

log "SECURITY_PATCH" "Writing $patch_date to $SECURITY_PATCH_FILE"

cat > "$SECURITY_PATCH_FILE" <<EOF || die "Failed to write $SECURITY_PATCH_FILE"
system=prop
boot=$patch_date
vendor=$patch_date
EOF
log "SECURITY_PATCH" "Patch date written to $SECURITY_PATCH_FILE"

log "SECURITY_PATCH" "Finish"
exit 0
