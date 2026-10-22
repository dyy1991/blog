---
title: "每日 GitHub 开源速报 · 2026-10-21"
date: "2026-10-21"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:earshot、git-ai、huashu-motion、blender-ai-mcp-addon、coop-anything。Agent 感官与产出能力借 MCP / Skill 扩展,面向 agent 的版本控制与自动化测试闭环兴起。"
---

# 每日 GitHub 开源速报 · 2026-10-21

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [Leonxlnx/earshot](https://github.com/Leonxlnx/earshot) ⭐ 1,956

**Earshot — 给 coding agent 装上「耳朵」的本地音频理解工具**

`Python` · Fork 112 · 创建于 10-15 · MIT

纯 CPU、本地运行的工具包,让 coding agent 能「听」:把音频转成可量化指标和自然语言判断,可描述声音、校验与文本描述的匹配度、在长录音中找最佳片段、识别合成 vs 真实音频,并为视频生成带时间戳的听感转录与评分卡。还能通过代码生成声音并渲染打分、把录音转成可编辑合成配方,自带 201 个预渲染音效库。基于 Python 3.10+ / ffmpeg / CLAP 与 AST 开源模型,提供 CLI、Python API 和 MCP server。

**看点**:agent 多模态能力补全的典型思路——用 MCP server 暴露「听」的能力;纯 CPU 方案意味着可直接塞进 CI 流水线做音视频产物的自动质检。

---

## 2. [feder-cr/git-ai](https://github.com/feder-cr/git-ai) ⭐ 1,274

**git-ai — 为 AI Agent 设计的版本控制系统**

`Go` · Fork 124 · 创建于 10-15 · NOASSERTION(未标准化)

对 Anthropic 内部 Scion 公开设计的独立实现,基于 GitLab Gitaly 的 fork。把工作量移到服务端:客户端只拉取需要的路径,blame、搜索等由服务端派生数据回答,变更通过 compare-and-swap 落地而非 merge queue。具备自动冲突解决、changeset 日志、合入后测试并自动回滚、按 agent 的访问控制与 Slack 监控 agent。数据存 SQLite/PostgreSQL,pack 放对象存储,目前 0.1.0。

**看点**:与你的 CICD 方向最相关:当大量 agent 并发提交时,传统 git + merge queue 会成为瓶颈,「post-land 测试 + 自动 revert」本质是把 CI 门禁后置。License 标记不明,使用前需确认。

---

## 3. [alchaincyf/huashu-motion](https://github.com/alchaincyf/huashu-motion) ⭐ 1,157

**huashu-motion — 让 coding agent 做商业级产品发布短片**

`JavaScript` · Fork 118 · 创建于 10-18 · MIT

一套 Agent Skills,让 Claude Code、Codex 等 agent 把产品描述变成宣传短视频。动画用代码(GSAP、Canvas、Three.js、SVG)而非视频模型生成,每帧由代码与时间决定,可复现。自带浏览器编辑器——点击画面某处留言即可让 agent 修改,还支持 ABC 记谱作曲、23 种同步音效、逐词对齐配音,可导出 MP4/MOV/WebM/GIF,含 10 个模板和 20 种动效模式。需 Node 22+、Chrome、FFmpeg,目前仅在 macOS 测试。

**看点**:「确定性渲染」让视频成为可版本化、可在 CI 中重复构建的产物,发布流水线里自动出 release 宣传片并非空想。

---

## 4. [LiCinCan/blender-ai-mcp-addon](https://github.com/LiCinCan/blender-ai-mcp-addon) ⭐ 937

**mcp-for-blender-pro — Blender 的 AI 助手与 MCP Server**

`Python` · Fork 384 · 创建于 10-15 · MIT

Blender 扩展,AI 可检视场景、创建编辑物体、分配材质、搜索资源库并执行多步工作流。带可视化 Studio 工作区(聊天、场景对象、视口快照、操作审批、任务看板),支持单助手或 manager/worker/reviewer 多 agent 团队。可接 OpenAI、Claude、Gemini、本地 Ollama 或自定义端点,内置带认证的 MCP server 暴露 21 个场景工具。面向 Blender 4.2+ / Windows x64。

**看点**:Fork 数(384)相对 star 异常高,说明被大量二次开发;「操作审批」+ 带认证的 MCP 是 agent 工具安全治理的又一例。

---

## 5. [cranebeaker/coop-anything](https://github.com/cranebeaker/coop-anything) ⭐ 712

**Co-op Anything — 用 AI agent 把单机游戏改成联机 co-op**

`Python` · Fork 89 · 创建于 10-16 · MIT

用 AI 编码 agent 为单机 PC 游戏加上好友联机:agent 先研究游戏,必要时逆向,再构建或修复多人功能,并用 bot 在游戏内测试。成果打包为一键安装,通过 Steam 联机无需端口转发,维护 230+ 个 co-op mod 与缺口目录。工具链包括用于引擎检测和贡献校验的 MCP server、BepInEx/UE4SS/SKSE 等框架、Ghidra 等逆向工具,以及用真实游戏客户端的自动化 QA,贡献以 PR 形式回流。

**看点**:「agent 研究 → 实现 → 真机自动化测试 → PR 回流」是完整的自动化交付闭环,其 QA 环节对 CI/CD 学习者是很好的参考样本。

---

## 今日趋势小结

本周 AI 开源三大主线:**① Agent 的感官与产出能力扩展**(earshot 让 agent 听、huashu-motion 让 agent 做视频、blender-ai-mcp-addon 让 agent 操作 3D 场景),几乎都通过 MCP / Skill 形态交付;**② 面向 agent 的基础设施重构**(git-ai 把版本控制改造成适配高并发 agent 提交的服务端架构);**③ 「agent 研发 + 自动化测试 + PR 回流」闭环**(coop-anything)。对 DevOps / CI/CD 方向,git-ai 的 post-land 测试与自动回滚、coop-anything 的真机 QA 流程最值得细读。

---
*数据来源:GitHub Search API · 本文由每日定时任务自动生成*
