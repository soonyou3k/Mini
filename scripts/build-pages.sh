#!/usr/bin/env bash
# GitHub Pages용 사이트를 _site/에 만든다.
#   /          → 난세무쌍 (action/, 홈 화면 앱)
#   /classic/  → 난세영웅전 (턴제)
set -euo pipefail
cd "$(dirname "$0")/.."
BUILD="${1:-$(git rev-parse --short HEAD 2>/dev/null || date +%s)}"

rm -rf _site
mkdir -p _site/classic
cp -r action/. _site/
cp -r index.html style.css js _site/classic/

# 소스 HTML은 문서 앞부분 없이 작성되어 있으므로 표준 모드용 머리말을 붙인다
for f in _site/index.html _site/classic/index.html; do
  { printf '<!doctype html>\n<html lang="ko">\n<meta charset="utf-8">\n'; cat "$f"; printf '\n</html>\n'; } > "$f.tmp"
  mv "$f.tmp" "$f"
done

# 배포할 때마다 서비스 워커 캐시 이름을 바꿔 새 버전을 받게 한다
sed -i "s/const BUILD = 'dev';/const BUILD = '${BUILD}';/" _site/sw.js
touch _site/.nojekyll
echo "built _site (build ${BUILD})"
