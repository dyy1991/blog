---
title: "每日 GitHub 开源速报 · 2026-10-03"
date: "2026-10-03"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:AIHOT、coucou、dots、jevgrep、OpenDots。Agent 基础设施、审批与隔离浏览器成为本周主线。"
---

# 每日 GitHub 开源速报 · 2026-10-03

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT) ⭐ 5,040

**AIHOT — 自己找热点、自己写日报的行业热点站框架**

`TypeScript` · Fork 1,373 · 创建于 09-28 · MIT

开源的行业热点站框架:从 RSS、网页、JSON API、X 账号、微信等六类信源采集内容,用 LLM 做过滤与双重打分,生成中文标题和摘要,把相关报道聚类成事件并按信源多样性排热度,发布日报/周报/月报。换掉信源和精选标准即可变成任意行业热点站。技术栈 Node.js 24 + Fastify + React SSR + PostgreSQL + pg-boss,Docker Compose 一键部署,并提供公开 API、RSS 与 MCP。

**看点**:连续两期登顶。「采集 → AI 筛选 → 日报」本质是定时 pipeline,Docker Compose + 任务队列的形态很适合 DevOps 学习者拆解部署与调度。

---

## 2. [Louis-CFM/coucou](https://github.com/Louis-CFM/coucou) ⭐ 3,079

**Coucou — 住在 macOS 刘海里的 Claude Code 监视小伙伴**

`Swift` · Fork 477 · 创建于 09-27 · MIT

常驻刘海(macOS)或屏幕顶部(Windows/Linux)的动画角色 Mochi,实时监控 Claude Code 会话的每一步,可一键审批权限请求、回答问题、拖拽文件并内置聊天,还集成 Stripe、GitHub、Vercel、n8n、Notion 等。无 telemetry,macOS 15+ 可用 XcodeGen 自行构建。

**看点**:长任务 agent 需要「人在回路」的审批入口;与 GitHub、Vercel 的集成也有 CI/CD 通知与部署审批的想象空间。

---

## 3. [feder-cr/dots](https://github.com/feder-cr/dots) ⭐ 2,565

**dots — 拥有自己浏览器、不会被拦截的 AI web agent**

`Python` · Fork 434 · 创建于 09-29 · MIT

把打过补丁的真实 Firefox 引擎与任意 OpenRouter 模型结合:同一 seed 下指纹稳定,不暴露 WebDriver 标志,模拟人类鼠标与键盘节奏,支持 profile 持久化与代理。用 uv 安装,本地 Web 界面展示对话和实时浏览器画面,也可通过 MCP server 接入 Claude Code、Gemini CLI 等。

**看点**:web agent 的反检测之争进入「引擎级」,需留意合规与服务条款风险;对 DevOps 而言,端到端测试/爬取场景的 bot 检测边界也在变化。

---

## 4. [dzhng/jevgrep](https://github.com/dzhng/jevgrep) ⭐ 2,089

**jevgrep — 按「代码做了什么」来找代码的 CLI**

`TypeScript` · Fork 136 · 创建于 09-26 · MIT

给 coding agent 用的命令行工具 `jg`:用自然语言提问(如「请求到达 handler 前在哪里做鉴权」),返回相关文件、摘要、阅读线索和带行号的代码片段。支持 Python 与 TS/JS,尊重 .gitignore 并过滤敏感数据。npm 全局安装(Node.js 22+),`jg auth` 配置凭据,`jg skill` 安装 agent skill。

**看点**:语义代码检索正在补充 grep 式搜索;在 CI 中让 agent 先检索再改动,有助于控制 token 开销。

---

## 5. [CopilotKit/OpenDots](https://github.com/CopilotKit/OpenDots) ⭐ 1,777

**OpenDots — 可跨网页、Slack、语音工作的常驻 AI 同事模板**

`TypeScript` · Fork 220 · 创建于 09-29 · MIT

用于构建持久化 AI agent(「Dots」)的开源模板:每个 agent 有独立浏览器 profile 和文件系统,提供协作文档空间 Spaces、保存前人工审批流、Slack 与语音通话集成及细粒度工具权限。基于 CopilotKit runtime、AG-UI 与 TanStack AI,Node.js 24 自托管,提供应用与浏览器服务的 Docker 容器。

**看点**:agent 的隔离浏览器、权限与审批、后台调度拆成独立服务,是典型的云原生多服务形态,值得从部署与权限模型角度细读。

---

## 今日趋势小结

1. **Agent 基础设施层继续补全**:监控审批(coucou)、代码检索(jevgrep)、隔离浏览器(dots、OpenDots)都围绕 agent 落地。
2. **自动化内容流水线**:AIHOT 的「采集 → AI 筛选 → 发布」与定时任务 + CI 发布思路一致,Docker Compose + 队列最值得细读。
3. **人在回路与权限控制成为共识**:coucou 的一键审批、OpenDots 的保存前审批与细粒度权限,对 DevOps 的发布门禁设计有借鉴意义。

---

*本文由每日定时任务自动生成*
