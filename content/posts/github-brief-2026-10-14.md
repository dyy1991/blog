---
title: "每日 GitHub 开源速报 · 2026-10-14"
date: "2026-10-14"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:anatomy、ARTEX、esp32-iphone-agent、ARTEXX、talorys。Agent 走向真机与安全攻防,Skill 与一键 serverless 部署成为分发主流。"
---

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) ⭐ 9,273

**Anatomy — 把技术概念画成可交互等距机械的 Agent Skill**

`JavaScript` · Fork 663 · 创建于 10-08 · MIT

一个 Claude Code Agent Skill:输入一个技术概念(例如 cache key、rate limiter),生成由大量小部件组成的等距 SVG 机械图,例如 cache key 变成「销子全部对齐才会转动」的锁。可选 WebGL shader 特效和 beta 3D 模式,内置几何审计与 headless Chrome 截图自检。输出可为独立 HTML、SVG 或 React/Next.js 组件,支持明暗主题。`npx skills add wheresryan22/anatomy` 安装,需要 Node.js 20.10+。

**看点**:用来给 CI/CD 流水线、K8s 调度等抽象概念做「可视化讲解」很合适,可以直接拿来给博客配图;Skill 作为分发单位的形态也值得关注。

---

## 2. [mhtsec/ARTEX](https://github.com/mhtsec/ARTEX) ⭐ 4,034

**ARTEX — AI 自主渗透测试系统(百度「agent+」攻防挑战赛冠军项目)**

`Go` · Fork 6,339 · 创建于 10-08 · AGPL-3.0

Go 后端 + Next.js 前端,打包成内嵌 UI 的单一二进制。核心是双图设计:跨任务的资产图(域名/IP/服务/端点)与单任务的探索图(目标/意图/事实/发现)。Planner 向 worker agents 派发 intent,agent 之间可检索彼此的执行轨迹。另有流量录制 MITM 代理、工具调用审批门、human-in-the-loop 对话、ScopeSentry 资产同步和复测 agent。支持安装脚本、Docker Compose(含 PostgreSQL)、预编译二进制和源码构建。项目声明仅限本地学习研究。

**看点**:单二进制 + Docker Compose 的交付方式很适合部署练手;审批门设计与 DevSecOps 的「安全左移」思路相通。注意 fork 数(6,339)远高于常规比例,star/fork 结构异常,参考时需留意。

---

## 3. [onehumanbeing/esp32-iphone-agent](https://github.com/onehumanbeing/esp32-iphone-agent) ⭐ 1,980

**用 $7 的 ESP32 让 AI 操作真实 iPhone**

`Python` · Fork 261 · 创建于 10-11 · MIT

手机端零安装:通过 AirPlay 镜像(UxPlay)获取屏幕,ESP32-S3 模拟 USB 鼠标键盘并启用 AssistiveTouch 执行操作。无需 Apple 开发者账号、Xcode 或越狱,macOS/Linux 均可。Planner 模型根据目标制定计划,Actor 模型基于最新截图选择下一步动作,并校正指针位置、检查画面是否变化、卡住时重新规划。附带 Web UI 与紧急停止,支持任何 OpenAI 兼容的视觉模型(含本地模型)。局限:密码输入等不被镜像的界面、仅 ASCII 输入。

**看点**:Planner/Actor 分离 + 每步验证的闭环,很像 CI 里的「执行—断言—重试」;可延伸为真机 UI 自动化测试的低成本方案。

---

## 4. [trhhubsd/ARTEXX](https://github.com/trhhubsd/ARTEXX) ⭐ 1,207

**ARTEXX — 疑似 ARTEX 的复刻/镜像仓库**

`Go` · Fork 11 · 创建于 10-08 · AGPL-3.0

仓库描述与 ARTEX 基本一致(AI 自主渗透测试系统,并标注 Autumn-27/ARTEX),技术栈为 Go + Next.js + PostgreSQL,采用 LLM 多 agent 工作流与「探索图 + 资产图」双图设计。README 未说明是否为 fork,但与 #2 的项目高度重合。

**看点**:短时间内出现的同名复刻且 star 增长很快,提示本周榜单可能含有刷星或镜像水分;使用前建议核对原始仓库与来源可信度。

---

## 5. [rociiu/talorys](https://github.com/rociiu/talorys) ⭐ 983

**Talorys — 跑在你自己 Cloudflare 账号里的个人 AI Agent**

`TypeScript` · Fork 89 · 创建于 10-10 · MIT

开源个人 AI 助手,无需自建服务器或数据库。包含流式聊天、可查看编辑的记忆系统、任务/笔记/项目管理,以及提醒、每日摘要等自动化。架构:Cloudflare Pages(React + Pages Function)经 service binding 转发到无公网 URL 的私有 Worker,Worker 内运行 `TalorysAgent` Durable Object,以 SQLite 存储、Workers AI 提供对话。`npx create-talorys@latest` 一条命令完成登录、建资源和部署,面向免费额度,单用户、无遥测。

**看点**:典型的 serverless 云原生一键部署范例(Pages + Worker + Durable Object + service binding),从 IaC/部署自动化角度非常值得拆解。

---

## 今日趋势小结

1. **Agent 向物理世界与专业场景延伸**:esp32-iphone-agent 把 agent 带到真机,ARTEX 把多 agent 用于攻防,Planner/Actor + 验证闭环成为通用范式。
2. **Skill 与一键部署成为分发形态**:anatomy 以 Agent Skill 分发,Talorys 用 `npx` 一条命令落地 Cloudflare 全家桶,「低门槛部署」是增长关键。
3. **榜单水分需警惕**:ARTEX 的 fork 比例异常,ARTEXX 疑似复刻,star 数不等于质量,DevOps 选型应结合 CI 状态、发布节奏、社区活跃度判断。

---
*数据来源:GitHub Search API · 本文由每日定时任务自动生成*
