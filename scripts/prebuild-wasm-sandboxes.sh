pnpm install

pip install -r packages/bash-wasm/sandboxes/python/requirements.txt

capsule build packages/bash-wasm/sandboxes/js/sandbox.ts --export
mkdir -p packages/bash-wasm/dist/sandboxes/js
mv packages/bash-wasm/sandboxes/js/sandbox.wasm packages/bash-wasm/dist/sandboxes/js/sandbox.wasm

capsule build packages/bash-wasm/sandboxes/python/sandbox.py --export
mkdir -p packages/bash-wasm/dist/sandboxes/python
mv packages/bash-wasm/sandboxes/python/sandbox.wasm packages/bash-wasm/dist/sandboxes/python/sandbox.wasm
