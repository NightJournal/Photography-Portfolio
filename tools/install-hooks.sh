#!/usr/bin/env bash
# Git hooks are not tracked by Git, so re-run this after a fresh clone.
cd "$(dirname "$0")/.." || exit 1
cp tools/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "Installed .git/hooks/pre-commit"
