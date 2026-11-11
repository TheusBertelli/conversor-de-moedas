#!/usr/bin/env bash
set -eu

cd "$(dirname "$0")/.."
export npm_config_cache=/tmp/npm-cache
export EXPO_NO_TELEMETRY=1
export __UNSAFE_EXPO_HOME_DIRECTORY=/tmp/expo-home

npm ci
npm run check
