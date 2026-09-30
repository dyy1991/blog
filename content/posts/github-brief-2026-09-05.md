---
title: "每日 GitHub 开源速报 · 2026-09-05"
date: "2026-09-05"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近期新晋 / 高速上升项目 Top 5:deepseek-harness、orca、OmniRoute、herdr、ai-job-search。Agent harness 走向插件化,LLM 网关与 agent 运行时把云原生基础设施重新发明一遍。"
---

# 每日 GitHub 开源速报 · 2026-09-05

> 关键词:AI / LLM / Agent · 范围:近期新晋 / 高速上升项目 · Top 5

---

## 1. [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) ⭐ ~212k

**DeepSeek Harness — 「一切皆插件」的开源 Agent Harness**

`TypeScript` · +12k star / 8 天 · MIT

DeepSeek 官方开源的 agent harness(命令行别名 `dsh`),核心理念是「Everything is a Plugin」:模型接入、工具、记忆、执行后端全部以插件形式挂载,底层由 Cordis 插件框架驱动。目标是让 DeepSeek 系列模型能像 Claude Code / Codex 那样在终端里完成规划—调用工具—执行的闭环,同时把每一块能力都做成可替换、可组合的单元。目前处于 developer preview 阶段。

**看点**:本周现象级上升项目,8 天涨 1.2 万 star。对 DevOps 而言,「插件化 harness」意味着可以把 CI/CD 里的自定义工具(部署、回滚、巡检脚本)以插件方式注册给 agent,而不用魔改主程序——这种解耦架构正是让 AI agent 进企业内网工具链的关键。

---

## 2. [stablyai/orca](https://github.com/stablyai/orca) ⭐ ~62k

**Orca — 面向「并行 Agent 舰队」的 ADE(Agent Development Environment)**

`TypeScript` · +6.3k star / 8 天 · MIT · 创建于 2026-03

Stably AI 开源的 agent 开发环境:可以并行运行多个 CLI coding agent,每个 agent 隔离在自己独立的 **git worktree** 中,从同一 base ref 并发拉起,各自拥有终端、内嵌 Chromium 标签页、Monaco 编辑器和上下文。支持桌面 / 移动端 / VPS 部署,可用自己的订阅额度跑任意 coding agent。

**看点**:git worktree 级别的并行隔离是这个项目最 DevOps 的地方——它本质上把「多分支并行开发 + 沙箱隔离」的工程实践搬给了 agent 集群,和 CI 里 matrix build、并行流水线的思路一脉相承;想做「一个需求拆给多个 agent 同时跑」的团队值得参考它的隔离模型。

---

## 3. [diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute) ⭐ ~61k

**OmniRoute — 单端点、多提供商的免费 AI 网关**

`TypeScript / Next.js`(Rust core)· +4.2k star / 8 天 · MIT

一个 MIT 许可的本地 AI 路由网关 + 面板:对外暴露单一 OpenAI 兼容端点,对内统一 352 家提供商(150+ 免费)、1200+ 模型(Kimi、Claude、GPT、Gemini、GLM、DeepSeek、MiniMax 等)。特性包括配额感知的自动 fallback、token 刷新、用量统计,以及号称能省 15–95% token 的 RTK+Caveman 压缩;兼容 Claude Code、Codex、Cursor、Cline、Copilot,支持 MCP/A2A 与桌面 / PWA。

**看点**:这是纯正的基础设施型项目——「单端点 + 自动 fallback + 用量可观测」就是把 API gateway、熔断降级、成本可观测这些云原生实践套用到了 LLM 流量上。对要控本降险的团队,它是一个现成的 LLM 流量治理层参考实现。

---

## 4. [herdrdev/herdr](https://github.com/herdrdev/herdr) ⭐ ~35k

**Herdr — 「你的 coding agent 赖以运行的 runtime」**

`Rust` · +2.4k star / 8 天 · Apache-2.0

用 Rust 写的单二进制持久化后台运行时:让 agent 的终端在重启、断网后依然存活,每个 pane 有可视化状态(working / blocked / idle),agent 可以自主长时间工作。agent 通过 CLI 和 socket API 驱动 herdr——生成新 pane、互相下达 prompt、等待另一个 agent 真正阻塞时再介入。无 Electron 开销,一个 Rust 二进制即可。

**看点**:和你的方向最贴——这是把「进程守护 / 会话持久化 / 状态可观测」(想想 systemd + tmux + supervisor 的组合)重新为 agent 场景实现了一遍。长时任务跨重启不丢、socket API 可编排,天然适合塞进 CI runner 或常驻服务器,是 AgenticOps 落地时的运行时底座候选。

---

## 5. [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) ⭐ ~41k

**AI Job Search — 跑在你自己机器上的求职 Agent 框架**

`Python`(混合 TypeScript)· +3.5k star / 8 天 · 基于 Claude Code

本地优先(local-first)的求职自动化框架,构建在 Claude Code 之上:fork 后填入自己的资料,agent 就能评估岗位、按岗定制 CV(Markdown/PDF)、撰写求职信、准备面试。采用「drafter–reviewer」双 agent 架构(一个起草、一个审校),通过 `/setup`、`/scrape`、`/apply` 等自定义 slash command 驱动流程。声明为独立开源项目,与 Anthropic 无隶属关系。

**看点**:抛开求职场景本身,它是一个很干净的「本地优先 + 双 agent 审校 + slash command 工作流」参考架构。drafter/reviewer 的分工等价于 CI 里的「生成 → 评审门禁」,想自建带质量门的自动化流水线可以照搬它的编排骨架。

---

## 今日趋势小结

本周 AI 开源三条主线：**① Agent harness 走向「插件化 / 可组合」**(deepseek-harness 的 everything-is-a-plugin、Orca 的可插拔 agent 舰队),模型和工具彻底解耦成可替换单元;**② 基础设施层被重新发明一遍**——OmniRoute 之于 LLM 流量网关、herdr 之于 agent 运行时,本质都是把 API gateway、进程守护、可观测性这些云原生老问题搬到 agent 场景;**③ 本地优先 + 分工审校成为 agent 应用的默认形态**(ai-job-search 的 drafter/reviewer)。对 DevOps 方向,herdr 和 OmniRoute 最值得细读——它们正好对应「运行时」和「流量治理」两块你熟悉的基础设施。

---
*数据来源:findarepo(2026-09-04 快照)、GitHub 仓库页与 star-history / ecosyste.ms、各项目 README,经 WebSearch 交叉核对。*
*说明:本期通过 WebSearch 两段式路径采集(GitHub Search API 在当前环境不可直连),star 数为近 8 天窗口的近似值(以 `~` 标注);受数据源限制,「严格近 7 天创建」这一过滤条件无法逐一核验,本期以「近期新晋 / 高速上升」口径选取,创建日期能确认的已标注。*

---
*本文由每日定时任务自动生成。*
