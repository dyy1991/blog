---
title: "每日 GitHub 开源速报 · 2026-09-30"
date: "2026-09-30"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:AIHOT、magpie、jevgrep、golive-skill、onetake。AIHOT 与 magpie 两天内 star 大涨,Agent Skill 与「先批准再执行」的审批范式持续升温。"
---

# 每日 GitHub 开源速报 · 2026-09-30

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT) ⭐ 3,738

**AIHOT — 自己找热点、自己写日报的 AI 行业热点站框架,创建两天 star 破 3.7k**

`TypeScript` · Fork 1,068 · 创建于 09-28 · MIT

一个「自动采集信源 → LLM 双重评分筛选 → 事件聚类 → 发布日报」的网站框架。支持 RSS、网页列表、JSON API、X 账号、微信公众号六类信源,按「独立信源数量」而非文章条数计算热度,并生成中文标题与摘要。技术栈为 Node.js 24、TypeScript、Fastify、React、PostgreSQL,通过 Docker Compose 一键部署,只需提供 OpenAI 兼容的 API Key。

**看点**:行业定制(信源、评分 prompt)与核心代码分离,换行业只换配置。`docker compose up` 即可运行,很适合作为 CI/CD 练手项目:用 GitHub Actions 构建镜像并部署到自己的主机,顺便练习 PostgreSQL 数据卷备份与 secrets 管理。较昨日 2,149 star 增长约 74%,fork 已破 1,000。

---

## 2. [yetone/magpie](https://github.com/yetone/magpie) ⭐ 3,349

**Magpie — 统一管理多款 Agent CLI 模型配置的菜单栏工具 + 本地网关**

`Go` · Fork 196 · 创建于 09-23 · MIT

在一个界面里查看并切换 Claude Code、Codex、Gemini CLI、OpenCode 等 12+ 款本机 Agent 工具所用的模型(例如 Codex 接 DeepSeek、Claude Code 接 Kimi)。内置本地 API 网关,兼容 OpenAI Chat Completions、OpenAI Responses 与 Anthropic Messages 三种协议,抹平厂商差异。基于 Go + Wails,桌面端体积小于 15MB,也提供 TUI 与 CLI,可用安装脚本或 `make build` 安装。

**看点**:连续多期上榜,较昨日 1,794 star 再涨约 87%。「本地网关做协议互译」本质是 Sidecar / API Gateway 模式,与微服务里的协议转换同构;同时把 Agent 开发环境的模型配置集中管理,团队统一开发环境时可以借鉴「配置即代码」的思路。

---

## 3. [dzhng/jevgrep](https://github.com/dzhng/jevgrep) ⭐ 1,829

**jevgrep — 用自然语言按「代码做什么」检索代码的 Agent 专用 CLI**

`TypeScript` · Fork 119 · 创建于 09-26 · MIT

面向 coding agent 的代码检索工具:直接问「某个行为在仓库哪里实现」,借助 Jev 模型返回相关文件与源码上下文。基于 TypeScript + Bun,以 npm 包发布(需 Node.js 22+),`npm install -g @dzhng/jevgrep` 安装后用 `jg auth`、`jg skill` 接入 Agent。README 给出的 SWE-bench 子集评测显示,可将 coding agent 任务成本降低约 40%。

**看点**:把「定位相关代码」从 Agent 主任务中拆成独立、可复用的 CLI 步骤,这种细粒度工具拆分对把 AI 接入 CI/CD 流水线(例如在 PR 里先定位影响范围再评审)很有参考价值,同时也要注意接入流水线时的凭证与敏感内容边界。

---

## 4. [mikehasa/golive-skill](https://github.com/mikehasa/golive-skill) ⭐ 1,130

**golive-skill — 让 Agent 做出的产品一键上线:托管、数据库、域名、邮件、支付全用你自己的账号**

`TypeScript` · Fork 84 · 创建于 09-23 · MIT

一个开源 Agent Skill,自动完成 Agent 构建的应用上线流程:检测应用所需资源、规划基础设施变更、请求用户批准、用你自己的凭证执行、最后验证结果。目前支持 Vercel / Netlify 托管,Supabase / Neon 数据库,Porkbun / GoDaddy DNS,Resend 邮件、Stripe 测试模式支付,以及 Supabase 认证。无托管后端、无产品遥测,并可事后生成资源归属文档或拆除资源。

**看点**:典型的 DevOps 场景 Agent 化——plan → approve → apply → verify 的流程与 Terraform 的 plan/apply 及 CI/CD 里的审批门禁如出一辙。「所有资源在你自己的账号下」的设计也避免了平台锁定,值得研究其权限最小化与 teardown 思路。

---

## 5. [feitangyuan/onetake](https://github.com/feitangyuan/onetake) ⭐ 1,014

**onetake — 一镜到底的动效影片 Agent Skill,每个镜头都从上一个自然生长出来**

`Python` · Fork 64 · 创建于 09-26 · NOASSERTION(仅限非商用)

一个 Claude Agent Skill,用来生成「连续镜头」风格的发布视频:用 HTML 重建真实 UI 以便自由运镜,采用可度量的缓动曲线,通过多采样渲染获得真实运动模糊,并带有为「镜头连续性」打分的自动验证器。技术栈为 Python(Playwright、NumPy、SciPy、Pillow)加 Node.js 合成与 FFmpeg 输出,可产出 1080p30 草稿或 4K60 成片。

**看点**:「渲染 → 自动打分验证 → 驳回重做」的闭环,本质是把质量门禁嵌进生成流水线,思路与 CI 中的自动化检查一致;确定性渲染(同输入同输出)也利于在流水线里复现。注意其许可证为非商用,引入前需确认。

---

## 今日趋势小结

**① AIHOT 与 Magpie 双双暴涨:两天内分别增长约 74% 和 87%。** 「能自己部署」「能统一管理已有工具」的实用型项目最容易爆发,AIHOT 的 fork 数已突破 1,000,远高于其余项目。

**② Agent Skill 继续成为分发新形态:golive-skill、onetake、jevgrep 都提供可装进 Claude Code / Codex 的 skill。** 一个项目就是一套可复用的 Agent 能力包,与把流水线步骤封装成可复用 Action / Shared Library 的思路一致。

**③ 「先规划、人工批准、再执行、最后验证」成为高风险自动化的通用范式。** golive-skill 的 plan/approve/apply/verify 与 onetake 的自动验证器,都把不可逆或高成本操作卡在显式检查点,设计 CI/CD 审批门禁时可直接借鉴。

---
*数据来源:GitHub Search API · 本文由每日定时任务自动生成*
