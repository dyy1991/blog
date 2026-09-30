---
title: "每日 GitHub 开源速报 · 2026-09-15"
date: "2026-09-15"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "本周 star 增长最快 Top 5:deepseek-harness、archify、i-have-adhd、VoiceStudio、artemis。Agent 框架走向插件化,编码 agent 技能生态集中爆发。"
---

# 每日 GitHub 开源速报 · 2026-09-15

> 关键词:AI / LLM / Agent · 范围:本周 star 增长最快的热门项目 · Top 5

> ⚠️ 数据来源说明:本期 GitHub Search API(按 `created` 日期检索)因抓取通道限制无法直连,改用 findarepo 每日快照(其数据源为 GitHub REST API)选取「近 7 天 star 增长最快」的 AI 项目。因此本期为「本周热门/新晋 Top 5」而非严格「近 7 天新建」;各项目元数据(star/fork/语言/创建日期/license)均来自 GitHub API。

---

## 1. [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) ⭐ 222,000

**DeepSeek Harness — 「一切皆插件」的 Agent 框架**

`TypeScript` · Fork 26k · 创建于 08-13 · MIT · 本周 +8.4k star

DeepSeek 官方开源的 AI agent 框架,一句话定位是「Everything is a Plugin」——把 LLM 接入多步、可调用工具的工作流,核心能力(工具、模型路由、记忆、执行等)全部以插件形式组合。项目上线约一个月即冲到 22 万 star,位列 findarepo AI Agents 榜单第 2,配套站点 deepseek.com/harness。值得注意:26k fork 但 open issues 显示为 0(issue 可能被关闭,或反映真实使用度尚待验证)。

**看点**:插件化架构与 CI/CD「可组合流水线」的思路天然契合——agent 能力可像 pipeline step 一样按需拆装。对 DevOps 学习者,值得关注它的插件接口如何做能力隔离与权限边界;上线一月即巨量 star,热度需结合真实落地案例辩证看待。

---

## 2. [tt-a1i/archify](https://github.com/tt-a1i/archify) ⭐ 60,000

**Archify — 生成「可验证」架构图的 Agent Skill**

`JavaScript` · Fork 3.9k · 创建于 04-15 · MIT · 本周 +10k star

一个面向编码 agent(Claude Code / Codex 等)的技能:从代码/描述生成美观且「可验证」的架构图、工作流图、时序图、数据流图与生命周期图,支持主题切换与 PNG / SVG / WebP 导出。主打 architecture-as-code,项目站点 tt-a1i.github.io/archify,近 26 周有 16 周提交、维护活跃。

**看点**:与 DevOps 文档与评审强相关——架构图可纳入 PR / 流水线自动生成,配合 IaC 做「架构即代码」的可视化与漂移检查。相比手绘图,「可验证 + 可导出」让图随代码一起版本化,是文档左移的实用工具。

---

## 3. [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) ⭐ 45,000

**i-have-adhd — 让编码 agent「别把答案埋起来」的输出规范 Skill**

`Python` · Fork 2.6k · 创建于 05-13 · MIT · 本周 +17k star(本周涨幅第一)

一个 Claude Code 插件 / 技能:强制编码 agent 输出更聚焦、直给结论的「ADHD 友好」格式,减少冗长铺垫,把关键答案放在最前。本周新增 1.7 万 star,是全站增长最快的项目,标签涵盖 claude-code-plugin、claude-skills、developer-tools、productivity。

**看点**:本质是「agent 输出的信噪比治理」。在 agent 驱动的运维 / CI 场景里,日志与建议动辄刷屏,这类「先给结论、再给细节」的输出约束,对排障效率和自动化管道的可读性都有直接价值。

---

## 4. [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio) ⭐ 28,000

**VoiceStudio — 完全本地的 ElevenLabs 开源替代**

`Python` · Fork 3.4k · 创建于 04-09 · AGPL-3.0 · 本周 +7.8k star

自托管、完全本地运行的语音工作站:声音克隆、音色设计、视频配音、有声书生成等,支持 CUDA 与 MLX(Apple)加速,数据不出本机。位列 findarepo Self-Hosted 榜第 1,近 26 周持续提交(1,938 次),工程活跃度高,站点 voicestudio.sh。

**看点**:主打 local-first / 数据主权,契合 homelab 与「用可控软件替代 SaaS 订阅」的趋势。对 DevOps,重点在其容器化与 GPU 依赖的部署形态。注意 License 为 AGPL-3.0——若做二次开发或对外提供服务,需评估其网络分发条款的合规影响。

---

## 5. [google/artemis](https://github.com/google/artemis) ⭐ 4,200

**ARTEMIS — 自然语言驱动的 Android 端到端自动化/测试**

`Python` · Fork 349 · 创建于 08-13 · Apache-2.0 · 单日 +1.4k star

Google 开源的新项目(创建于 8 月中,本期最「新」的一个):把自然语言指令转成可靠的 Android 自动化,执行端到端工作流并自动抓取日志。标签含 test-automation、testing、ai-agents。单日新增 1.4k star(约占其总量的 32%),处于典型的「刚爆发」阶段,一周完整趋势数据仍在积累。

**看点**:与 CI/CD 关联最直接的一个——把「NL → 可靠 E2E 测试」引入移动端流水线,呼应「测试左移 + AIOps」。Apache-2.0 许可对企业友好、Google 背书,值得纳入移动测试自动化选型的观察名单;但项目尚新,稳定性与用例覆盖需持续跟踪。

---

## 今日趋势小结

本周 AI 开源三条主线:**① Agent 框架走向「插件化 / 运行时化」**——DeepSeek Harness 的「一切皆插件」与 Rust 写的 herdr(coding agent 运行时)都在把 agent 能力做成可组合单元,思路与 CI/CD 流水线高度一致;**② 「给编码 agent 装技能」的小而专 Skill 集中爆发**——archify(架构图)、i-have-adhd(输出规范)以极低门槛拿下超高周涨幅,Agent Skill 已成独立生态;**③ 本地优先与测试自动化并行升温**——VoiceStudio 的 fully-local 指向数据主权与自托管,google/artemis 的 NL 驱动 E2E 测试指向 AIOps 与测试左移。对 DevOps 方向,archify(架构即代码)与 artemis(E2E 测试自动化)最值得动手一试。

---
*数据来源:findarepo 每日快照(GitHub REST API) · 本文由每日定时任务自动生成*
