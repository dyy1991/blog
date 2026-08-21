---
title: "每日 GitHub 开源速报 · 2026-08-20"
date: "2026-08-20"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:deepseek-harness、modlens、OpenViking、needle、Anthropic-Cybersecurity-Skills。DeepSeek Harness 两天破十万 star 引爆「插件化 agent 运行时」,agent 记忆与端侧模型双向延伸。"
---

# 每日 GitHub 开源速报 · 2026-08-20

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) ⭐ ~126,000

**DeepSeek Harness (dsh) — Everything is a Plugin,开源版 Claude Code 竞品**

`TypeScript` · Fork ~12,500 · 创建于 08-13 · MIT

DeepSeek 官方发布的开源 agent harness,主打「一切皆插件」架构:模型适配器、工具注册表、会话日志、沙箱、乃至 agent loop 本身,全部以插件形式挂载,底层由 Cordis 元框架驱动。开发者预览版发布后不到两小时破万 star、12 小时破 5 万,两天冲到 9.5 万以上,是 GitHub 有记录以来采用曲线最陡的开发者工具之一。目标是做终端里的编码/工作流 agent,与 Claude Code、Grok Build、Codex CLI 正面竞争。官方提示仍在快速迭代,会有破坏性变更。

**看点**:本周现象级项目,一举把「插件化 agent 运行时」推成新范式。对 DevOps 而言,「everything is a plugin」意味着 agent 能像 CI 流水线一样被拆成可组合、可替换、可审计的阶段;headless 模式接入 CI/CD 值得重点关注。

---

## 2. [liustack/modlens](https://github.com/liustack/modlens) ⭐ ~3,200

**ModLens — DeepSeek Harness 的首个视觉插件,给纯文本模型外挂「眼睛」**

`TypeScript` · MIT · 创建于 dsh 发布同期(08 月中旬)

DeepSeek Harness 插件生态里跑得最快的一个:为 DeepSeek、GLM 等纯文本模型补上视觉能力——粘贴一张图片,返回结构化 JSON 证据(OCR、版面 layout、语义 semantics),让 text-only 的 coding agent 也能「看懂」截图、架构图、报错弹窗。同作者还有配套的 modsearch(联网搜索插件)。项目刻意不接受 PR,由单人逐行审核以保证可靠性。

**看点**:dsh 发布仅一周,插件生态已自发繁荣,印证了插件化架构的网络效应。结构化 JSON 证据的设计对自动化场景很友好——CI 里让 agent 读构建产物截图、监控面板并产出可机读结论,是很自然的落地点。

---

## 3. [volcengine/OpenViking](https://github.com/volcengine/OpenViking) ⭐ 快速上升中

**OpenViking — 面向 Agent 的自进化上下文数据库(记忆 + RAG + 技能三合一)**

`Python` · 创建于 08 月 · 火山引擎(字节跳动)开源

把 agent 需要的「记忆 / 资源 / 技能」统一为一套 `viking://` 虚拟文件系统:agent 用 `ls`、`tree`、`find` 浏览自己的上下文,而不是去查一个黑盒向量库。内容被加工成 L0 摘要 / L1 概览 / L2 细节三层,按需加载,避免上下文爆炸。内置记忆自迭代循环:异步分析任务执行结果与用户反馈,自动更新 User / Agent 记忆目录。面向 openclaw、opencode 等 agent 设计。

**看点**:大厂下场做 agent 记忆基础设施,「上下文即文件系统」的可解释性远胜黑盒向量库。对运维视角:可 `ls`/`find` 遍历、可 diff 的记忆层,天然对审计和排障友好,比不可见的 embedding 检索更适合生产环境。

---

## 4. [cactus-compute/needle](https://github.com/cactus-compute/needle) ⭐ ~7,500

**Needle — 14MB 的端侧基础模型,手机 / 穿戴 / 智能家居 / 机器人都能跑**

`C/C++` · Apache-2.0 · 08-17 更新

单文件 14MB 二进制、约 45M 参数的开放基础模型,专为工具调用(tool calling)、设备操作和结构化抽取设计,一次完整会话仅需 28MB 内存,在手机上可达 1–6k tokens/秒。定位是把「够用的智能」塞进没有 GPU、甚至没有联网的微型设备。

**看点**:与云端大模型相反方向的赛道——把 agent 能力压到边缘。对 DevOps/边缘部署有想象空间:14MB 单二进制意味着可以直接打进容器镜像或固件,做本地化、离线、低延迟的推理旁路,免去 GPU 依赖和外部 API 调用成本。

---

## 5. [mukul975/Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills) ⭐ 本周高速上升

**817 条结构化网络安全 Agent Skill,对齐 MITRE ATT&CK / NIST CSF / D3FEND**

`Markdown / 结构化 Skill` · 创建于 08 月

面向 AI agent 的网络安全技能库,收录 817 条结构化 skill,并映射到 MITRE ATT&CK、NIST CSF、D3FEND 等八套安全框架。让 coding/安全 agent 在威胁建模、检测、响应时有一套标准化、可复用、框架对齐的知识底座,而非临时拼凑提示词。本周与 usestrix/strix(AI 渗透测试)一同带动了「AI + 安全」板块的热度。

**看点**:直击 DevSecOps 落地痛点——安全知识的标准化与可复用。把 ATT&CK/NIST 映射成 agent 可直接消费的 skill,意味着安全左移(shift-left)可以内嵌进 CI 流水线的自动化审查环节,而不只停留在人工评审。

---

## 今日趋势小结

本周 AI 开源生态被一件事主导:**① DeepSeek Harness 引爆「插件化 agent 运行时」范式**——两天十万 star,并在一周内催生 modlens、modsearch 等插件生态,「everything is a plugin」正在成为 agent 架构的新共识。**② agent 记忆与上下文成为基础设施战场**——火山引擎 OpenViking 把上下文做成可 `ls`/`find` 的文件系统,可解释性与可审计性压过黑盒向量库。**③ 两个反向延伸同时发生**:一边是 Needle 把模型压到 14MB 塞进边缘设备,一边是 817 条安全 Skill 把 DevSecOps 知识标准化喂给 agent。对 DevOps 方向,最值得跟进的是 dsh 的 headless/插件模式接入 CI/CD,以及 OpenViking「上下文即文件系统」对生产可观测性的启发。

---
*数据来源:GitHub 官方 Search API 当前不可直连,本文基于 GitHub Trending 聚合 + 各仓库定向检索交叉整理;star/fork/创建日期为近似值,以仓库主页为准。*

*本文由每日定时任务自动生成。*
