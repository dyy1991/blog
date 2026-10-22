---
title: "每日 GitHub 开源速报 · 2026-10-15"
date: "2026-10-15"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:anatomy、ARTEX、esp32-iphone-agent、ARTEXX、talorys。自主安全 agent 与 Agent Skill 走热,榜单中出现疑似刷星的副本项目。"
---

# 每日 GitHub 开源速报 · 2026-10-15

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) ⭐ 11,623

**Anatomy — 用交互式等轴测图解释技术概念的 Claude Agent Skill**

`JavaScript` · Fork 828 · 创建于 10-08 · MIT

一个 Claude Agent Skill:把技术概念(例如用 pin-tumbler 锁解释 cache key)画成由大量带阴影 SVG 部件拼成的等轴测交互图,并可叠加 WebGL shader(火、水等)和 beta 版 3D。每张图带有由小模型驱动的实时读数,附带几何审计和 headless 浏览器脚本,让 Claude 自检截图,输出独立 HTML、SVG 或 React 组件。

**看点**:「Skill + 自检脚本」让 agent 自己验收产出,这个闭环思路可以借鉴到 CI 里的可视化/文档生成环节。

---

## 2. [mhtsec/ARTEX](https://github.com/mhtsec/ARTEX) ⭐ 4,193

**ARTEX — LLM 驱动的自主渗透测试系统**

`Go` · Fork 6,447 · 创建于 10-08 · AGPL-3.0

Go 后端 + Next.js 前端 + PostgreSQL。planner、worker、人工介入三类 agent 通过共享资产图和每任务的探索图协作,支持 worker 间共享执行轨迹、planner 维护多步攻击链 todolist、流量记录、工具调用审批关卡、人工复测流程以及 ScopeSentry 资产同步。README 声明仅限个人学习和隔离的本地验证,禁止扫描线上系统。

**看点**:Fork 数(6,447)远超 star 数(4,193),比例异常,star 数据的参考价值需打折。架构上的「工具调用审批关卡」与 DevSecOps 自动化安全检测思路相通,但只应在授权的隔离环境使用。

---

## 3. [onehumanbeing/esp32-iphone-agent](https://github.com/onehumanbeing/esp32-iphone-agent) ⭐ 2,224

**ESP32 iPhone Agent — 用 7 美元开发板让 AI 操作真实 iPhone**

`C` · Fork 298 · 创建于 10-11 · MIT

无需在手机上装任何东西、无需开发者账号和 Xcode。通过 AirPlay 镜像(电脑上的 UxPlay 接收)让视觉模型「看」屏幕,再由 ESP32-S3 板伪装成 USB 鼠标键盘执行点击/滑动/输入。planner 模型写简短计划,actor 模型根据最新截图决定每步操作,服务端还会校验指针位置和画面是否变化以纠正漏点。Web UI 展示实时画面、日志和带动作标注的每步截图。

**看点**:真机移动端自动化测试的低成本硬件思路,对移动应用 CI 中的真机验证有启发。

---

## 4. [trhhubsd/ARTEXX](https://github.com/trhhubsd/ARTEXX) ⭐ 1,199

**ARTEXX — ARTEX 的副本/衍生项目**

`Go` · Fork 12 · 创建于 10-08 · AGPL-3.0

描述与 ARTEX 基本一致:同样是 Go + Next.js + PostgreSQL 的多 agent 自主渗透测试系统,双图(资产图 + 探索图)设计,跨 worker 轨迹检索、共享 todolist、ScopeSentry 同步和人工复测。README 仅引用 oritera/Cairn 作为参考,与原项目的差异无法从中确认。

**看点**:同日创建、内容雷同的副本一天内获得 1k+ star,Fork 仅 12,存在刷星嫌疑。热榜数据要结合 star/fork 比例和创建时间交叉判断,不宜直接当作质量信号。

---

## 5. [rociiu/talorys](https://github.com/rociiu/talorys) ⭐ 1,016

**Talorys — 部署在自己 Cloudflare 账号里的个人 AI 助手**

`TypeScript` · Fork 90 · 创建于 10-10 · MIT

完全运行在你自己的 Cloudflare 账号中,开发者不运营任何服务器。一条命令 `npx create-talorys@latest` 即可部署私有 Worker、基于 SQLite 的 Durable Object 存储和 Pages 前端。功能含流式聊天、个人事实记忆、任务/笔记/项目、提醒与周期自动化,设计上适配 Cloudflare 免费套餐,即使 AI 额度用尽任务和提醒仍可用。

**看点**:云原生 / serverless 角度的典型案例:一条命令完成基础设施交付(IaC 式脚手架),适合作为学习 Workers + Durable Objects + Pages 部署流水线的参考。

---

## 今日趋势小结

1. **Agent 化的安全工具涌现**:ARTEX 及其副本显示自主渗透测试 agent 受到关注,其「审批关卡 + 人工复测」设计呼应 Agent 安全治理主题。
2. **Skill 与自检闭环**:anatomy 展示了 Agent Skill 带验证脚本、让模型自查产出的做法。
3. **榜单数据需甄别**:本周 Top 5 中有两个项目 Fork/star 比例明显异常,做趋势判断时建议结合创建时间与副本关系交叉验证。对 DevOps 学习者,talorys 的一条命令部署到 Cloudflare 最值得动手实践。

---
*数据来源:GitHub Search API · 生成时间:2026-10-15*

本文由每日定时任务自动生成。
