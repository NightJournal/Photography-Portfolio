#!/usr/bin/env bash
# Wrapper so you can just run ./add-photos.sh from the repo root.
cd "$(dirname "$0")" || exit 1
exec python3 tools/add_photos.py "$@"
