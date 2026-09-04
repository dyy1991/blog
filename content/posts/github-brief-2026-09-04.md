---
title: "每日 GitHub 开源速报 · 2026-09-04"
date: "2026-09-04"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天高热项目 Top 5:deepseek-harness、orca、pi、scientific-agent-skills、OpenMAIC。Agent 运行时层成为新战场,「技能即分发格式」兴起。"
---

# 每日 GitHub 开源速报 · 2026-09-04

> 关键词:AI / LLM / Agent · 范围:近 7 天高热 / 新晋高 star 项目 · Top 5

---

## 1. [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) ⭐ ~211,000

**DeepSeek Harness — 「一切皆插件」的开源 Agent 运行时**

`TypeScript` · Fork ~8,800 · 创建于 08-13 · MIT

DeepSeek 随 V4-Pro 一同开源的 agent harness,把 agent 的每一层——模型适配器、工具注册表、会话日志、沙箱、交互界面,乃至 agent loop 本身——都做成可从配置替换的插件,定位为 Claude Code 的开源对手。发布首日约 2.75 万 star,两天冲到 9.5 万,近 8 天仍以约 +1.1 万 star 的速度领跑,是本周星速第一的项目。设计理念是把「运行时」抬到「模型」之上:换模型、换工具、换执行后端都不动主干代码。

**看点**:插件化 harness 正好对应 CI/CD 的可插拔 pipeline 思维——把 agent 拆成可替换单元后,权限、审计、沙箱都能各自独立治理。对 DevOps 而言,这是把 agent 纳入受控交付链的一种范式。

---

## 2. [stablyai/orca](https://github.com/stablyai/orca) ⭐ ~16,000+(本周高速增长)

**Orca — 并行 Agent 舰队的开发环境(ADE)**

`TypeScript` · 创建于 —(近期) · MIT

面向「一次跑一支 coding agent 舰队」的开发环境,用 git worktrees 隔离每个 agent 的工作区,支持 Claude Code、Codex、Grok、Gemini、Cline、Cursor 等 20+ CLI agent,可在桌面、移动端和 VPS 上运行。不需要 Orca 账号,自带订阅即可用;本周单日新增约 +812 star。核心卖点是并行编排与工作区隔离——多个 agent 同时改代码而互不污染。

**看点**:git worktree 做并行隔离 + VPS 远程执行,本质上就是「给 agent 造一套 CI runner 池」。对 DevOps 学习者,这是理解「如何安全地并行调度多个自动化 agent」的好样本。

---

## 3. [earendil-works/pi](https://github.com/earendil-works/pi) ⭐ ~12,600

**pi — 统一 LLM API + agent loop + TUI + coding CLI 一体工具箱**

`TypeScript` · 创建于 —(近期) · MIT

把「多provider 统一 LLM API(OpenAI / Anthropic / Google 等)+ agent 运行时(工具调用、状态管理)+ TUI + coding agent CLI」打包进一个 monorepo,同时提供 CLI 和 SDK 两种接口。9 月 3 日仍在活跃更新,约 10 万行 TypeScript。对想自建 agent 而不想被单一模型厂商锁定的团队,提供了一层薄而完整的抽象。

**看点**:统一 LLM 网关 + 可编程 agent loop,是把「模型可替换」落到工程层的典型做法;和 harness 的插件化异曲同工,适合作为自建内部 agent 平台的起点参考。

---

## 4. [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills) ⭐ ~34,000

**Scientific Agent Skills — 把任意 Agent 变成「AI 科学家」的技能库**

`—` · 创建于 —(2026 上半年) · MIT

号称第一大科学 Agent Skills 库:165 个经验证的 skill + 100+ 科学数据库,覆盖生物、化学、医学、药物发现,兼容 Cursor、Claude Code、Codex 及开放 Agent Skills 标准。近日单日 +1,980 star,是本周「技能即分发格式」趋势的代表——把领域工作流封装成可组合、跨模型的 skill 包,而非又一个大模型。

**看点**:skill 作为「小而可组合的能力单元」正在成为 agent 生态的默认分发方式,类似 DevOps 里把能力封装成可复用 Action/Chart。对个人开发者,这是低门槛给 agent 加专业能力的路径。

---

## 5. [THU-MAIC/OpenMAIC](https://github.com/THU-MAIC/OpenMAIC) ⭐ ~26,000

**OpenMAIC — 清华开源的多 Agent 互动课堂**

`TypeScript` · Fork ~4,100 · 创建于 —(v0.3.0 于 06-28 转 MIT) · MIT

清华 THU-MAIC 团队出品,把任意主题或文档一键变成沉浸式互动课堂:多 agent 编排自动生成幻灯片、测验和互动环节,多个不同人设的 agent 就主题展开讨论,并配白板讲解。本周持续在 GitHub Trending 上,单日 +1,255 star。是「多 agent 应用层」而非基础设施层的代表作。

**看点**:多 agent 协作从 demo 走向可用产品;对内容型 / 教学型团队,「一句话生成整门课」的编排思路值得借鉴,也说明 agent 编排正在向垂直应用渗透。

---

## 今日趋势小结

本周 AI 开源三条主线:**① Agent 运行时层成为新战场**——DeepSeek Harness 的插件化、Orca 的并行舰队、pi 的统一网关都在争夺「coding agent 如何被部署、编排、接工具」的定义权;**② 「技能即分发格式」兴起**——scientific-agent-skills 等把领域能力封装成可组合、跨模型的 skill 包,成为给 agent 加能力的默认方式;**③ 多 agent 从 demo 走向垂直应用**(OpenMAIC 的互动课堂)。对 DevOps 方向,Orca 的「git worktree 隔离 + VPS 执行」最值得细读——它几乎就是「给 agent 造一套 CI runner 池」的雏形,而 harness 的插件化则对应可插拔 pipeline 的治理思路。

---
*数据来源:因 GitHub Search API 在沙盒环境不可直连,本期改用本周 GitHub Trending 榜单 + 各仓库公开信息交叉核对,按「本周 star 星速 / 新晋热度」而非严格创建日期筛选;star / fork 为近似值,标 ~ 者尤是。*

*本文由每日定时任务自动生成。*
