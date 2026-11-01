#!/usr/bin/env bash
# Genera dist/Code.gs y dist/Index.html a partir de src/ y data/
set -e
cd "$(dirname "$0")"
python3 src/build.py
cd src
cat skeleton_head.html css.base css.extra css.extra2 skeleton_mid.html js1.js js2.js js3.js js4.js js5.js skeleton_end.html > ../dist/Index.html
cd ..
python3 - <<'P'
import re
h=open('dist/Index.html').read()
open('test/app.js','w').write(re.search(r'<script>(.*)</script>',h,re.S).group(1))
P
mkdir -p docs && cp dist/Index.html docs/index.html && touch docs/.nojekyll
node --check test/app.js && echo "Build OK"
