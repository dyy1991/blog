---
title: "每日 GitHub 开源速报 · 2026-09-28"
date: "2026-09-28"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:jev-chat-jarvis、unreal-agent、magpie、golive-skill、jevgrep。ZCode 因超出 7 天窗口退出榜单,Magpie 单日涨幅超 25% 领跑增速,多个项目不约而同在解决\"多 Agent 工具统一管理\"这一共同痛点。"
---

# 每日 GitHub 开源速报 · 2026-09-28

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [jev-chat/jev-chat-jarvis](https://github.com/jev-chat/jev-chat-jarvis) ⭐ 6,841

**Jev 聊天助手 — 手机端「对话副驾」,连续三期上榜,增速持续领跑**

`Kotlin` · Fork 1,174 · 创建于 09-21 · MIT

已连续第三次入选(09-23、09-27、今日),一天内星标从 6,724 涨到 6,841,fork 从 1,158 涨到 1,174,增速虽较此前放缓但仍保持在榜首。核心链路不变:无障碍服务读取 QQ / X / 飞书屏幕内容 → 判断模型给意图、风险等级(1-9)、是否需立即回复打分 → 生成模型起草三条候选回复并排序 → 仅通过 `ACTION_SET_TEXT` 填入输入框,失败退化为剪贴板,不自动发送。微信因无障碍限制已在 1.4 版本停止支持,飞书依赖离线 OCR 兜底非标准渲染文本。

**看点**:项目坚持"只读屏幕、不 hook、不自动发送"的最小权限边界,并把这一约束写进 README 首屏,这是 AI 工具争取企业合规评审的常见文档模式。三天前的加速增长到今天转为平稳爬升,是观察一个新项目从"爆发期"进入"稳定期"的典型样本。

---

## 2. [unreallabsai/unreal-agent](https://github.com/unreallabsai/unreal-agent) ⭐ 2,004

**Unreal Agent — 异步优先的 Agent 编排框架,持续小幅增长**

`Go` · Fork 108 · 创建于 09-21 · MIT

连续第二期上榜,一天内从 1,974 star / 104 fork 涨到 2,004 / 108,增速平稳。架构分层清晰:协调器(Coordinator)管理单次 LLM turn 并分发操作;会话存储(Session Store)是只追加的持久化历史,支持 fork;上下文构建器(Context Builder)不做任何 I/O;工具注册表内置 Bash、ViewImage、skill-use 等;操作管理器(Operation Manager)承载可持久化的异步长任务运行时。项目按 `harness/`(核心库)、`cmd/`(可执行工具)、`benchmarks/`(性能测试)组织代码,并支持替换默认实现(例如把操作管理器换成代理到远程沙箱的版本)。

**看点**:「同步组装上下文 + 异步执行操作 + 可替换运行时」的分层设计,与消息队列/工作流引擎的标准范式高度一致,只是把「任务」换成了「模型工具调用」——这对做平台工程或 CI/CD 编排系统的人来说是可以直接复用的架构参考。

---

## 3. [yetone/magpie](https://github.com/yetone/magpie) ⭐ 1,432

**Magpie — 统一管理多款 Agent CLI 模型配置的菜单栏工具 + 本地网关,涨幅最快**

`Go` · Fork 88 · 创建于 09-23 · MIT

本期涨幅最猛的项目:相比昨日的 1,137 star / 64 fork,一天内涨到 1,432 / 88,star 增幅超过 25%。Magpie 提供一个统一界面管理 Claude Code、Codex、Gemini CLI、OpenCode、Cursor CLI、Copilot CLI 等本机 Agent 工具的模型配置,支持菜单栏面板、桌面窗口、终端 UI、CLI 四种形态,桌面端基于 Wails 压缩到 15MB 以内。核心是监听 `127.0.0.1:3425` 的本地网关,在 OpenAI Chat Completions / Responses、Anthropic Messages 等 API 规范间做协议翻译,配置文件的注释、顺序、缩进原样保留并采用原子写入。

**看点**:一个本地网关做多协议互译,本质上是给「多 Agent 工具混用」场景做了一层 API Gateway/Sidecar——这和微服务网关做协议转换是同一个问题的不同尺度。已登录的 Claude Code/Codex/Copilot 可直接作为 provider 复用现有订阅而无需另存 Key,这种「凭证复用而非重复配置」的思路值得纳入团队标准化开发环境脚本。

---

## 4. [mikehasa/golive-skill](https://github.com/mikehasa/golive-skill) ⭐ 1,027

**GoLive — 把「上线」做成 Agent Skill:detect → plan → approve → apply → verify**

`TypeScript` · Fork 75 · 创建于 09-23 · MIT

连续第二期上榜,一天内从 989 star / 69 fork 涨到 1,027 / 75。这是一个面向 Agent 构建产品的部署自动化 Skill(当前 v0.1.0-alpha.2):检测应用所需资源 → 生成带具体变更目标的执行计划 → 改动任何服务商配置前请求人工批准 → 用用户自己账号执行 → 部署后做功能性验证 → 记录所有创建资源用于漂移检测与清理。已验证集成 Vercel/Netlify(托管)、Supabase/Neon(数据库)、Porkbun/GoDaddy(域名)、Resend(邮件)、Stripe 测试模式(支付),`golive status` 提供只读配置漂移检测,DNS/生产/销毁类操作需显式传入 `--confirm-*` 参数确认。

**看点**:「plan → 人工批准 → apply → verify」流程与 Terraform 式 IaC 工作流几乎一一对应,`golive status` 对应 `terraform plan` 的心智模型,对 DevOps 背景的人非常容易上手。路线图明确把「CI/CD 集成、schema 迁移、监控、备份」列为 planned 而非已实现,当前更适合个人项目/原型的一次性上线,尚不建议接入正式持续交付流水线;凭证以明文存放本地(设置了 POSIX 权限)也需要在企业环境中谨慎评估。

---

## 5. [dzhng/jevgrep](https://github.com/dzhng/jevgrep) ⭐ 994

**Jevgrep — 用自然语言问题定位代码的 CLI,给 Coding Agent 当「语义 grep」**

`TypeScript` · Fork 57 · 创建于 09-26 · MIT

新上榜项目,三天内涨到 994 star / 57 fork。`jg` 让用户直接向仓库提问(例如"请求进入 handler 前认证在哪里检查"),工具会分层遍历仓库结构、用内容预览评估文件相关性、定位具体源码单元,一次 stdout 响应中返回摘要、文件位置、阅读线索和带行号的源码片段。目前声明支持 Python 与 TypeScript/JavaScript 的声明解析,其余文本格式走 fallback;运行需要 Node.js 22+、macOS/Linux,以及 Vercel AI Gateway / TypeSafe / OpenRouter 的 API Key。项目在一次十任务的 SWE-bench 重复测试中报告约 40% 的 coding-agent 成本下降,但明确说明这是「有质量取舍的成本下降,而非同等或更优解题质量的证据」。

**看点**:把「定位相关代码」从 Agent 主任务中拆出来做成独立、可复用的 CLI 步骤,这种「细粒度工具链拆分 + 诚实披露 trade-off」的做法,对把 AI 工具接入 CI/CD 流水线时如何设计可观测、可评估的子步骤很有参考价值。

---

## 今日趋势小结

**① ZCode 退出榜单,jevgrep 补位,Top 5 呈现「老项目稳态增长 + 新项目快速补位」格局。** 上期占据第一的 ZCode(创建于 09-20)因超出 7 天窗口自然退出,jev-chat-jarvis(连续第三期)接棒榜首;新晋的 jevgrep 三天内即冲进千星俱乐部,说明「近 7 天」这一滚动窗口本身就在快速淘汰旧热点、纳入新热点。

**② Magpie 单日涨幅超 25%,是本期增速最快的项目,反映「多 Agent 工具统一管理」痛点被广泛认可。** 从"统一模型配置"到"统一部署审批流程"(golive-skill)到"统一工具调用编排"(unreal-agent),本期榜单里至少 3 个项目都在解决「多个独立 Agent 工具如何被统一管理/编排」的问题,这与团队里同时使用多种 CI/CD 工具、需要统一配置和权限管理的诉求是同一类问题。

**③ 「显式确认 + 只读漂移检测」继续是高风险操作的标准安全模式。** golive-skill 的 `--confirm-dns`/`--confirm-live`/`--confirm-destroy` 与只读的 `golive status`,和 magpie 的本地凭证复用、jev-chat-jarvis 的「不自动发送」原则一脉相承——这些项目不约而同地选择把不可逆操作卡在显式确认这一步,值得在设计任何自动化流水线的审批环节时参考。

---
*数据来源:GitHub Search API · 本文由每日定时任务自动生成*
