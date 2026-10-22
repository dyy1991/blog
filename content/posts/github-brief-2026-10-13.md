---
title: "每日 GitHub 开源速报 · 2026-10-13"
date: "2026-10-13"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:anatomy、ARTEX、aurelio-finance、esp32-iphone-agent、talorys。Skill 分发、一键自托管与 Agent 走向真实世界是本周主线。"
---

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) ⭐ 7,215

**anatomy — 把技术概念画成交互式等轴测机器的 Agent Skill**

`JavaScript` · Fork 517 · 创建于 10-08 · MIT

一个 Claude Skill:描述一个技术概念,它会"发明"一台物理机器来体现其运行机制(例如把 cache key 画成只有所有 pin 匹配才能转动的锁),并用大量小型 shaded SVG 部件生成 isometric 交互图,可选 WebGL shader 与实验性 3D 动效。工具包只依赖 Node 内置模块,脚本用 headless Chrome 截图并校验几何。可通过 skills CLI、git 或 ZIP 安装,用 `/anatomy` 调用,输出可为独立 HTML、SVG 或 React/Next.js 组件。

**看点**:很适合把 CI/CD 流水线、容器网络这类抽象原理画成教学图;skill 以文件夹形式分发,易于版本化,也方便接入 CI 做校验。

---

## 2. [mhtsec/ARTEX](https://github.com/mhtsec/ARTEX) ⭐ 3,789

**ARTEX — 多 LLM Agent 驱动的自主渗透测试系统**

`Go` · Fork 6,139 · 创建于 10-08 · AGPL-3.0

Go 后端 + 内嵌 Next.js 前端,数据存 PostgreSQL。核心是「共享资产图 + 单任务探索图」双图架构:planner agent 决定下一步探测方向,worker agent 各领一个 intent 执行工具并回写结果,还能检索其他 worker 的执行轨迹。支持 Docker Compose、install 脚本、预编译二进制、源码构建单文件;README 提示官方 Docker 镜像来源已失效,需本地构建。另有流量记录代理、工具调用审批、发现复测与带回滚的在线更新。

**看点**:单二进制 + Postgres 的形态对云原生很友好,「镜像失效、需本地构建」也恰好说明依赖外部镜像的供应链风险;工具调用审批门类似 CD 里的 manual approval。安全工具务必只在获授权环境中使用。(另:fork 数高于 star,数据略反常,仅供参考。)

---

## 3. [LosaLosSantos/aurelio-finance](https://github.com/LosaLosSantos/aurelio-finance) ⭐ 3,060

**aurelio-finance — 自托管的个人理财与 AI 顾问应用**

`Python` · Fork 387 · 创建于 10-06 · MIT

在本机运行的个人理财与规划应用:追踪账户、持仓、基金穿透、现金流、负债与目标。后端 Python(uv),前端 Node.js 22+,克隆后运行 `start.sh` / `start.ps1` 即可在 localhost:8000 使用。"Ask Aurelio" 聊天通过 OpenRouter 接入(自备 key),可联网搜索,并以卡片形式提出修改建议,由用户确认。

**看点**:README 未提供 Docker 化方案,正是练习写 Dockerfile 与 GitHub Actions 的好素材;「AI 提议、人确认」的模式值得借鉴。

---

## 4. [onehumanbeing/esp32-iphone-agent](https://github.com/onehumanbeing/esp32-iphone-agent) ⭐ 1,151

**esp32-iphone-agent — 用 $7 的 ESP32 让 AI 操作真实 iPhone**

`Python` · Fork 138 · 创建于 10-11 · MIT

无需在手机上装任何东西、无需开发者账号或越狱:电脑通过 UxPlay 接收 AirPlay 镜像的屏幕,ESP32-S3 通过 USB 充当鼠标键盘(需开启 AssistiveTouch)。planner 模型先列计划,actor 模型逐帧看截图决定点按、滑动、输入;还会校正指针漂移并检查每次操作后画面是否变化以重试。支持任意 OpenAI 兼容的视觉模型,云端或本地均可。

**看点**:硬件 + 视觉模型的「感知—行动—校验」闭环,思路接近自动化测试;可联想到把真机 UI 测试纳入 CI 的 self-hosted runner 场景。

---

## 5. [rociiu/talorys](https://github.com/rociiu/talorys) ⭐ 922

**talorys — 运行在自己 Cloudflare 账号里的个人 AI Agent**

`TypeScript` · Fork 82 · 创建于 10-10 · MIT

提供流式聊天、记忆、任务、笔记与定时提醒。前端 React + Vite 部署在 Cloudflare Pages,私有 Hono Worker 加带 SQLite 的 Durable Object,模型用 Workers AI,提醒与例行任务靠 Durable Object alarms 驱动。一条 `npx` 命令完成安装,密码在本地哈希,资源命名唯一,无需付费计划。

**看点**:典型的 serverless / edge 云原生架构,一条命令完成 Worker、Durable Object、Pages 的 provisioning,是学习一键部署与零服务器运维的好案例。

---

## 今日趋势小结

1. **Skill 继续成为 Agent 的分发形态**:anatomy 以文件夹 + 脚本形式发布,星标一周破 7k,可版本化并接入 CI 做 lint 与测试。
2. **一键部署与自托管**:talorys 的 `npx` 上 Cloudflare、aurelio 的 `start.sh` 降低了门槛;但 ARTEX 的镜像失效提醒我们重视制品与供应链可靠性。
3. **Agent 走向真实世界与个人化**:从操作真机 iPhone 到个人理财、个人助手,数据都留在自己手里,「AI 提议、人确认」与 CD 中的 manual approval 理念一致。

---

*本文由每日定时任务自动生成*
