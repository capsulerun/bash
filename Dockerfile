FROM debian:trixie-slim
ENV DEBIAN_FRONTEND=noninteractive \
    GLAMA_VERSION="1.0.0" \
    PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl git && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && apt-get install -y --no-install-recommends nodejs && npm install -g mcp-proxy@6.4.3 pnpm@10.14.0 && node --version && curl -LsSf https://astral.sh/uv/install.sh | UV_INSTALL_DIR="/usr/local/bin" sh && uv python install 3.14 --default --preview && ln -s $(uv python find) /usr/local/bin/python && python --version && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
WORKDIR /app
RUN git clone https://github.com/capsulerun/bash . && git checkout docker-playground
RUN pnpm install && pnpm --filter @capsule-run/bash-types build && (pnpm --filter @capsule-run/bash-wasm build) && pnpm --filter @capsule-run/bash build && pnpm --filter @capsule-run/bash-mcp build
WORKDIR /app/packages/bash-mcp
CMD ["mcp-proxy","--","node","dist/index.js"]
