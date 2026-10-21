#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
zig_bin="${ZIG_BIN:-zig}"
build_dir="$(mktemp -d)"
trap 'rm -rf "$build_dir"' EXIT
python3 build-playground.py
"$zig_bin" rc /c65001 /fo "$build_dir/app.res" app.rc
"$zig_bin" cc -target x86_64-windows-gnu -Os -s -municode -Wl,--subsystem,windows \
  -Wall -Wextra -Werror -Wno-unused-command-line-argument \
  launcher.c "$build_dir/app.res" -lshell32 -lole32 -luser32 -lshlwapi \
  -o ../../downloads/호리빵구.exe

python3 test_binary.py
python3 package.py
