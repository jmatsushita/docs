#!/usr/bin/env bash

declare -a pkgs=(
  "@vlcn.io/react:3.0.2"
  "@vlcn.io/sync-p2p:0.13.1"
  "@vlcn.io/direct-connect-browser:0.5.1"
  "@vlcn.io/crsqlite-wasm:0.15.1"
  "@vlcn.io/create:0.0.5"
  "@vlcn.io/crsqlite-allinone:0.14.1"
  "@vlcn.io/direct-connect-common:0.6.1"
  "@vlcn.io/direct-connect-nodejs:0.6.1"
  "@vlcn.io/ws-common:0.1.1"
  "@vlcn.io/xplat-api:0.14.1"
  "@vlcn.io/rx-tbl:0.14.1"
  "@vlcn.io/ws-browserdb:0.1.1"
  "@vlcn.io/typed-sql:0.2.13"
  "@vlcn.io/wa-sqlite:0.21.0"
  "@vlcn.io/ws-server:0.1.1"
  "@vlcn.io/ws-litefs:0.1.1"
  "@vlcn.io/ws-client:0.1.1"
  "@vlcn.io/typed-sql-cli:0.2.13"
)

# pkgs=("$@")

update_file() {
  local file=$1
  local name=$2
  local version=$3
  awk -v name="$name" -v version="$version" '{gsub(name "@[^[:space:]]+", name "@" version); print}' "$file" > tmp && mv tmp "$file"
}

for pkg in "${pkgs[@]}"; do
  echo "Updating $pkg"
  
  IFS=':' read -r NAME VERSION <<< "$pkg"
  
  PACKAGE_EXISTS=$(jq -r --arg name "$NAME" '.dependencies | has($name)' package.json)

  # If package exists, update version
  if [ "$PACKAGE_EXISTS" = "true" ]; then
    # replace in package.json only if there is an entry for that package in the package.json
    jq --arg name "$NAME" --arg version "$VERSION" '.dependencies[$name] = $version' package.json > tmp.json && mv tmp.json package.json
  fi

  find ./pages -name '*.mdx' -exec bash -c '
      update_file() {
        local file=$1
        local name=$2
        local version=$3
        awk -v name="$name" -v version="$version" "{gsub(name \"@[0-9a-z.\-]+\", name \"@\" version); print}" "$file" > tmp && mv tmp "$file"
      }
      update_file "$0" "$1" "$2"
    ' {} "$NAME" "$VERSION" \;

done
