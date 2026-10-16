#!/bin/bash
# Package an app built on this Mac. Does not read or copy account data.
set -euo pipefail

cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'This script must run on macOS, after pnpm bundle.' >&2
  exit 1
fi

package_label="${1:-}"
expected_arch="${2:-}"
case "$package_label:$expected_arch" in
  mac-arm64:arm64|mac-x64:x86_64) ;;
  *) echo 'Usage: bash scripts/package_macos.sh mac-arm64 arm64 (or mac-x64 x86_64)' >&2; exit 1 ;;
esac

app='src-tauri/target/release/bundle/macos/DUO Killer.app'
plist="$app/Contents/Info.plist"
[[ -f "$plist" ]] || { echo "Application missing: $app" >&2; exit 1; }
executable="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$plist")"
main_binary="$app/Contents/MacOS/$executable"
worker_binary="$app/Contents/Resources/worker/duo-killer-worker"
for binary in "$main_binary" "$worker_binary"; do
  [[ -x "$binary" ]] || { echo "Executable missing: $binary" >&2; exit 1; }
  lipo -verify_arch "$expected_arch" "$binary"
done
# Run the worker from the final app, not just the intermediate build folder.
python3 scripts/smoke_worker.py "$worker_binary"

output="artifacts/macos/$package_label"
mkdir -p "$output"
archive="DUO-Killer-$package_label.app.zip"
ditto -c -k --sequesterRsrc --keepParent "$app" "$output/$archive"

image_stage="$(mktemp -d "${TMPDIR:-/tmp}/duo-macos-package.XXXXXX")"
trap 'rm -rf -- "$image_stage"' EXIT
ditto "$app" "$image_stage/DUO Killer.app"
ln -s /Applications "$image_stage/Applications"
hdiutil create -volname 'DUO Killer' -srcfolder "$image_stage" \
  -format UDZO -ov "$output/DUO-Killer-$package_label.dmg"

cat > "$output/安装说明.txt" <<'EOF'
DUO Killer · macOS

mac-arm64 适用于 Apple 芯片（M 系列）；mac-x64 适用于 Intel。
打开 DMG，把 DUO Killer.app 拖入 Applications（应用程序）。
也可以解压 app.zip，把其中的 DUO Killer.app 拖入应用程序。
应用内置 Python，无需安装开发工具；登录需要 Chrome 或 Edge。
本包不含 Windows 本机的账号、地址、Cookie 或付款数据，需要重新登录并配置。

本构建没有 Apple Developer 发行签名或公证。
若提示无法验证开发者，核对来源后可按 Apple 官方说明操作：
https://support.apple.com/zh-cn/102445
EOF

(
  cd "$output"
  shasum -a 256 "$archive" "DUO-Killer-$package_label.dmg" > SHA256SUMS.txt
)
echo "macOS application packages: $output"
