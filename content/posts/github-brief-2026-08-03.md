---
title: "每日 GitHub 开源速报 · 2026-08-03"
date: "2026-08-03"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋/新开源高 star 项目 Top 5:qm、codex-security、AgentENV、Kimi-K3、reverse-skill。「干活型」Agent 基础设施集中开源,Agent 运行时/沙箱成为新战场。"
---

# 每日 GitHub 开源速报 · 2026-08-03

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋/新开源高 star 项目 · Top 5

---

## 1. [yc-software/qm](https://github.com/yc-software/qm) ⭐ ~4,900

**QM — Y Combinator 内部自用的「多人协作 Agent 工作台」**

`TypeScript` · Fork ~551 · 开源于 07-31 · MIT

Y Combinator 把自己内部跨会计、法务、活动、工程(包括开发 QM 本身)使用的多 Agent harness 开源了。定位类似 Hermes / OpenClaw,但面向「一整个公司」:cloud-first,原生带 Slack 和 Web UI。每个员工拥有独立隔离的 workspace,互不影响,也能在频道 / 群聊 / 项目里与 Agent 协作;每个人、每个房间都有各自 scoped 的记忆、文件、keychain 视图、权限、cron 定时任务、Web App 和持久化 sandbox。核心运行在 Node 上(Fastify 做 HTTP,Slack 插件用 Bolt,Web UI 用 Vite + Lit)。

**看点**:发布数小时破 2.4k、几天冲到近 5k star。对 DevOps 而言最值得看的是它的「多租户运维形态」——per-user 持久 sandbox + 权限 + cron + keychain 隔离,本质是把 agent 平台按企业级多租户来设计,而不是单机玩具。

---

## 2. [openai/codex-security](https://github.com/openai/codex-security) ⭐ ~7,900

**Codex Security — OpenAI 开源的「找洞 / 验洞 / 修洞」安全 CLI + SDK**

`TypeScript` · 本周 +543 · 开源于 07-29 · Apache-2.0

OpenAI 把 3 月起处于 research preview 的 Codex Security 正式开源:一个命令行工具 + TypeScript SDK,用来发现、验证并修复代码库中的安全漏洞。能扫描整个仓库或仅扫 diff 变更,验证疑似缺陷,生成补丁,并在多次运行间保留 findings。与传统纯 pattern matching 不同,它用模型做上下文分析——判断代码在具体上下文中的行为,给出可供人工审阅的补丁。需要 Node.js 22+ 与 Python 3.10+,npm 包为 `@openai/codex-security`。上线一天即破 2.6k star。

**看点**:与 CI/CD 结合最直接的一个——「扫 PR diff → 验证 → 给补丁」正好落在流水线的 DevSecOps 门禁位置;Apache-2.0 也便于企业内嵌。可对照第 5 条的 reverse-skill,一个偏防御、一个偏攻防。

---

## 3. [kvcache-ai/AgentENV](https://github.com/kvcache-ai/AgentENV) ⭐ ~2,500

**AgentENV(AENV)— 大规模跑 Agent 环境的分布式沙箱平台**

`Rust / Go 混合` · Fork ~209 · 开源于 07-27 · MIT

Moonshot AI 与 kvcache-ai 联合开源,是支撑 Kimi K3 agentic RL 训练的底层系统。它在多台机器上运行海量 Firecracker 微虚机,配合 overlaybd 对多种 OCI 兼容镜像做「按需懒加载」,并对外暴露与 E2B SDK 兼容的 HTTP API——现有 Python / TypeScript agent 代码几乎无需改动即可接入。定位是「agent 舰队底下的隔离执行层」。

**看点**:纯正的云原生基础设施样本——Firecracker 微虚机 + OCI 镜像 + overlaybd 懒加载,把「安全隔离」和「快速冷启动 / 海量并发」两个诉求同时解掉。对做平台工程 / 沙箱调度的人,是本周最值得精读的一份工程实现。

---

## 4. [MoonshotAI/Kimi-K3](https://github.com/MoonshotAI/Kimi-K3) ⭐ ~7,500

**Kimi K3 — Open Frontier Intelligence,首个跻身 3 万亿参数级的开源模型**

`Modified MIT` · 权重开源于 07-27 · 本周 +575

Moonshot AI 放出 Kimi K3 开源权重:2.8T 参数,是首个进入 3 万亿参数量级的开源模型,采用 MXFP4 量化以压缩体积,声称在多项基准上对标头部闭源系统。License 沿用 K2 系列的 Modified MIT,允许带署名商用。配套的 RL 训练环境正是第 3 条的 AgentENV,「模型 + 训练基础设施」成套开放。

**看点**:对 DevOps / 平台方,可自托管的前沿权重意味着「数据主权」选项——在合规敏感的 CI / agent 栈里可以不把代码送出公司。真正落地要算清 2.8T 参数的推理成本,可对照第 3 条 AgentENV 及各类量化 / 分片方案。

---

## 5. [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill) ⭐ ~6,900

**reverse-skill — 逆向 / 授权渗透 / 安全研究的「技能路由包」**

`PowerShell / 多语言` · Fork ~1,100 · MIT · 本周 GitHub Trending 冲到前列

一个面向 AI 编码客户端的安全技能编排层:AI 自动路由 + 按需自举工具链 + 自动进化经验库,把通用 AI 助手「变身」成安全工程师。覆盖逆向工程、授权渗透测试、CTF 与漏洞研究,支持 Claude Code、Kiro、Cursor、Cline 等客户端。本周热度飙升,8 月 3 日一度位列 GitHub Trending 第二。

**看点**:把「安全测试技能」直接塞进开发者日常已在用的 AI 编码客户端里,降低了红队 / 安全研究的上手门槛。务必注意其定位是「authorized(授权)」测试——用在自己有权限的目标上;与第 2 条 codex-security 恰好组成「攻 / 防」两端。

---

## 今日趋势小结

1. **「干活型」Agent 基础设施集中开源,且都在谈治理。** 本周 YC 开源 qm、OpenAI 开源 codex-security(以及稍早 Andrew Ng 的 openworker),共同信号是从「聊天」转向「交付可审阅的成品」,并把权限、审批、隔离、findings 留存做成一等公民。

2. **Agent 运行时 / 沙箱成为新战场。** AgentENV 的 Firecracker + OCI + overlaybd、qm 的 per-user 持久 sandbox,都在解决同一类问题:如何让大量 agent 既隔离又能海量并发、可审计。这是最「DevOps 化」的一条主线。

3. **前沿开源模型继续放量,并与训练基础设施打包开放。** Kimi K3(2.8T)与其 RL 环境 AgentENV 同期开源,「模型 + 环境」成套供给,降低了自托管前沿能力的门槛。

4. **AI 安全攻防两端都在往开发者的 AI 客户端里下沉。** codex-security(防御 / DevSecOps 门禁)与 reverse-skill(攻防 / 安全研究)一防一攻,都选择嵌入 Claude Code / Cursor 这类日常工具。

对 DevOps / CICD 方向,本周最值得细读的是 **openai/codex-security**(可直接做流水线安全门禁)与 **kvcache-ai/AgentENV**(云原生沙箱执行层)。

---

*数据来源:GitHub 趋势聚合(Trendshift 周榜 / 月榜)+ 各仓库定向检索;沙箱环境无法直连 GitHub Search/REST API,star/fork 数为近似值,「创建 / 开源」日期以公开开源时间为准。*

*本文由每日定时任务自动生成。*
