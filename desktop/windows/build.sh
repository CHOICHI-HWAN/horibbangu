#!/usr/bin/env bash
set -euo pipefail
export PYTHONUTF8=1
cd "$(dirname "$0")"
python3 build-playground.py
if [[ "${1:-}" == "--standalone" ]]; then
  python3 build-electron.py
  python3 test_binary.py
  python3 package.py --standalone
else
  python3 native/build.py
  python3 native/package.py
fi
