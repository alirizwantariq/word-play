#!/bin/zsh
# Capture a device screenshot cleanly (avoids adb's multi-display warning
# contaminating stdout). Usage: tools/shot.sh out.png
set -e
ADB=~/Library/Android/sdk/platform-tools/adb
OUT=${1:-/tmp/shot.png}
$ADB shell screencap -p /sdcard/_shot.png >/dev/null
$ADB pull /sdcard/_shot.png "$OUT" >/dev/null
echo "saved $OUT"
