#!/usr/bin/env bash
cd "$(dirname "$0")"
python3 -m http.server "${1:-8001}" --bind 0.0.0.0
