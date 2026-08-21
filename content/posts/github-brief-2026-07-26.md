---
title: "每日 GitHub 开源速报 · 2026-07-26"
date: "2026-07-26"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近期新晋高 star 项目 Top 5:strix、codebase-memory-mcp、Vibe-Trading、ai-job-search、OfficeCLI。Agent 正在吃掉基础设施层,安全 agent 成为新热点。"
---

# 每日 GitHub 开源速报 · 2026-07-26

> 关键词:AI / LLM / Agent · 范围:近期新晋高 star 项目 · Top 5

---

## 1. [usestrix/strix](https://github.com/usestrix/strix) ⭐ ~41K

**Strix — 像真人红队一样工作的开源 AI 渗透测试 Agent**

`Python` · Fork ~4.3K · Apache-2.0

开源 AI 渗透测试工具,行为更像真正的安全研究员而非静态扫描器:动态测试应用、用 PoC 漏洞验证结果、内置 HTTP 代理、浏览器利用、Python 沙箱,并支持 CI/CD 集成。采用多 Agent 编排模拟专业红队流程。据来源统计每周约新增 7,000 star,增长曲线显示是安全团队真实采用,而非一时热度。

**看点**:直接切入 DevSecOps——把渗透测试塞进 CI/CD 流水线,而且强调「PoC 验证」而非制造一堆噪音告警,这正是 shift-left 安全落地时最缺的东西。用 agent 替代静态扫描器,值得在 pipeline 安全门禁上关注。

---

## 2. [DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) ⭐ ~32K

**codebase-memory-mcp — 给 AI coding agent 装上「代码库记忆」的 MCP 服务器**

`C` · MIT · 单静态二进制 / 零依赖

高性能代码智能 MCP(Model Context Protocol)服务器,把整个代码库索引成持久化知识图谱——函数、类、调用链、路由,基于 tree-sitter 覆盖 158 种语言,让 AI agent 不必反复扫描文件。结构化查询的 token 消耗最多可降 99%,连 Linux 内核这种巨型仓库也能在数分钟内建好索引。以单个静态 C 二进制分发,无依赖、纯本地运行,提供 15 个 MCP 工具。

**看点**:MCP 生态正在从「玩具」走向「基础设施」。对 CI/CD 而言,这类本地化、零依赖、可容器化的索引服务很容易塞进构建镜像,给流水线里的 AI 代码审查 / 生成环节提供确定性上下文,还顺带省 token 成本。

---

## 3. [HKUDS/Vibe-Trading](https://github.com/HKUDS/Vibe-Trading) ⭐ ~24K

**Vibe-Trading — 港大数据实验室的自然语言量化交易 Agent**

`Python` · MIT

香港大学 Data Science Lab 出品,把自然语言 prompt 转成回测、alpha 基准评测和(可选)经券商接口的实盘交易。内置 450+ 预置 alpha 因子(GTJA191、Qlib158、Alpha101 等因子库),采用 point-in-time 数据处理避免未来函数(lookahead bias),并有较严格的验证方法,区别于普通 AI 交易 bot。后端 FastAPI + ReAct agent,前端 Vite + React。

**注意**:维护者已声明有假冒代币冒用项目名,项目本身与任何「Vibe-Trading token」/ 钱包连接无关,切勿上当。

**看点**:虽是金融方向,但工程上很有借鉴意义——「自然语言 → 可复现回测 → 人工审批后才实盘」的分层设计,与 DevOps 里「AI 只做规划、危险操作留人工门禁」的思路一脉相承;point-in-time 数据处理也是数据流水线防「数据穿越」的经典范式。

---

## 4. [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) ⭐ ~13K

**ai-job-search — 跑在你自己机器上的 Claude Code 求职流水线**

`Python / Shell`(基于 Claude Code)· MIT · 默认分支 master

构建在 Claude Code 之上的求职自动化框架:评估 JD、按岗位定制 CV、生成求职信、准备面试,全流程本地运行、language/country 无关。Claude 会读取渲染后的页面并反复迭代 LaTeX,直到 CV 正好 2 页、求职信正好 1 页且签名可见、字体一致。依赖 Claude Code CLI、Python 3.10+、Bun、LaTeX 发行版(可选 pdftotext 做 ATS 检查)。单人开发,却因解决真实高频痛点迅速走红。

**看点**:一个「把 Claude Code fork 成个人专用 agent」的范本——本质是用 agent + 确定性工具链(LaTeX 排版、ATS 校验)编排出一条可复现的「个人流水线」,这套「AI 规划 + 传统工具执行 + 校验闭环」的思路,和你在 CI/CD 里做的事高度同构。

---

## 5. [iOfficeAI/OfficeCLI](https://github.com/iOfficeAI/OfficeCLI) ⭐ ~18K

**OfficeCLI — 专为 AI agent 打造的命令行 Office 套件**

`单二进制` · 宽松开源许可(permissive)

面向 AI agent 的免费开源 Office 套件,让 agent 直接读、写、自动化 Word / Excel / PowerPoint 文件,以单个二进制分发、无需安装 Office、零依赖、跨平台。用类 DOM 的路径系统操作 .docx / .xlsx / .pptx,「一行代码」即可让任意 agent 全面掌控三大 Office 格式。

**看点**:和本期 codebase-memory-mcp 同属「让日常格式对 agent 原生可读写」的基础设施流派——不追求酷炫,却最容易被悄悄嵌进大量自动化工作流。对做报表 / 文档自动生成的 pipeline 尤其实用:单二进制、无 GUI、无 Office 依赖,天然适合 headless 的 CI 环境。

---

## 今日趋势小结

本周(近期)AI 开源三条主线:**① Agent 正在吃掉「基础设施」层**——MCP 服务器(codebase-memory-mcp)、Office 自动化(OfficeCLI)这类「让 agent 原生读写真实资源」的底座密集上榜,比新模型更受关注;**② 安全 agent 成为新热点**——Strix 把渗透测试做成 CI/CD 里的自动红队,DevSecOps 味十足;**③ 「AI 规划 + 确定性工具执行 + 校验闭环」成为通用范式**——从 ai-job-search 的 LaTeX 排版流水线到 Vibe-Trading 的回测审批链,危险 / 关键操作始终留人工或确定性门禁。对 DevOps 方向,Strix 的流水线安全门禁与 codebase-memory-mcp 的可容器化上下文服务最值得细读。

---
*数据来源:WebSearch 聚合(GitHub Search API 当前不可直连)· star 数为近似值(以 `~` 标注)· 「近 7 天创建」过滤条件本次无法核验 · 生成时间:2026-07-26 · 本文由每日定时任务自动生成*
