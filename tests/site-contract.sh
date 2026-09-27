#!/usr/bin/env bash
# Static-site contract for the Compass Nexus iQ landing page.
set -euo pipefail
cd "$(dirname "$0")/.."

fail() { echo "FAIL: $1" >&2; exit 1; }

expected=(flight evFleet evGarage dashboard landmark twin process stats company usecases port cta)

# 12 sections, in order, numbered 01-12.
mapfile -t found < <(grep -o 'id="[A-Za-z]*" data-section="[0-9]*"' index.html | sed -E 's/id="([A-Za-z]+)".*/\1/')
[ "${#found[@]}" -eq 12 ] || fail "expected 12 sections, found ${#found[@]}"
for i in "${!expected[@]}"; do
  [ "${found[$i]}" = "${expected[$i]}" ] || fail "section $((i + 1)) is '${found[$i]}', expected '${expected[$i]}'"
  n=$(printf '%02d' $((i + 1)))
  grep -q "id=\"${expected[$i]}\" data-section=\"$n\"" index.html || fail "${expected[$i]} is not numbered $n"
  grep -q "href=\"#${expected[$i]}\" data-target=\"${expected[$i]}\"" index.html || fail "no rail link for ${expected[$i]}"
done

# Required hooks used by app.js.
for id in heroLayersDock sectionNavRail garageGrid garageOverride carbonSim twinMotion portNodeVessel portNodeGate; do
  grep -q "id=\"$id\"" index.html || fail "missing #$id"
done

# Flight layers in the requested order.
order=$(grep -o 'id="flight-l[1-4]"' index.html | tr -d '\n')
[ "$order" = 'id="flight-l1"id="flight-l2"id="flight-l3"id="flight-l4"' ] || fail "flight layers out of order"

# Every referenced local asset exists.
for f in $(grep -oE 'assets/[A-Za-z0-9/_.-]+\.(jpg|png|webp)' index.html styles.css | cut -d: -f2 | sort -u); do
  [ -f "$f" ] || fail "missing asset $f"
done

node --check app.js || fail "app.js has a syntax error"

echo "PASS: Compass Nexus IQ static-site contract."
