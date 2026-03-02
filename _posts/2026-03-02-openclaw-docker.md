---
layout: post
title: OpenClaw Docker化部署与优化实践
tag: codes
---

### 背景

最近在部署 OpenClaw，遇到国内网络环境的典型问题：依赖下载慢、镜像拉取失败。科学上网是第一步，但在 Docker 里配置代理有讲究。本文记录从科学上网到 Docker 代理配置、镜像优化、QQ 频道接入、memory search 模型替换的完整过程。

如果你也在国内部署 AI 应用，这些实践应该能帮到你。

### 环境

- **网络环境**：国内，需科学上网
- **VPS**：洛杉矶，1核1GB，跑代理服务
- **本地开发机**：macOS 12.4
- **Docker**：Desktop 4.22.0（Engine 24.0.5）
- **OpenClaw 版本**：v2026.02.25
- **宿主机代理**：SOCKS5，端口 1080

## 1. 科学上网配置

没有稳定代理，Docker 构建和模型下载都难搞。简单说下服务端和客户端的配置。

### 服务端部署

推荐 [233boy/v2ray](https://github.com/233boy/v2ray) 的一键安装脚本：

```bash
bash <(curl -s -L https://git.io/v2ray.sh)
```

按提示选协议、端口就行。

### 本地客户端

服务端配好后，在本地宿主机上跑客户端连代理。常用客户端：

- **Clash**：功能全，支持规则分流，跨平台
- **v2rayU** / **V2rayX**：macOS 图形客户端，简单
- **Qv2ray**：跨平台，界面友好
- **命令行 v2ray-core**：直接跑服务端的 v2ray

配好连到你服务器（通常是 socks5://服务器IP:1080）。

### 验证代理

配好后验证：

```bash
curl --socks5-hostname 127.0.0.1:1080 https://api.github.com
```

能看到 GitHub API 返回就说明通了。

## 2. Docker 代理配置

Docker 代理分两个阶段：构建镜像时（build）和容器运行时（run）。

### 2.1 Docker Daemon 镜像加速（可选）

改 `/etc/docker/daemon.json`，加国内镜像源：
```json
{
  "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"],
  "max-concurrent-downloads": 10
}
```
改完重启：`sudo systemctl restart docker`。

### 2.2 构建时代理

构建镜像时用 `--build-arg` 传代理变量：

```bash
docker build \
  --build-arg http_proxy=socks5://host.docker.internal:1080 \
  --build-arg https_proxy=socks5://host.docker.internal:1080 \
  -t openclaw:latest .
```

> **注意**：`host.docker.internal` 是 Docker 的特殊 DNS，指向宿主机。Linux 下如果不行，试试 Docker 网桥 IP `172.17.0.1`。

**别在 Dockerfile 里写死代理地址**，那样镜像就不通用了。

### 2.3 运行时代理

容器运行时也需要代理（比如下载模型、调 API）：

用 `docker run` 命令：
```bash
docker run -d \
  -e http_proxy=socks5://host.docker.internal:1080 \
  -e https_proxy=socks5://host.docker.internal:1080 \
  -e no_proxy=localhost,127.0.0.1 \
  --name openclaw \
  openclaw:latest
```

用 `docker-compose.yml`：
```yaml
version: '3.8'
services:
  openclaw:
    image: openclaw:latest
    environment:
      - http_proxy=socks5://host.docker.internal:1080
      - https_proxy=socks5://host.docker.internal:1080
      - no_proxy=localhost,127.0.0.1
```

## 3. OpenClaw 镜像构建

关键点：构建过程能走代理，容器内能调 OpenClaw 命令。

### 3.1 使用 OpenClaw 原生 Dockerfile

OpenClaw 项目自带完整的 Dockerfile，建议直接使用。从 GitHub 克隆项目后，在项目根目录构建：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

项目根目录的 `Dockerfile` 内容如下（基于官方 v2026.02.25 版本）：

```dockerfile
FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# Cache dependencies unless package metadata changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

#### 构建时配置代理
国内网络环境下，构建时需要配置代理。通过 `--build-arg` 传递代理变量：

```bash
docker build \
  --build-arg http_proxy=socks5://host.docker.internal:1080 \
  --build-arg https_proxy=socks5://host.docker.internal:1080 \
  -t openclaw:latest .
```

如果需要在 Dockerfile 中固化代理（不推荐，会降低镜像通用性），可以在 `RUN pnpm install` 前添加：
```dockerfile
ARG http_proxy
ARG https_proxy
ENV http_proxy=${http_proxy}
ENV https_proxy=${https_proxy}
# ... pnpm install 等命令
# 构建完成后可清理
ENV http_proxy=
ENV https_proxy=
```

### 3.2 使用 Docker Compose 管理 OpenClaw

OpenClaw 项目提供了完整的 Docker Compose 配置，推荐使用它来管理服务。项目根目录的 `docker-compose.yml` 定义了两个服务：

1. **openclaw-gateway**：主网关服务，运行 `node dist/index.js`
2. **openclaw-cli**：命令行工具容器，用于执行管理命令

#### 启动服务
```bash
# 构建并启动网关（后台运行）
docker compose up -d openclaw-gateway

# 查看日志
docker compose logs -f openclaw-gateway
```

#### 执行管理命令
通过 `openclaw-cli` 容器执行命令，例如查看状态：
```bash
docker compose run --rm openclaw-cli status
```

其他常用命令：
```bash
# 查看配置
docker compose run --rm openclaw-cli config show

# 管理通道
docker compose run --rm openclaw-cli channels list

# 设备配对
docker compose run --rm openclaw-cli devices list
```

#### 容器内代理配置
如果容器内需要访问外部 API（如模型下载），在 `docker-compose.yml` 中配置环境变量：

```yaml
version: '3.8'
services:
  openclaw-gateway:
    build: .
    environment:
      - http_proxy=socks5://host.docker.internal:1080
      - https_proxy=socks5://host.docker.internal:1080
      - no_proxy=localhost,127.0.0.1
    ports:
      - "3000:3000"
    volumes:
      - ./data:/home/node/.openclaw
      
  openclaw-cli:
    build: .
    environment:
      - http_proxy=socks5://host.docker.internal:1080
      - https_proxy=socks5://host.docker.internal:1080
      - no_proxy=localhost,127.0.0.1
    volumes:
      - ./data:/home/node/.openclaw
    command: ["node", "dist/index.js"]  # 会被具体命令覆盖
```

这样，无论是网关服务还是 CLI 命令，都能通过代理访问外部网络。

## 4. 接入 QQ 频道

OpenClaw 通过 `china/qqbot` 插件支持 QQ 频道。配置主要包括插件安装、OpenClaw 配置以及网络暴露。

### 4.1 安装 QQ 频道插件

首先，确保在 OpenClaw 项目中安装了 `@openclaw-china/qqbot` 插件。通常，这已在项目依赖中，若未安装，可通过以下方式添加：

```bash
npm install @openclaw-china/qqbot
```

### 4.2 配置 OpenClaw

在 OpenClaw 的配置文件 `openclaw.json` 中启用并配置 QQ 插件。你需要提前在 QQ 开放平台创建机器人并获取 `appId` 与 `token`。

```json
{
  "plugins": {
    "qqbot": {
      "enabled": true,
      "appId": "你的appid",
      "token": "你的token",
      "intents": 33281,
      "sandbox": false
    }
  }
}
```

## 5. 优化 Memory Search 模型

OpenClaw 默认的 memory search 用本地 embedding 模型，中文理解一般。换成阿里百炼的 [Qwen embedding 模型](https://help.aliyun.com/zh/model-studio/getting-started/models) 效果好很多，还有免费额度。

### 5.1 为啥选 Qwen Embedding

1.  **中文理解强**：比通用开源模型好
2.  **支持长文本**：最大 8192 tokens
3.  **免费额度**：个人用足够

### 5.2 获取阿里云百炼 API 密钥

1.  登录 [阿里云百炼控制台](https://bailian.aliyun.com)。
2.  完成实名认证，开通百炼服务。
3.  在 **“模型广场”** 或 **“我的模型”** 页面，找到并开通 **“文本向量化（Embedding）”** 服务。当前推荐的模型是 **`text-embedding-v3`**。
4.  进入 **“API密钥管理”**，创建一个新的 API 密钥。密钥格式通常为 `sk-` 开头。

### 5.3 配置 OpenClaw 使用 Qwen Embedding

阿里百炼的 Embedding API 兼容 OpenAI 格式，修改 OpenClaw 配置文件 `openclaw.json` 中的 `agents.defaults.memorySearch` 部分：

1.  **定位配置文件**：配置文件通常位于 `~/.openclaw/openclaw.json` 或项目内的 `openclaw.json`。
2.  **修改配置**：找到 `agents.defaults.memorySearch` 对象，配置如下：

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "provider": "openai",
        "remote": {
          "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
          "apiKey": "sk-你的阿里百炼API_KEY"
        },
        "model": "text-embedding-v3",
        "fallback": "none"
      }
    }
  }
}
```

> **配置说明**：
> - `baseUrl`（注意是小写 L）：必须设置为 `https://dashscope.aliyuncs.com/compatible-mode/v1`，这是阿里百炼提供的 OpenAI 兼容端点
> - `apiKey`：你的阿里百炼 API 密钥
> - `model`：阿里百炼的 Embedding 模型名称，如 `text-embedding-v3` 或 `text-embedding-v4`
> - `fallback`：设为 `"none"` 表示不使用本地回退

如果配置中没有 `memorySearch` 部分，可以手动添加在 `agents.defaults` 下。

### 5.4 验证配置与效果

1.  **重启 OpenClaw 服务**：修改配置后，重启 OpenClaw 使配置生效。
2.  **测试 Embedding API**：可以通过 `curl` 命令直接测试百炼的 Embedding 服务是否连通（将 `$API_KEY` 替换为你的密钥）：
    ```bash
    curl https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "model": "text-embedding-v3",
        "input": "测试文本"
      }'
    ```
3.  **执行记忆搜索**：在 OpenClaw 容器内，使用项目提供的记忆搜索命令进行测试：
    
    **如果使用 Docker Compose**：
    ```bash
    docker compose run --rm openclaw-cli npm run memory-search -- "测试搜索"
    ```
    
    **如果直接运行容器**：
    ```bash
    npm run memory-search -- "测试搜索"
    # 或根据项目实际命令，可能是：
    # node scripts/memory-search.js "测试搜索"
    ```
    
    观察返回结果的准确性和相关性是否有所提升。

### 5.5 性能、缓存与成本

-   **网络延迟**：首次请求 embedding 会调用远程 API，产生网络延迟（通常几百毫秒）。后续对相同内容的请求会命中本地缓存，速度极快。
-   **本地缓存**：OpenClaw 会对计算过的 embedding 向量进行本地缓存，避免重复计算和调用。
-   **免费额度**：阿里百炼为新用户提供一定量的免费调用额度，对于个人开发或测试完全足够。可在控制台的 **“用量统计”** 中查看剩余额度。

## 实践要点

1.  **代理是基础**：宿主机代理是前提，Docker 构建与运行时分阶段配置，注意使用 `socks5://host.docker.internal` 地址。
2.  **命令调用方式**：使用 Docker Compose，通过 `docker compose run --rm openclaw-cli <command>` 执行管理命令，而非直接调用 npm scripts。
3.  **插件配置**：接入 QQ 频道需安装并配置 `@openclaw-china/qqbot` 插件。
4.  **模型替换**：利用阿里百炼等兼容 OpenAI API 的平台，可以便捷地替换 embedding 模型以提升中文搜索效果。注意在 `agents.defaults.memorySearch.remote` 中正确设置 `baseUrl`（小写 L）和 `apiKey`。

## 结语

以上便是近期在 Docker 中部署和优化 OpenClaw 的完整流程。国内网络环境下的容器化部署确实存在一些特有的挑战，但逐一解决后，其带来的环境一致性和便携性优势是显著的。

或许后续可以探讨 OpenClaw 的插件开发机制，或是使用 Docker Compose 编排多个关联的 AI 服务。

---

*2026年3月，上海。是为重启博客后的首篇技术记录。*

**（文中涉及的配置脚本与文件，后续将整理至 GitHub 仓库）**