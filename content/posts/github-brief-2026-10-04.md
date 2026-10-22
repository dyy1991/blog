---
title: "每日 GitHub 开源速报 · 2026-10-04"
date: "2026-10-04"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:AIHOT、coucou、OpenDots、dots、yomiyasu。Agent 周边的监控审批、隔离环境与自动化内容流水线持续升温。"
---

# 每日 GitHub 开源速报 · 2026-10-04

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT) ⭐ 5,578

**AIHOT — 自己找热点、自己写日报的行业热点站框架**

`TypeScript` · Fork 1,456 · 创建于 09-28 · MIT

开源的行业热点站框架:从 RSS、网页抓取、JSON API、社交账号等六类信源采集内容,用 LLM 做过滤与双重打分,生成中文标题和摘要,把相关报道聚类成事件并按信源多样性排热度,自动产出日报/周报/月报。技术栈为 Node.js 24 + TypeScript + Fastify + React SSR + PostgreSQL,Docker Compose 一键启动,文档涵盖生产部署、HTTPS 与 API 成本控制。

**看点**:连续多期登顶。「采集 → AI 筛选 → 日报」本质是定时 pipeline,Docker Compose + 任务队列的形态很适合 DevOps 学习者拆解部署、调度与成本治理。

---

## 2. [Louis-CFM/coucou](https://github.com/Louis-CFM/coucou) ⭐ 3,291

**Coucou — 住在 macOS 刘海里的 coding agent 监视小伙伴**

`Swift` · Fork 509 · 创建于 09-27 · MIT

常驻刘海(macOS)或屏幕顶部(Windows/Linux)的动画角色 Mochi,实时展示 Claude Code、Codex、Cursor、Gemini CLI 等 agent 正在读、改、执行什么,可直接审批权限请求、跳转终端、拖拽文件并内置聊天,还集成 Stripe、GitHub、Vercel 等服务。无 telemetry、无账号,密钥存放于 Keychain,Swift 6 + SwiftUI 零依赖。

**看点**:长任务 agent 需要「人在回路」的审批入口;与 GitHub、Vercel 的集成也让 CI/CD 通知与部署审批有了想象空间。

---

## 3. [CopilotKit/OpenDots](https://github.com/CopilotKit/OpenDots) ⭐ 2,801

**OpenDots — 可跨文字、通话与 Slack 工作的常驻 AI 同事模板**

`TypeScript` · Fork 352 · 创建于 09-29 · MIT

用于构建持久化 AI agent(「Dots」)的开源模板:每个 agent 拥有独立的计算环境、浏览器 profile 与文件,支持协作文档空间 Spaces、保存前人工审批、Slack 与语音通话集成。基于 CopilotKit runtime、AG-UI 与 TanStack AI,Node.js 24 自托管,可本地或 Docker 运行。

**看点**:agent 的隔离环境、权限与审批、渠道集成拆成独立服务,是典型的云原生多服务形态,适合从部署与权限模型角度细读。

---

## 4. [feder-cr/dots](https://github.com/feder-cr/dots) ⭐ 2,584

**dots — 拥有自己浏览器、不会被拦截的 AI web agent**

`Python` · Fork 436 · 创建于 09-29 · MIT

把 C++ 层打过补丁的真实 Firefox 引擎与任意 OpenRouter 模型结合:同一 seed 下指纹稳定,不暴露 WebDriver 标志,模拟人类鼠标与键盘节奏,支持 profile 持久化与代理。用 uv 一行命令启动,本地 Web 界面查看,也可通过 MCP 接入 Claude Code、Gemini CLI。

**看点**:web agent 的反检测之争进入「引擎级」,需留意合规与服务条款风险;对 DevOps 而言,端到端测试与爬取场景的 bot 检测边界也在变化。

---

## 5. [nanaism/yomiyasu](https://github.com/nanaism/yomiyasu) ⭐ 1,348

**yomiyasu — 把 AI 生成的日语润色成自然日语的 Agent Skill**

`Python` · Fork 29 · 创建于 09-30 · MIT

面向 Codex、Claude Code、Cursor 的 Agent Skill,按七条结构化原则(恢复主谓宾、去除隐喻、避免非生物主语、控制句长等)改写生硬的 AI 日语,并附带 `yomiyasu_lint.py` 量化「AI 味」。通过 `npx skills add nanaism/yomiyasu` 安装,可指定 tech / business / essay 领域。

**看点**:Skill 以「文件 + lint 脚本」形式分发,可像代码一样版本化,lint 也可接入 CI 作为文本质量门禁。

---

## 今日趋势小结

1. **Agent 基础设施层继续补全**:监控审批(coucou)、隔离环境(OpenDots)、反检测浏览器(dots)都围绕 agent 落地展开。
2. **自动化内容流水线**:AIHOT 的「采集 → AI 筛选 → 发布」与定时任务 + CI 发布思路一致,Docker Compose + 队列最值得细读。
3. **人在回路与可分发的 Skill**:coucou、OpenDots 的审批机制对发布门禁设计有借鉴意义,yomiyasu 则展示了 Skill + lint 的工程化分发方式。

---

*本文由每日定时任务自动生成*
