#!/usr/bin/env bash
# Specter shell script benchmark suite
# Measures execution time of key scripts in a mock environment.
# Usage: bash tests/bench.sh [--ci] [runs=3]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNS="${2:-3}"
CI_MODE=false
[ "${1:-}" = "--ci" ] && CI_MODE=true

cd "$REPO_ROOT"

. tests/mock_env.sh
. tests/helpers.sh 2>/dev/null || true

declare -a BENCHMARKS=(
  "lib/util.sh:version_ge"
  "lib/props.sh:sp_try"
  "lib/detect.sh:detect_root_solution"
  "lib/desc.sh:compute_description"
  "lib/keybox.sh:decode_keybox"
  "lib/conflicts.sh:_conflict_detect"
  "lib/network.sh:download"
)

plan "${#BENCHMARKS[@]}"

for bench in "${BENCHMARKS[@]}"; do
  _file="${bench%%:*}"
  _fn="${bench##*:}"
  _full="$REPO_ROOT/src/$_file"
  _times=""
  _ok=0

  for _run in $(seq 1 "$RUNS"); do
    { _start=$(date +%s%N 2>/dev/null || echo 0)
      # Source the library and call the function
      . "$_full" 2>/dev/null
      "$_fn" 2>/dev/null || true
      _end=$(date +%s%N 2>/dev/null || echo 0)
    } 2>/dev/null || true

    if [ "$_start" -gt 0 ] && [ "$_end" -gt 0 ]; then
      _elapsed=$(( (_end - _start) / 1000000 ))
      _times="$_times $_elapsed"
      [ "$_elapsed" -lt 500 ] && _ok=$((_ok + 1))
    fi
  done

  # Compute median
  _sorted=$(echo "$_times" | tr ' ' '\n' | sort -n | grep -v '^$')
  _count=$(echo "$_sorted" | wc -l)
  _median=$(echo "$_sorted" | sed -n "$(( (_count + 1) / 2 ))p")
  _avg=$(echo "$_sorted" | awk '{s+=$1} END {printf "%.0f", s/NR}')

  if [ "$_ok" -eq "$RUNS" ]; then
    ok "$_file:$_fn — median ${_median}ms, avg ${_avg}ms (${RUNS} runs)"
  else
    fail "$_file:$_fn — median ${_median}ms, avg ${_avg}ms (${RUNS} runs, $_ok/${RUNS} under 500ms)"
  fi

  unset _file _fn _full _times _ok _run _start _end _elapsed _sorted _count _median _avg
done

# Module-level benchmarks (how long does a dry-run pipeline take?)
bench_dry_run() {
  local _start _end _elapsed
  _start=$(date +%s%N 2>/dev/null || echo 0)
  
  # Simulate action pipeline: source common, iterate features
  . "$REPO_ROOT/src/lib/common.sh" 2>/dev/null || true
  for _f in "$REPO_ROOT/src/features/"*.sh; do
    _name="${_f##*/}"
    . "$_f" 2>/dev/null || true
  done
  
  _end=$(date +%s%N 2>/dev/null || echo 0)
  if [ "$_start" -gt 0 ] && [ "$_end" -gt 0 ]; then
    _elapsed=$(( (_end - _start) / 1000000 ))
    echo "$_elapsed"
  else
    echo "0"
  fi
}

echo "---"
echo "Module load benchmark:"
_dry=$(bench_dry_run)
echo "  Feature library load: ${_dry}ms"
if [ "$_dry" -gt 0 ] && [ "$_dry" -lt 1000 ]; then
  echo "  [PASS] under 1s"
else
  echo "  [WARN] over 1s (${_dry}ms)"
fi

echo ""
echo "Summary: $(cat /tmp/specter_test_results 2>/dev/null || echo "no failures")"
exit 0
