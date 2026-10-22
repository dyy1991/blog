---
title: "每日 GitHub 开源速报 · 2026-10-12"
date: "2026-10-12"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:anatomy、ARTEX、aurelio-finance、talorys、ai-newtab。Skill 分发、一键自托管部署与个人化 Agent 成为主线。"
---

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) ⭐ 3,511

**anatomy — 把技术概念画成交互式等轴测机器的 Agent Skill**

`JavaScript` · Fork 273 · 创建于 10-08 · MIT

一个 Claude Agent Skill:输入一个技术概念,它会"发明"一台物理机器来体现该概念的运行方式,并生成带实时读数的交互式 isometric 图,由 shaded SVG 组件构成,可选 WebGL shader 与 3D 动效。通过 `npx skills add wheresryan22/anatomy -g -a claude-code` 或 git clone 到 skills 目录安装,用 `/anatomy` 调用。

**看点**:用可视化讲解抽象概念,很适合做 CI/CD 流水线、容器网络这类原理的教学图;skill 以文件夹形式分发,易于版本化。

---

## 2. [mhtsec/ARTEX](https://github.com/mhtsec/ARTEX) ⭐ 3,174

**ARTEX — 多 LLM Agent 驱动的自主渗透测试系统**

`Go` · Fork 5,590 · 创建于 10-08 · AGPL-3.0

Go 后端内嵌 Next.js 前端,数据存 PostgreSQL。采用「探索图 + 资产图」双图架构,分别追踪任务目标/发现与域名、服务、端点等共享资产。提供 install.sh 一键安装、Docker Compose、预编译 Release 二进制等多种部署方式;README 提示官方 Docker 镜像来源已失效,需本地构建。原项目为中文,曾在百度 agent+ 攻防赛中获奖。

**看点**:单二进制 + Postgres 的形态对云原生很友好,但「镜像失效、需本地构建」恰好说明依赖外部镜像的供应链风险。安全工具务必只在获授权环境中使用。

---

## 3. [LosaLosSantos/aurelio-finance](https://github.com/LosaLosSantos/aurelio-finance) ⭐ 2,291

**aurelio-finance — 自托管的个人理财与 AI 顾问应用**

`Python` · Fork 288 · 创建于 10-06 · MIT

在本机运行,追踪账户、持仓、基金穿透、现金流与目标,数据保存在 `backend/data.db`。可选 AI 聊天通过 OpenRouter 接入(需自备 key),只提出修改建议,由用户确认。后端 Python(uv + uvicorn),前端 Node.js 22+,`./start.sh` 一键启动,并有 `--demo` 演示数据模式。

**看点**:README 未提供 Docker 化方案,这正是练习容器化与 CI 的好素材(写 Dockerfile、加 GitHub Actions);「AI 提议、人确认」的模式也值得借鉴。

---

## 4. [rociiu/talorys](https://github.com/rociiu/talorys) ⭐ 760

**talorys — 运行在自己 Cloudflare 账号里的个人 AI Agent**

`TypeScript` · Fork 57 · 创建于 10-10 · MIT

提供聊天、记忆、任务、笔记与定时提醒。前端 React + Vite 部署在 Cloudflare Pages,私有的 Hono Worker 加基于 Agents SDK 的 Durable Object(SQLite 存储)处理逻辑,调用 Workers AI,用 alarms 做调度;Worker 无公开 URL。执行 `npx create-talorys@latest` 即可一键部署。

**看点**:典型的 serverless / edge 云原生架构,一条命令完成 Worker、Durable Object、Pages 的 provisioning,是学习 IaC 式一键部署与零服务器运维的好案例。

---

## 5. [ThariqS/ai-newtab](https://github.com/ThariqS/ai-newtab) ⭐ 744

**ai-newtab — 由 Claude 根据浏览历史生成的每日新标签页**

`TypeScript` · Fork 72 · 创建于 10-08 · MIT

Chrome 扩展,用 AI Agent 根据你实际浏览的站点生成新标签页,并支持用自然语言调整内容与样式。需 Node.js 20+,用 pnpm 构建后以 unpacked 方式加载 `apps/extension/.output/chrome-mv3`,在新标签页填入 Anthropic API key 即可。

**看点**:构建流程是 pnpm + 产物目录的标准套路,易于接入 CI 自动打包扩展;同时它读取浏览历史并需要 API key,提醒我们关注密钥管理与隐私。

---

## 今日趋势小结

1. **Skill 继续成为 Agent 的分发形态**:anatomy 等项目以 skill 形式发布,文件加脚本即可版本化,并可接入 CI 做 lint 与测试。
2. **一键部署与自托管**:talorys 的 `npx` 一键上 Cloudflare、aurelio 的 `start.sh`,降低了门槛;但 ARTEX 的镜像失效也提醒要重视制品与供应链可靠性。
3. **Agent 走向个人化与本地化**:个人理财、个人助手、个性化新标签页都强调数据留在自己手里,「AI 提议、人确认」的人在回路模式与 CD 中的 manual approval 理念一致。

---

*本文由每日定时任务自动生成*
