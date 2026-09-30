---
title: "每日 GitHub 开源速报 · 2026-09-29"
date: "2026-09-29"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:AIHOT、magpie、jevgrep、golive-skill、onetake。AIHOT 创建一天即登顶,Agent Skill 与「人工批准 + 只读校验」成为本期共同主题。"
---

# 每日 GitHub 开源速报 · 2026-09-29

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT) ⭐ 2,149

**AIHOT — 自己找热点、自己写日报的 AI 行业热点站框架,创建仅一天登顶**

`TypeScript` · Fork 616 · 创建于 09-28 · MIT

一个「自动采集信源 → LLM 筛选 → 事件聚类 → 发布日报」的网站框架。支持 RSS、网页列表、JSON API、社交媒体和自定义脚本多种采集方式,用双评分机制加可配置阈值做精选,并按「独立信源数量」而非文章条数计算热度。产出日报、周报、月报,附 AI 生成的中文标题与摘要。技术栈为 Node.js 24、TypeScript、Fastify、React SSR、PostgreSQL、Tailwind,通过 Docker Compose 一键部署,兼容 DeepSeek、Qwen、智谱等 OpenAI 兼容接口。

**看点**:所有行业定制都收敛在 `industry/` 目录(信源、prompt、筛选标准),核心代码不动——这是典型的「配置与代码分离」设计,换个行业只需换配置。`docker compose up -d` 即可跑起来,很适合作为练手项目:用 GitHub Actions 定时构建镜像、部署到自己的云主机,顺便还能练习 PostgreSQL 数据卷备份与 secrets 管理。创建一天即 616 fork,说明「自己部署一个」的需求很强。

---

## 2. [yetone/magpie](https://github.com/yetone/magpie) ⭐ 1,794

**Magpie — 统一管理多款 Agent CLI 模型配置的菜单栏工具 + 本地网关**

`Go` · Fork 106 · 创建于 09-23 · MIT

在一个界面里查看并切换 Claude Code、Codex、Gemini CLI、OpenCode 等本机 Agent 工具各自使用的模型(例如 Codex 接 DeepSeek、Claude Code 接 Kimi)。内置本地网关在 OpenAI、Anthropic、Google 几种 API 规范之间做协议翻译,编辑配置文件时保留原有注释和格式,并支持配置快照(profile)快速切换,目录覆盖 20+ 模型供应商,可复用已登录应用的凭证而无需重复保存 Key。桌面端基于 Wails,体积小于 15MB,支持 macOS、Linux、Windows。

**看点**:连续多期上榜,相比昨日 1,432 star 又涨约 25%,依然是增速最快的项目。「本地网关做协议互译」本质是一个 Sidecar/API Gateway,与微服务里的协议转换同构;profile 快照则相当于给开发环境做「配置即代码」的版本化,团队统一 Agent 开发环境时可以借鉴。

---

## 3. [dzhng/jevgrep](https://github.com/dzhng/jevgrep) ⭐ 1,573

**jevgrep — 用自然语言按「代码做什么」检索代码的 Agent 专用 CLI**

`TypeScript` · Fork 102 · 创建于 09-26 · MIT

面向 coding agent 的检索工具:直接问「这段仓库行为在哪里实现」,它借助 Jev 模型一次性返回相关文件位置、阅读线索和带行号的源码片段。支持 Python 与 TypeScript/JavaScript 的声明解析,遵循 ignore 文件并过滤敏感内容,并附带可安装给 Claude Code 等助手的 agent skill。通过 `npm install -g @dzhng/jevgrep` 安装,需配置 Vercel AI Gateway、TypeSafe 或 OpenRouter 凭证,目前仅支持 macOS 和 Linux。

**看点**:把「定位相关代码」从 Agent 主任务中拆成独立、可复用的 CLI 步骤,这种细粒度工具链拆分,对把 AI 接入 CI/CD 流水线(例如让它在 PR 里先定位影响范围再评审)很有参考价值;遵循 ignore 文件、过滤敏感内容也是接入流水线时必须考虑的安全边界。

---

## 4. [mikehasa/golive-skill](https://github.com/mikehasa/golive-skill) ⭐ 1,077

**golive-skill — 让 Agent 做的产品「一键上线」的开源 Agent Skill + Node CLI**

`TypeScript` · Fork 78 · 创建于 09-23 · MIT

覆盖托管、数据库、域名、邮件、支付的上线流程,全部使用你自己的账号。流程为 detect → plan → approve → apply → verify:先检测应用需求并生成基础设施计划,经你批准后才执行变更,再做验证检查。会记录所创建的资源以便做漂移检测(`golive status`),并可用 `golive teardown` 拆除。凭证只保存在本地,不集中存储。依赖 Node.js 20+,集成 Codex、Claude Code,支持 Vercel、Netlify、Supabase、Neon、Stripe、Resend 等供应商。

**看点**:对 DevOps 学习者最贴近的一个:它把「计划 → 审批 → 应用 → 验证 → 漂移检测 → 销毁」这套 Terraform 式的基础设施生命周期,包装成 Agent 可执行的 Skill。「变更前必须人工批准、上线后只读校验」正是 CD 流水线里审批环节和 post-deploy verification 的思路,值得对照自己的部署流程。

---

## 5. [feitangyuan/onetake](https://github.com/feitangyuan/onetake) ⭐ 908

**onetake — 一镜到底的产品发布/功能演示动效影片 Claude Agent Skill**

`Python` · Fork 58 · 创建于 09-26 · NOASSERTION(PolyForm Noncommercial 1.0.0)

用来生成「从不切到下一页」的产品发布片:每个节拍都从上一个自然生长出来,全程单一连续镜头,并通过一个「oracle」量化连续性,不达标的合成会被自动驳回。真实 UI 用 HTML 重建以便任意缩放运镜,带运动模糊、确定性渲染和音效同步,可由 1080p30 草稿产出 4K60 成片。依赖 Python(Playwright、NumPy、OpenCV 等)、FFmpeg 与 Node.js,安装到 `~/.claude/skills/onetake/` 后用自然语言提需求即可。

**看点**:license 为 PolyForm Noncommercial,仅限个人/教育用途,GitHub 显示为 NOASSERTION,商用前务必留意。「确定性渲染 + 自动验证器驳回不合格产出」的流程,和 CI 里的质量门禁(quality gate)是同一种思路;草稿低分辨率、成片高分辨率的两阶段也类似流水线里的快速检查与完整构建分层。

---

## 今日趋势小结

**① 榜单大换血:09-21 创建的 jev-chat-jarvis、unreal-agent 移出 7 天窗口,AIHOT 创建一天即以 2,149 star 登顶。** 滚动窗口不断淘汰旧热点,新项目凭「可自己部署」的实用性迅速爆发,fork 数(616)甚至高于不少老牌榜上项目。

**② Agent Skill 成为分发新形态:golive-skill、onetake、jevgrep 都提供了装进 Claude Code / Codex 的 skill。** 一个项目 = 一套可复用的 Agent 能力包,并配套独立 CLI,这与把流水线步骤封装成可复用 Action / Shared Library 的思路一致。

**③ 「人工批准 + 只读校验」继续是高风险自动化的通用范式。** golive-skill 的 plan/approve/apply/verify 与 onetake 的自动驳回验证器,都把不可逆或高成本操作卡在显式检查点,设计 CI/CD 审批门禁时可直接借鉴。

---
*数据来源:GitHub Search API · 本文由每日定时任务自动生成*
