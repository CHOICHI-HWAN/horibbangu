#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 build-playground.py
python3 build-electron.py
python3 test_binary.py
python3 package.py
