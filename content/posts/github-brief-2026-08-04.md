---
title: "每日 GitHub 开源速报 · 2026-08-04"
date: "2026-08-04"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:OmniRoute、OfficeCLI、herdr、colibri、openwiki。frontier 模型竞赛让位于 infra 竞赛,Agent 运行时与 docs-as-code 融合 CI 成为看点。"
---

# 每日 GitHub 开源速报 · 2026-08-04

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute) ⭐ ~39,000

**OmniRoute — 一个端点、290+ 供应商的免费 AI 网关**

`TypeScript` · Fork ~5,100 · 近期新晋 · MIT

基于 Next.js 的本地 AI 路由网关与仪表盘:对外暴露单一 OpenAI 兼容端点(`/v1/*`),对内把流量在 290+ 供应商(90+ 免费)、500+ 模型(Kimi、Claude、GPT、Gemini、GLM、DeepSeek、MiniMax 等)之间做翻译、故障转移、token 刷新与用量追踪。带 quota 感知的自动 fallback,配合 RTK+Caveman 压缩号称省 15–95% token,支持 MCP/A2A,提供 Desktop/PWA。可直接接入 Claude Code、Codex、Cursor、OpenCode、Cline、Copilot。

**看点**:典型的「AI 基础设施」思路——把模型多供应商治理抽象成一层网关。对 DevOps 而言,单端点 + 配额兜底 + 用量可观测,正是把 LLM 调用纳入统一成本与可靠性管控的正确切面。

---

## 2. [iOfficeAI/OfficeCLI](https://github.com/iOfficeAI/OfficeCLI) ⭐ ~24,500

**OfficeCLI — 专为 AI Agent 打造的 Office 套件**

`C#` · 近期新晋 · 开源(permissive)

面向 AI Agent 读写与自动化 Word / Excel / PowerPoint 的命令行套件,单一自包含二进制,macOS/Linux/Windows 零依赖运行,无需安装 Office。关键设计是「确定性 JSON 输出、schema 一致」——不靠正则、不 scrape stdout,让 Agent 能可靠解析结果。自带 SKILL.md 与 skills 目录,可直接作为 Claude Code 等的技能挂载,并支持 MCP。

**看点**:「单二进制 + 确定性结构化输出」对 CI 场景极友好——报表生成、文档流水线可以塞进任意 runner,不必背 Office 依赖。是 agent 工具走向「工程可复现」的一个样板。

---

## 3. [herdrdev/herdr](https://github.com/herdrdev/herdr) ⭐ ~23,700

**herdr — 你的编程 Agent 赖以运行的终端运行时**

`Rust` · 近期新晋 · Apache-2.0

Rust 编写的终端原生 Agent 运行时,跑在你现有的终端模拟器里:提供持久会话、鼠标可交互的分屏(panes)、工作区组织,以及一套 CLI/socket API 供 Agent 自行编排环境。底层是轻量 TUI 进程,管理真实 PTY 会话,追踪 Agent 状态(blocked / working / done / idle),并通过换行分隔的 JSON socket API,让 Agent 无需人工介入即可创建分屏、执行命令、读取输出、等待状态变化。

**看点**:把「多 Agent 并行编排」下沉成一个进程运行时,是 grok-build / Orca 之后 terminal agent 赛道的又一延伸。对自动化流水线,可审计的状态机 + socket API 意味着 Agent 行为能被外部系统监控和门禁。

---

## 4. [JustVugg/colibri](https://github.com/JustVugg/colibri) ⭐ ~21,000

**colibri — 用纯 C 在消费级机器上跑 744B MoE 大模型**

`C` · 创建于约 07-09 · Apache-2.0

纯 C、零依赖的推理引擎,把 GLM-5.2(744B MoE)跑在约 25GB 内存的消费级机器上——experts 从磁盘按需流式加载,无 BLAS、无 Python 运行时、无需 GPU。核心就是一个 C 文件(`c/glm.c`)加少量头文件。目前支持四个模型家族:GLM-5.2(744B)、Inkling(975B)、Kimi K3(2.8T)、OLMoE(7B),统一 `coli chat / coli serve / coli web` 前端。近一周约 +1.3k star。

**看点**:「巨模型 + 极小引擎」的极致工程,把本地推理的硬件门槛砍到消费级。对私有化/离线部署与边缘推理是很有想象力的一条路;单文件、零依赖也意味着极易容器化和进 CI 做回归。

---

## 5. [langchain-ai/openwiki](https://github.com/langchain-ai/openwiki) ⭐ ~14,000

**OpenWiki — 为代码库自动撰写并维护 Agent 文档的 CLI**

`TypeScript` · 近期新晋 · MIT

LangChain 出品。`openwiki --init` 会扫描代码库并把初始文档生成到 `openwiki/` 目录;更关键的是随附一套 GitHub Actions 工作流,每天自动开一个 PR 更新文档,让「给 Agent 看的文档」始终跟着代码走。以全局 npm 包分发,使用自带的模型 API key。

**看点**:与 CI/CD 方向直接相关——把「文档即代码 + 定时 PR」做成开箱即用的 Actions 工作流,是 docs-as-code 的一个务实落地。让 coding agent 始终有一份最新的仓库地图,也顺带解决了「AI 改完代码文档就烂尾」的老问题。

---

## 今日趋势小结

本周 AI 开源三条主线:**① 基础设施层继续升温**——OmniRoute(多供应商网关)、colibri(消费级本地推理)都在解决「把模型调用变可靠、可控、可负担」的工程问题,frontier 模型竞赛正让位于 infra 竞赛;**② Agent 需要「运行时」和「确定性工具」**——herdr 把多 Agent 编排下沉为进程运行时,OfficeCLI 用单二进制 + 结构化 JSON 让工具调用可复现,二者都指向 agent 生态的工程化;**③ docs-as-code 与 CI 融合**——OpenWiki 用定时 GitHub Actions 维护 agent 文档,是 DevOps 视角下最值得直接借鉴的一条。对 CI/CD 学习者,OpenWiki 的 Actions 工作流与 OfficeCLI 的单二进制模式最可即插即用。

---
*数据来源:Trendshift 月度榜 + GitHub / WebSearch 检索(GitHub Search API 沙盒不可直连,star 数为近似值,创建日期未能逐一 API 核验) · 生成时间:2026-08-04*

*本文由每日定时任务自动生成。*
