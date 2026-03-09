---
layout: post
title: OpenClaw 最佳实践 v1.0
tag: codes
---

### 背景

OpenClaw 作为开源的 AI agent 框架，部署和配置方式直接影响使用体验。本文基于最新实践，提供一套完整的国内云服务器部署方案，涵盖 Clash for Linux 全局代理、Docker 容器化部署、多 agent 架构等核心内容。

本方案适用于希望在生产环境中稳定运行 OpenClaw 的开发者，特别针对国内网络环境进行了优化。

### 环境准备

- **云服务器**：国内可访问的海外 VPS（推荐洛杉矶/新加坡节点）
- **操作系统**：Ubuntu 22.04 LTS
- **内存要求**：至少 2GB（推荐 4GB+）
- **OpenClaw 版本**：v2026.03.3+

## 完整部署工作流

为便于实际操作，以下是完整的从零开始部署工作流：

```bash
# 1. 服务器初始化
sudo apt update && sudo apt upgrade -y
sudo apt install git curl wget -y

# 2. 安装 Clash for Linux
git clone --branch master --depth 1 https://gh-proxy.org/https://github.com/nelvko/clash-for-linux-install.git \
  && cd clash-for-linux-install \
  && bash install.sh

# 3. 配置代理（编辑 ~/clashctl/config.yaml）
#    添加你的 Shadowsocks/V2Ray 代理配置

# 4. 启动基础代理并测试
clashon
curl -x http://127.0.0.1:7890 https://api.github.com

# 5. 克隆 OpenClaw 并部署
cd ~
git clone https://github.com/openclaw/openclaw.git
cd openclaw
./docker-setup.sh --workspace /home/node/.openclaw/workspace-mini-d-noneface

# 6. 配置 TUN 全局代理
clashtun on

# 7. 配置容器端口排除（编辑 Mixin 配置）
clashmixin -e
# 添加 exclude-src-port 配置

# 8. 重启 Clash 服务
clashoff && clashon

# 9. 启动 OpenClaw 服务
docker compose up -d openclaw-gateway

# 10. 验证服务状态
docker compose logs -f openclaw-gateway
```

## 1. Clash for Linux 一键安装与配置

使用 [nelvko/clash-for-linux-install](https://github.com/nelvko/clash-for-linux-install) 项目提供的自动化脚本，简化 Clash 部署过程。

### 1.1 一键安装 Clash 与本地配置

```bash
# 执行一键安装命令
git clone --branch master --depth 1 https://gh-proxy.org/https://github.com/nelvko/clash-for-linux-install.git \
  && cd clash-for-linux-install \
  && bash install.sh
```

该脚本会自动：
- 检测系统架构和初始化系统
- 下载匹配的 Mihomo 内核
- 生成系统服务配置
- 安装必要的依赖（如 yq）

**本地配置文件路径**：安装完成后，配置文件位于 `~/clashctl/config.yaml`

你可以直接编辑此文件，配置自己搭建的 Shadowsocks 代理。例如：

```yaml
mixed-port: 7890
tun:
  enable: false  # 初始安装时 TUN 默认关闭
dns:
  enable: true
  listen: 0.0.0.0:53
  enhanced-mode: fake-ip
  nameserver:
    - 223.5.5.5
    - 114.114.114.114
proxies:
  - name: "my-ss-server"
    type: ss
    server: your-ss-server-ip
    port: your-ss-port
    cipher: aes-256-gcm
    password: "your-ss-password"
proxy-groups:
  - name: "PROXY"
    type: select
    proxies:
      - "my-ss-server"
rules:
  - GEOIP,LAN,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,PROXY
```

支持的代理类型包括：
- **Shadowsocks (ss)**：适用于自建 SS 服务器
- **VMess**：适用于 V2Ray/Xray 服务器
- **Trojan**：适用于 Trojan 服务器
- **HTTP/SOCKS5**：适用于各种 HTTP 或 SOCKS5 代理

配置完成后，可以先测试基础代理功能，确认无误后再启用 TUN 模式。

### 1.2 启动 Clash 服务

安装完成后，使用 `clashctl` 命令管理服务：

```bash
# 启动代理服务
clashon

# 查看服务状态
clashctl status

# 访问 Web 控制台
clashui
```

### 1.3 配置 TUN 全局模式

启用 TUN 模式实现全局流量代理：

```bash
# 开启 TUN 模式
clashtun on

# 验证 TUN 状态
clashtun
```

TUN 模式会自动配置：
- 系统路由表
- DNS 劫持（端口 53）
- 自动检测网络接口

### 1.4 容器端口访问配置

由于 TUN 模式会代理所有出站流量，包括 Docker 容器的网络请求，这正是我们期望的行为——让容器内的应用也能通过代理访问外部网络。

但是，对于容器映射到宿主机的端口（如 OpenClaw 的 18789 端口），需要在 Mixin 配置中添加端口排除，确保外部能够正常访问这些服务：

```bash
# 编辑 Mixin 配置
clashmixin -e
```

在 Mixin 配置文件中添加端口排除规则：

```yaml
tun:
  enable: true
  stack: system
  auto-route: true
  auto-detect-interface: true
  dns-hijack:
    - any:53
  # 排除容器映射的端口，确保外部可访问
  # 注意：exclude-src-port 用于排除源端口（客户端连接的端口）
  #       exclude-port 用于排除目标端口（服务监听的端口）
  # 在容器场景下，我们需要排除的是宿主机上暴露的服务端口（源端口）
  exclude-src-port:
    - 18789    # OpenClaw 服务端口
    - 9090     # Clash Web UI 端口
    # 根据实际需要添加其他端口
```

保存后，重启 Clash 服务使配置生效：

```bash
clashoff && clashon
```

这样配置后：
- **容器内应用**：所有出站流量都走代理，可以正常访问 GitHub、模型 API 等
- **容器对外服务**：映射的端口不被代理拦截，外部可以正常访问 OpenClaw 服务

## 2. OpenClaw Docker 部署

利用官方提供的 `docker-setup.sh` 脚本进行一键部署，充分利用已配置的全局代理。

### 2.1 使用官方部署脚本

```bash
# 克隆 OpenClaw 仓库
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 执行官方部署脚本
./docker-setup.sh --workspace /home/node/.openclaw/workspace-mini-d-noneface
```

### 2.2 挂载工作区目录
直接修改openclaw 项目下的 .env 配置即可，通过环境变量控制构建时指定参数。

### 2.3 启动服务

```bash
# 启动 OpenClaw 服务
docker compose up -d openclaw-gateway

# 查看日志确认启动成功
docker compose logs -f openclaw-gateway
```

由于服务器已经配置了 Clash TUN 全局代理，Docker 容器内的应用可以直接访问外部网络，无需额外配置代理环境变量。

至此，国内服务器 + docker容器内科学上网已完成。

### 2.4 国内大模型配置

OpenClaw 支持多种国内大模型提供商，以下为配置示例（敏感信息已隐藏）：

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "deepseek": {
        "baseUrl": "https://api.deepseek.com/v1",
        "apiKey": "YOUR_DEEPSEEK_API_KEY",
        "api": "openai-completions",
        "models": [
          {
            "id": "deepseek-chat",
            "name": "deepseek-chat (Custom Provider)",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 128000,
            "maxTokens": 8152
          },
          {
            "id": "deepseek-reasoner", 
            "name": "deepseek-reasoner (Custom Provider)",
            "reasoning": true,
            "input": ["text"],
            "contextWindow": 128000,
            "maxTokens": 8152
          }
        ]
      },
      "bailian": {
        "baseUrl": "https://coding.dashscope.aliyuncs.com/v1",
        "apiKey": "YOUR_BAILIAN_API_KEY",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen3.5-plus",
            "name": "qwen3.5-plus",
            "reasoning": false,
            "input": ["text", "image"],
            "contextWindow": 1000000,
            "maxTokens": 65536
          },
          {
            "id": "qwen3-max-2026-01-23",
            "name": "qwen3-max-2026-01-23", 
            "reasoning": true,
            "input": ["text"],
            "contextWindow": 262144,
            "maxTokens": 65536
          },
          {
            "id": "qwen3-coder-next",
            "name": "qwen3-coder-next",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 262144,
            "maxTokens": 65536
          },
          {
            "id": "qwen3-coder-plus",
            "name": "qwen3-coder-plus",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 1000000,
            "maxTokens": 65536
          },
          {
            "id": "MiniMax-M2.5",
            "name": "MiniMax-M2.5",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 204800,
            "maxTokens": 131072
          },
          {
            "id": "glm-5",
            "name": "glm-5",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 202752,
            "maxTokens": 16384
          },
          {
            "id": "glm-4.7",
            "name": "glm-4.7",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 202752,
            "maxTokens": 16384
          },
          {
            "id": "kimi-k2.5",
            "name": "kimi-k2.5",
            "reasoning": false,
            "input": ["text", "image"],
            "contextWindow": 262144,
            "maxTokens": 32768
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "bailian/qwen3-max-2026-01-23"
      }
    }
  }
}
```

**配置要点**：
- **DeepSeek**：支持 reasoning 模式，适合复杂推理任务
- **百炼（Bailian）**：阿里云平台，提供 Qwen 系列模型，上下文窗口大
- **API Key 管理**：建议通过环境变量注入，避免硬编码在配置文件中
- **模型选择**：根据任务需求选择合适的模型，如 coding 任务用 qwen3-coder 系列

### 2.5 Memory Search 本地 RAG 配置

OpenClaw 内置 memory search 功能，结合 memory-core 插件、本地 SQLite 存储和百炼嵌入模型，实现高效的本地 RAG 检索。

```json
{
  "plugins": {
    "allow": ["memory-core", "discord"],
    "slots": {
      "memory": "memory-core"
    },
    "entries": {
      "memory-core": {
        "enabled": true
      }
    }
  },
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "provider": "openai",
        "remote": {
          "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
          "apiKey": "YOUR_BAILIAN_EMBEDDING_API_KEY",
          "batch": {
            "enabled": true
          }
        },
        "fallback": "none",
        "model": "text-embedding-v4"
      }
    }
  }
}
```

**配置说明**：
- **memory-core 插件**：提供本地记忆存储和检索功能，默认使用 SQLite 数据库存储
- **百炼嵌入模型**：使用 `text-embedding-v4` 模型，中文理解能力强，有免费额度
- **兼容 OpenAI API**：百炼的 embedding API 兼容 OpenAI 格式，`baseUrl` 必须设置为 `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **批量处理**：启用 `batch.enabled: true` 提升 embedding 生成效率
- **无本地回退**：`fallback: "none"` 表示不使用本地 embedding 模型，完全依赖远程 API

**优势**：
- **本地存储**：所有对话历史和记忆数据存储在本地 SQLite 中，保障数据隐私
- **高效检索**：利用百炼的高质量 embedding 模型，提升中文语义检索准确率
- **成本可控**：百炼提供免费额度，个人使用基本无需付费
- **无缝集成**：与 OpenClaw 的 agent 系统深度集成，自动为每个 agent 维护独立的记忆空间

## 3. Discord 频道集成

配置 OpenClaw 连接 Discord 频道，实现消息交互。

### 3.1 Discord Bot 创建

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 创建新应用并添加 Bot
3. 获取 Bot Token 和 Client ID
4. 邀请 Bot 到目标服务器，确保有适当权限

### 3.2 OpenClaw Discord 配置

在 `openclaw.json` 中配置 Discord 插件：

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "token": "YOUR_DISCORD_BOT_TOKEN",
      "guilds": {
        "YOUR_GUILD_ID": {
          "users": ["AUTHORIZED_USER_ID"],
          "channels": {
            "CHANNEL_ID": {
              "requireMention": false
            }
          }
        }
      }
    }
  }
}
```

可以参考官方文档的discord配置步骤，已经十分详细，这里不过多赘述。

> **安全提醒**：实际部署时，请将敏感信息（如 token）通过环境 variable 或密钥管理服务注入，不要硬编码在配置文件中。

## 4. 单 Bot 多 Agent 架构

通过角色路由实现一个 Discord Bot 实例承载多个专业化 agent。

### 4.1 Agent 定义与创建

在 OpenClaw 中，可以通过 CLI 命令创建和管理多个 agent。使用 `openclaw agents add` 命令创建新的 agent：

```bash
# 创建名为 mini-d-noneface 的 agent
openclaw agents add mini-d-noneface \
  --workspace /home/node/.openclaw/workspace-mini-d-noneface \
  --model bailian/qwen3-max-2026-01-23

# 创建名为 clawbaby-zoe 的 agent  
openclaw agents add clawbaby-zoe \
  --workspace /home/node/.openclaw/workspace-clawbaby-zoe \
  --model bailian/qwen3-max-2026-01-23
```

**命令参数说明**：
- `name`：agent 的唯一标识名称
- `--workspace`：指定 agent 的工作区目录
- `--model`：指定 agent 使用的模型 ID
- `--agent-dir`：可选，指定 agent 状态目录（默认在 ~/.openclaw/agents/ 下）

创建完成后，agent 会自动添加到 `openclaw.json` 的 `agents.list` 配置中。

也可以手动在 `openclaw.json` 的 `agents.list` 中定义多个 agent：

```json
{
  "agents": {
    "list": [
      {
        "id": "mini-d-noneface",
        "name": "mini-d@noneface",
        "workspace": "/home/node/.openclaw/workspace-mini-d-noneface",
        "model": "bailian/qwen3-max-2026-01-23"
      },
      {
        "id": "clawbaby-zoe", 
        "name": "clawbaby@zoe",
        "workspace": "/home/node/.openclaw/workspace-clawbaby-zoe",
        "model": "bailian/qwen3-max-2026-01-23"
      }
    ]
  }
}
```

### 4.2 角色绑定配置

通过 `bindings` 配置将不同 Discord 角色映射到不同 agent：

```json
{
  "bindings": [
    {
      "agentId": "mini-d-noneface",
      "match": {
        "channel": "discord",
        "guildId": "YOUR_GUILD_ID",
        "roles": ["ROLE_ID_FOR_MINI_D"]
      }
    },
    {
      "agentId": "clawbaby-zoe",
      "match": {
        "channel": "discord", 
        "guildId": "YOUR_GUILD_ID",
        "roles": ["ROLE_ID_FOR_CLAWBABY"]
      }
    }
  ]
}
```

### 4.3 工作机制

- 用户在 Discord 中被分配特定角色
- 当用户发送消息时，OpenClaw 根据用户的角色匹配对应的 agent
- 不同 agent 使用独立的工作区、模型配置和记忆系统
- 实现资源隔离和专业化分工


## 5. 结语

至此，就可以在discord 内，实现一个bot，在一个服务器内，不同用户在不同频道下实现和同gateway不同agent沟通，相互不干扰.

### 系统架构关系图（当前单Bot多Agent）

```
┌──────────────────┐     ┌─────────────────────┐
│                  │     │                     │
│  Discord User    │     │   Discord Server    │
│  + Role A        │────▶│  + Guild ID         │
│                  │     │  + Channels         │
└──────────────────┘     └──────────┬──────────┘
                                    │
                                    │ Discord API
                                    ▼
                           ┌────────┴────────┐
                           │                 │
                           │  Discord Bot    │
                           │  (Single Bot)   │
                           └────────┬────────┘
                                    │
                                    │ Local Communication  
                                    ▼
                      ┌─────────────┴─────────────┐
                      │                           │
                      │    OpenClaw Gateway       │
                      │    (Port: 18789)          │
                      └─────────────┬─────────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                                             │
             ▼                                             ▼
┌────────────┴────────────┐                   ┌────────────┴────────────┐
│                         │                   │                         │
│      Agent A            │                   │      Agent B            │
│  (mini-d-noneface)      │                   │  (clawbaby-zoe)         │
│  - Workspace A          │                   │  - Workspace B          │
│  - Model: qwen3-max     │                   │  - Model: qwen3-max     │
│  - Memory: isolated     │                   │  - Memory: isolated     │
│  - SQLite DB A          │                   │  - SQLite DB B          │
└─────────────────────────┘                   └─────────────────────────┘
```

**请求流程**：
1. Discord 用户（带特定角色）在频道中发送消息
2. Discord Bot 接收到消息，通过 Discord API
3. Bot 将消息转发给 OpenClaw Gateway（本地 18789 端口）
4. Gateway 根据用户的角色匹配对应的 Agent
5. 对应的 Agent 处理请求并返回响应
6. Gateway 将响应通过 Bot 发送回 Discord 频道

### 未来进化方向：单 Gateway + 多 Bot + 多 Agent 协同

当前架构实现了基于角色的单 Bot 多 Agent 路由，但更进一步的演进方向是**单 Gateway + 多 Bot + 多 Agent 协同作业**：

**架构升级**：
- **单 Gateway**：维持单一 OpenClaw Gateway 实例，统一管理和调度
- **多 Bot**：在同一个 Discord 服务器中部署多个 Bot 实例，每个 Bot 对应不同的专业领域
- **多 Agent**：每个 Bot 可以路由到一个或多个专业化 Agent

**协同作业场景**：
- 用户在单个 Discord 频道中同时 @ 多个 Bot
-  each Bot 将请求路由到对应的 Agent 进行处理
- 不同 Agent 可以共享上下文或通过 Gateway 进行协作
- 最终整合多个 Agent 的输出，提供综合性的解决方案

### 多 Bot 协同架构关系图

```
┌──────────────────┐     ┌─────────────────────┐
│                  │     │                     │
│  Discord User    │     │   Discord Server    │
│  (@Bot-A @Bot-B) │────▶│  + Guild ID         │
│                  │     │  + Channels         │
└──────────────────┘     └──────────┬──────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
               ▼                    ▼                    ▼
    ┌──────────┴──────────┐ ┌──────┴───────┐ ┌──────────┴──────────┐
    │                     │ │              │ │                     │
    │   Discord Bot A     │ │ Discord Bot  │ │   Discord Bot B     │
    │  (Dev Assistant)    │ │    C (Ops)   │ │  (Data Scientist)   │
    └──────────┬──────────┘ └──────┬───────┘ └──────────┬──────────┘
               │                    │                    │
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    │
                                    ▼
                      ┌─────────────┴─────────────┐
                      │                           │
                      │    OpenClaw Gateway       │
                      │    (Single Instance)      │
                      └─────────────┬─────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────┴───────┐       ┌─────────┴─────────┐       ┌─────────┴─────────┐
│               │       │                   │       │                   │
│  Agent Dev    │       │    Agent Ops      │       │  Agent DataSci    │
│  (Coding)     │       │  (Monitoring)     │       │  (Analytics)      │
│  - Workspace  │       │  - Workspace      │       │  - Workspace      │
│  - SQLite DB  │       │  - SQLite DB      │       │  - SQLite DB      │
└───────────────┘       └───────────────────┘       └───────────────────┘
```

**协同流程**：
1. Discord 用户在频道中同时 @Bot-A 和 @Bot-B
2. 多个 Discord Bot 同时接收到消息
3. 所有 Bot 将请求转发给同一个 OpenClaw Gateway
4. Gateway 根据 Bot 身份路由到对应的 Agent
5. 多个 Agent 并行处理，可通过 Gateway 共享上下文
6. 各 Agent 分别通过对应的 Bot 返回响应到同一频道
7. 用户获得多角度的专业化回答

**技术实现**：
- 通过 Discord 的多 Bot 配置，每个 Bot 使用独立的 Token
- 在 OpenClaw Gateway 中配置多个 Discord channel 条目
- 利用 Agent 间的通信机制和discord 消息作为agent输入实现协同推理

这种架构将 OpenClaw 从"单用户多任务"模式升级为"多智能体协同"模式，为复杂任务分解、专业领域协作和综合决策支持提供了强大的基础设施。

---

*2026年3月，上海。OpenClaw 最佳实践持续演进中。*