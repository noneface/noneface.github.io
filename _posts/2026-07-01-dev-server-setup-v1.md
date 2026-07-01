---
layout: post
title: "个人开发服务器配置实践 v1.0"
date: 2026-07-01
tag: codes
---

# 个人开发服务器配置实践 v1.0

一套在远程 Linux 服务器上搭建稳定开发环境的完整方案。解决两个问题：**用什么工具**（选型与配置）和**怎么组网**（双机架构与流量路径）。

环境：A 机 腾讯云 VPS (Ubuntu 24.04) + B 机 LA 海外 VPS。A 负责干活，B 负责门面，中间 frp 隧道打通。

## 整体架构

先看全局拓扑，再展开每个组件怎么配。

```
                           INTERNET
                              │
                              │  域名 D 解析到 B
                              ▼
              ┌───────────────────────────────┐
              │                               │
              │    🌍 B: LA 海外 VPS            │
              │    65.49.208.3                 │
              │                               │
              │  ┌─────────────────────────┐  │
              │  │  Nginx Proxy Manager    │  │
              │  │  (子域名管理器)           │  │
              │  │                         │  │
              │  │  svc1.d.com ──┐         │  │
              │  │  svc2.d.com ──┤         │  │
              │  │  svc3.d.com ──┘         │  │
              │  └───────────┬─────────────┘  │
              │              │                │
              │              ▼                │
              │  ┌─────────────────────────┐  │
              │  │  frps (服务端)            │  │
              │  │  监听 :7000 (控制)       │  │
              │  │  Proxy 端口池 :9000-9003 │  │
              │  └───────────┬─────────────┘  │
              │              │                │
              └──────────────┼────────────────┘
                             │
                      frp 隧道 (加密)
                      TCP/HTTP/HTTPS
                             │
              ┌──────────────┼────────────────┐
              │              │                │
              │    ☁️  A: 腾讯云 VPS            │
              │    Ubuntu 24.04               │
              │                               │
              │  ┌─────────────────────────┐  │
              │  │  frpc (客户端)            │  │
              │  │  连接 B:7000             │  │
              │  │  supervisord 托管，      │  │
              │  │  autorestart 保活        │  │
              │  └───────────┬─────────────┘  │
              │              │                │
              │     ┌────────┼────────┐       │
              │     ▼        ▼        ▼       │
              │  ┌──────┐ ┌──────┐ ┌──────┐  │
              │  │Hermes│ │ 3D   │ │Super-│  │
              │  │WebUI │ │Print │ │visor │  │
              │  │:8787 │ │:6688 │ │:9001 │  │
              │  └──────┘ └──────┘ └──────┘  │
              │                               │
              └───────────────────────────────┘
```

**一句话数据流**：用户 → 域名D → B(NPM子域名路由) → frps → 隧道 → A(frpc) → 对应服务。

### 组网各层

**DNS**：域名 D 的 A 记录指向 B 的 IP `65.49.208.3`。B 是全站唯一的公网入口。

**Nginx Proxy Manager**：B 上的反向代理管理器，负责 SSL 证书（Let's Encrypt 自动续期）和子域名路由。上游地址都是 `127.0.0.1:frps端口`，对 NPM 来说就像在访问本地服务：

| 子域名 | 上游 | 对应 A 服务 |
|---|---|---|
| `svc1.d.com` | `127.0.0.1:9002` | Hermes WebUI :8787 |
| `svc2.d.com` | `127.0.0.1:9003` | supervisord :9001 |
| `svc3.d.com` | `127.0.0.1:9001` | 3D Print Studio :6688 |

**frp 隧道**：服务端 frps 跑在 B (`:7000`)，客户端 frpc 跑在 A。每条 proxy 定义一个端口映射。后文 [3.2 内网穿透](#32-内网穿透--frp-frpc) 有完整配置。

**本地服务**：A 上所有服务监听 `127.0.0.1`，不暴露到公网，由 supervisord 统一托管。

### 实际访问路径（以 Hermes WebUI 为例）

```
浏览器输入 https://svc1.d.com
  → DNS 解析 → 65.49.208.3 (B)
  → B:443 → NPM (SSL 卸载 + 路由匹配)
  → proxy_pass → 127.0.0.1:9002 (B 本机 frps proxy)
  → frps :9002 → 加密隧道 → frpc (A)
  → frpc forward → 127.0.0.1:8787 (A)
  → Hermes WebUI 响应原路返回
```

全程 HTTPS，证书在 NPM 层处理，后端服务不需要关心 SSL。

---

## 1. Python 环境管理 → uv

### 选型理由：pipx vs uv

先看对比：

| 维度 | pipx | uv |
|------|------|-----|
| 定位 | 只装 Python 应用（CLI 工具） | 全能：应用 + 库 + venv + Python 版本管理 |
| 安装方式 | apt / pip | 单二进制（curl \| sh） |
| 速度 | 普通（pip resolver） | 快 10-100x（Rust 实现） |
| 隔离 | 每个应用一个 venv | `uv tool install`（同 pipx）+ `uv venv`（自由建） |
| 依赖解析 | pip resolver，慢且偶尔冲突 | 自家快速 resolver，无冲突 |
| 管理 Python 版本 | ❌ | ✅ `uv python install 3.12` |
| 锁文件 | ❌ | ✅ `uv lock` / `uv sync`（项目级） |

结论很直白：**pipx 能做的 uv 全能做，反过来不行。** 既然一个工具能同时满足装 CLI 应用 + 管项目 venv + 锁依赖 + 管 Python 版本，就没理由留两个。直接清掉 pipx，统一走 uv。

### 安装

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# → uv 0.11.26
```

### 使用约定

```bash
# 创建项目 venv
uv venv /opt/myproject-venv

# 装包（默认 PyPI，国内慢可指定源）
uv pip install -i https://pypi.org/simple/ supervisor

# 后续所有 Python 包统一走 uv
```

> `uv tool install` 也可以替代 pipx 的场景，视项目需要选用。

---

## 2. 进程管理 → supervisord

### 选型理由

之前用 nohup + & 手动管进程，重启丢失、日志散落、状态不透明。supervisord 是 Python 原生、配置简单、功能刚好够用。

### 安装

```bash
uv venv /opt/supervisor-venv
/opt/supervisor-venv/bin/pip install supervisor
ln -s /opt/supervisor-venv/bin/supervisord /usr/local/bin/supervisord
ln -s /opt/supervisor-venv/bin/supervisorctl /usr/local/bin/supervisorctl
```

### 配置

主配置 `/etc/supervisor/supervisord.conf`，关键项：

```ini
[inet_http_server]
port=0.0.0.0:9001
username=noneface
password=xxx

[include]
files = /etc/supervisor/conf.d/*.conf
```

每个服务一个 `.conf` 文件放在 `conf.d/`：

```
/etc/supervisor/conf.d/
├── frpc.conf            # FRP 客户端
├── claude-daemon.conf   # Claude Code 守护进程
└── hermes-webui.conf    # Hermes Web UI
```

### 托管的服务

| 服务 | 用途 | 配置重点 |
|------|------|---------|
| frpc | FRP 内网穿透客户端 | `autorestart=true`，保活 |
| claude-daemon | Claude Code 后台 | `startsecs=5`，等初始化 |
| hermes-webui | Hermes Agent Web 界面 | 从 nohup ctl.sh 迁移，注意端口冲突 |

### 迁移故事：hermes-webui 的死锁陷阱

hermes-webui 自带 `ctl.sh` 生命周期脚本，之前用 `nohup` 后台跑。迁移到 supervisord 时踩了一个关键坑：

**不能先杀旧进程再起新的。** 原因：当前操作会话就运行在 hermes-webui 上，杀掉旧进程等同于断了自己的手，后续命令全部无法执行。

正确做法：
1. 先写好 supervisord 配置，设 `autostart=false`
2. `supervisorctl reread && supervisorctl update` 注册但不启动
3. 改回 `autostart=true`，用一条原子命令完成 kill + start
4. supervisord 自动拉起新实例，端口无缝接管

配置示例：

```ini
[program:hermes-webui]
command=/usr/local/lib/hermes-agent/venv/bin/python /root/workspace/hermes-webui/bootstrap.py --no-browser --foreground
directory=/root/workspace/hermes-webui
autostart=true
autorestart=true
startsecs=3
stopwaitsecs=15
redirect_stderr=true
stdout_logfile=/root/.hermes/webui.log
```

> ctl.sh 内部调用的是 `bootstrap.py --no-browser --foreground`，比直接用 `server.py` 多一层环境加载。后续可考虑对齐。

### 常用命令

```bash
supervisorctl status           # 全局状态
supervisorctl restart frpc     # 重启单个
supervisorctl tail frpc        # 实时日志
supervisorctl reread && supervisorctl update  # 新配置生效
```

---

## 3. 代理托管

### 3.1 出站代理 → mihomo (Clash)

出站走 mihomo，提供 HTTP 代理 `127.0.0.1:7890` 和管理面板 `:9090`。Claude Code 通过环境变量走代理：

```
HTTP_PROXY=http://127.0.0.1:7890
```

### 3.2 内网穿透 → frp (frpc)

服务端 frps 跑在 B 机 `65.49.208.3:7000`，用 `auth.token` 认证。本地 frpc 注册 4 条 TCP 隧道：

```toml
# frpc.toml
serverAddr = "65.49.208.3"
serverPort = 7000

[auth]
token = "xxx"

[[proxies]]
name = "hermes"
type = "tcp"
localIP = "127.0.0.1"
localPort = 8787
remotePort = 9002
```

每条 `[[proxies]]` 定义一条隧道：把 A 的本地端口映射到 B 的远程端口。

| Proxy 名称 | A:本地端口 | B:远程端口 | 服务 | 当前状态 |
|---|---|---|---|---|
| `code-server` | 8888 | 9000 | 预留 | 已停用 |
| `3d-printer` | 6688 | 9001 | 3D Print Studio | 运行中 |
| `hermes` | 8787 | 9002 | Hermes Web UI | 运行中 |
| `supervisord` | 9001 | 9003 | 进程管理面板 | 运行中 |

端口映射是 TCP 透传，frp 不管上层协议。新增服务三步走：改 frpc.toml 加 proxy → NPM 加域名路由 → `supervisorctl restart frpc`。

> **安全提醒**：B 机的 9000-9003 端口不要直接在防火墙开放。所有流量应走 NPM (`:443`) 内部转发，否则等于绕过 SSL 和认证。

---

## 4. Agent 部署

### 4.1 Claude Code

```bash
# 版本
claude --version
# → 2.1.191 (Claude Code)
```

通过 DeepSeek 提供的 Anthropic 兼容 API 调用，后端模型为 `deepseek-v4-pro[1m]`（1M 上下文窗口）。

daemon 进程交给 supervisord 托管：

```ini
[program:claude-daemon]
command=/root/.local/bin/claude daemon run --json-path /root/.claude/daemon.status.json
autostart=true
autorestart=true
```

### 4.2 Hermes Web UI

Hermes Agent 的 Web 管理界面，项目源码在 `/root/workspace/hermes-webui`。

启动方式：

```bash
# ctl.sh（手动模式）
./ctl.sh start              # 后台启动
./ctl.sh status             # 查看状态和健康检查
./ctl.sh logs --follow      # 实时日志

# supervisord（推荐，已接管）
supervisorctl status hermes-webui
```

核心配置通过环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `HERMES_WEBUI_HOST` | `127.0.0.1` | 监听地址 |
| `HERMES_WEBUI_PORT` | `8787` | 监听端口 |

实际部署中监听 `127.0.0.1:8787`，通过 frp 的 `9002` 端口对外暴露。认证由 hermes-webui 自己的密码机制处理，frp 层只做 TCP 转发。

> 项目自带 `ctl.sh` 脚本，底层调用 `bootstrap.py --no-browser --foreground`。supervisord 配置中直接用 `server.py` 也能跑，但如果需要自动加载 `.env` 等环境变量，建议对齐 bootstrap.py。

---

## 5. 组网注意事项

**1. frp 控制通道一定要加 token**

`auth.token` 不是可选项。7000 端口暴露在公网，不加认证等于把内网大门敞开。

**2. B 机带宽是瓶颈**

A 的服务性能再好，用户到 B 再到 A，B 的出站带宽决定一切。大文件场景需要 30Mbps+。

**3. Debug 要多层排查**

用户报 502，问题可能在 DNS → NPM → frps → 隧道 → frpc → 服务本身，五层中的任意一层。建议 NPM 开启访问日志快速定位。

**4. B 是单点**

B 挂了所有服务不可达。好在 frpc 会自动重连，B 恢复后链路自愈。

---

## 总结：四条原则 + 两个教训

1. **Python 环境一律走 uv** —— 不做例外，不混用 pipx
2. **常驻进程进 supervisord** —— 一条 `supervisorctl status` 看全貌
3. **出站走 mihomo，入站走 frp** —— 代理各司其职
4. **Agent 也是进程** —— Claude Code daemon、Hermes Web UI 和普通服务一样托管

**教训一：自举陷阱。** 当要迁移的服务就是当前操作的会话载体（如 hermes-webui），必须先注册后切换，不能先杀后起。supervisord 的 `autostart=false` → `reread` → `autostart=true` → 原子切换 是安全路径。

**教训二：端口不要双重暴露。** NPM 已经通过 `:443` 提供了 HTTPS 入口，就不要在 B 机防火墙上开放 9000-9003 端口。双重入口 = 绕过了 SSL 和认证 = 裸奔。

当前 supervisord 托管全景：

```
claude-daemon     RUNNING
frpc              RUNNING
hermes-webui      RUNNING
stl-viewer        RUNNING
```

后续待做：supervisord 面板通过 frp + NPM 暴露（9003），先加固 TLS/认证；把 NPM 配置纳管到版本控制，做到整条链路可重建。
