---
title: "每日 GitHub 开源速报 · 2026-10-09"
date: "2026-10-09"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:answer-me-with-html、ARTEX、replica-skill、artex-ko、aurelio-finance。多 Agent 自主系统、Skill 分发与人在回路成为主线。"
---

# 每日 GitHub 开源速报 · 2026-10-09

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html) ⭐ 2,419

**answer-me-with-html — 用单页 HTML 回答复杂问题的 Agent Skill**

`JavaScript` · Fork 165 · 创建于 10-02 · MIT

让模型只写 Markdown 草稿,由内置 CLI 负责排版、主题与流程图绘制,生成可读的单页 HTML,支持图表、表格与布局。基于 Node.js 20+,把 `marked` 与 `@dagrejs/dagre` 打包进单个 `am.mjs` 脚本,可用于 Claude Code、Codex、Cursor、OpenCode 等 Agent。项目称输出 token 约减少 7 倍、速度快约 3.6 倍。

**看点**:「内容与渲染分离」的确定性渲染器,思路与 CI 中用模板生成报告一致;单文件产物很适合当作流水线的构建报告。

---

## 2. [mhtsec/ARTEX](https://github.com/mhtsec/ARTEX) ⭐ 1,758

**ARTEX — 多 LLM Agent 驱动的自主渗透测试系统**

`Go` · Fork 3,871 · 创建于 10-08 · AGPL-3.0

Go 后端内嵌 Next.js 前端,打成单个二进制,数据存 PostgreSQL。采用「探索图 + 资产图」双图设计,planner 与 worker Agent 协作,带人工审批关卡与共享 todolist,支持流量记录、ScopeSentry 资产同步与漏洞复测。作者声明仅限本地学习与研究。

**看点**:单二进制 + Postgres 的部署形态很云原生友好;其「人工审批关卡」可类比 CD 里的 manual approval。安全类工具务必只在获授权的环境中使用。

---

## 3. [Jakeschincariol/replica-skill](https://github.com/Jakeschincariol/replica-skill) ⭐ 1,202

**replica-skill — 逆向、重建并重塑 App 的 11 个 Claude skills**

`Python` · Fork 155 · 创建于 10-03 · MIT

11 个 skills 按顺序运行,从 reverse-engineering、规划、设计、开发、测试到上线,含 parity 打分、review 分析与 brand sweep(原品牌名未清除则阻止部署)。工具仅用 Python 标准库,无网络访问与 pip 依赖,示例技术栈为 Next.js、Postgres、Stripe、Playwright。

**看点**:把产品克隆拆成顺序阶段,类似多阶段 pipeline;brand sweep 阻断部署的做法就是一道典型的 CI quality gate。使用时需注意版权与合规边界。

---

## 4. [jiwoochris/artex-ko](https://github.com/jiwoochris/artex-ko) ⭐ 810

**artex-ko — ARTEX 的韩语本地化版本**

`Go` · Fork 656 · 创建于 10-03 · AGPL-3.0

对 ARTEX 的韩文本地化,定位为在获授权环境中提升防御与检测能力。架构一致:Go 单二进制后端内嵌 Next.js,PostgreSQL 存储,基于 norma SDK 的 Agent,兼容 Anthropic 或 OpenAI 的 LLM,通过 Docker Compose 部署。

**看点**:与 #2 属同一项目的 fork 生态,Docker Compose 一键部署便于在实验环境快速复现;可观察上游更新如何同步到本地化分支。

---

## 5. [LosaLosSantos/aurelio-finance](https://github.com/LosaLosSantos/aurelio-finance) ⭐ 730

**aurelio-finance — 自托管的财富管理与理财规划应用**

`Python` · Fork 95 · 创建于 10-06 · MIT

数据保存在本机 `data.db`,可选 AI 顾问(经 OpenRouter 接入模型)。功能包括银行与券商持仓跟踪、行情定价、基金穿透(国家/行业/币种敞口)、现金流与目标管理,聊天助手提出修改需用户确认。后端 Python(uv + uvicorn),前端 npm,带 GitHub Actions CI。

**看点**:典型的 self-hosted 小型应用,使用 uv 与 GitHub Actions,是练习容器化与 CI 的好素材;「AI 提议、人确认」的模式值得借鉴。

---

## 今日趋势小结

1. **自主 Agent 进入安全领域**:ARTEX 及其韩语 fork 合计 Fork 数极高,说明社区对可本地部署的多 Agent 系统兴趣强烈,同时也要注意合规使用。
2. **Skill 成为分发形态**:answer-me-with-html 与 replica-skill 都以 skill 形式提供,文件加脚本的形态可版本化,并接入 CI 做 lint 与测试。
3. **人在回路成为标配**:ARTEX 的审批关卡、aurelio 的「提议后确认」,与 CD 流水线中的 manual approval 理念一致。

---

*本文由每日定时任务自动生成*
