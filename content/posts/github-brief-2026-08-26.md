---
title: "每日 GitHub 开源速报 · 2026-08-26"
date: "2026-08-26"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:deepseek-harness、orca、OmniRoute、NVIDIA/skills、agent-skills。Agent Skills 成为本周主线,安全治理与基础设施同步走向成熟。"
---

# 每日 GitHub 开源速报 · 2026-08-26

> 关键词:AI / LLM / Agent · 范围:近 7 天 GitHub 高热度 / 高 star 增速项目 · Top 5

---

## 1. [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) ⭐ ~194,000

**DeepSeek Harness — 「一切皆插件」的开源 Agent 运行框架**

`TypeScript / Node.js` · 近 7 天 +34k star · License 见仓库

DeepSeek 官方开源的 agent harness(命令行工具 `dsh`),核心理念是 *Everything is a Plugin*——底层由 Cordis 驱动,把模型调用、工具、记忆、执行环节全部抽象成可组合插件,官方文档称其为一种「时空可组合性编程范式」。用 pnpm 安装,面向想在本地或 CI 中拼装自有 agent 流水线的开发者。本周 star 增速冠军,一举冲到近 19 万。

**看点**:大厂把「agent 框架」做成纯插件化内核,对 DevOps 是利好——插件化意味着可以把审批、日志、沙箱执行做成可插拔中间件塞进流水线;是本周现象级项目。

---

## 2. [stablyai/orca](https://github.com/stablyai/orca) ⭐ ~41,000

**Orca — 并行 Agent 舰队的 ADE(Agent 开发环境)**

`TypeScript` · Fork ~2.9k · 近 7 天 +5.0k star · 创建于 2026-03

把「一支并行运行的 coding agent 舰队」作为一等公民的开发环境:可以用你自己的订阅(Claude、Codex 等)驱动任意 coding agent,支持桌面、移动端和 VPS 三种形态,方便远程/长任务托管。322 位贡献者,工程活跃度高。

**看点**:从「单 agent 结对」走向「多 agent 并行编排 + 远端托管」,和 CI 里并行 job 的心智模型天然契合;VPS 形态尤其适合把 agent 当成常驻 runner 使用。

---

## 3. [diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute) ⭐ 高热度

**OmniRoute — 一个端点接 350 家供应商的开源 AI 网关**

`TypeScript` · 460+ 贡献者 · MIT

免费 MIT 许可的 AI gateway:单一 endpoint 聚合 350 家供应商(90+ 免费)、1200+ 模型(Kimi、Claude、GPT、Gemini、GLM、DeepSeek、MiniMax 等),兼容 Claude Code、Codex、Cursor、OpenCode、Cline、Copilot。亮点是配额感知的自动 fallback、RTK+Caveman 压缩(号称省 15–95% token)、内置 MCP/A2A 协议,还带一个 80+ 命令的命令行「驾驶舱」。由 Go 项目 CLIProxyAPI 移植为 TypeScript。

**看点**:与 DevOps 的「反脆弱」诉求高度对齐——配额耗尽自动切换供应商、统一鉴权与可观测,本质就是给 LLM 调用做了个带熔断/降级的 API 网关,值得作为团队统一出口。

---

## 4. [NVIDIA/skills](https://github.com/NVIDIA/skills) ⭐ 高热度

**NVIDIA Agent Skills — 官方认证、可治理的 Agent 技能库**

`Python / 文档` · 源码 Apache-2.0 · 技能文档 CC-BY-4.0

NVIDIA 为自家产品(Physical AI、机器人、仿真、CUDA、RAG)提供的官方 Agent Skills,可装进 Claude Code、Codex 等 coding agent 端到端跑通工作流。真正的看点在「治理」:每个 skill 由所属产品团队每日同步,发布前经软件与 agent 原生风险扫描(配套仓库 `NVIDIA/SkillSpector` 专门检测 prompt 注入、数据外泄、供应链风险),附带 detached 签名和「Skill Card」标明归属、依赖、限制与验证状态。

**看点**:这是把「供应链安全」范式搬到 agent skill 上的标杆——签名、SBOM 式技能卡、准入扫描,和 CI/CD 里的镜像签名 + 准入控制(Cosign / OPA)完全同构,DevSecOps 学习者必看。

---

## 5. [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) ⭐ ~89,000

**Agent Skills — 覆盖「spec → ship」全生命周期的工程技能包**

`JavaScript` · 创建于 2026-02

Google Chrome 工程师 Addy Osmani 的作品:24 个结构化 skill(23 个生命周期技能 + 1 个 meta 技能)加 7 个 slash command,覆盖从需求规格、编码、测试到发布的完整研发流程,可直接装进 AI coding agent。star 已达约 8.9 万。

**看点**:把资深工程师的研发流程「制度化」为可复用 skill,正好对上 CI/CD 的核心思想——用可执行、可版本化的流程约束替代口头约定;是团队推行 agent 标准化工作流的现成模板。

---

## 今日趋势小结

1. **「Agent Skills」成为本周绝对主线**:OpenAI 于 8 月 6 日联合 AWS、Cursor、GitHub、VS Code、Vercel 推出 Agent Plugins 开放标准后,8 月 9 日的 GitHub Trending 几乎变成 skills 发布会——NVIDIA、addyosmani 等纷纷入场,技能的「打包 → 分发 → 安装」正在标准化。
2. **安全与治理从可选项变必选项**:NVIDIA 的签名 + Skill Card + SkillSpector 扫描,把供应链安全那套(签名、准入、SBOM)完整映射到 agent 生态;这与 DevSecOps 的演进路径高度一致。
3. **基础设施层同步成熟**:DeepSeek Harness 的插件化内核 + OmniRoute 的多供应商网关,说明 agent 正在从「单体应用」走向「可编排、可降级、可观测」的分布式系统形态——对 DevOps/云原生方向的读者,这几个项目里的中间件、fallback、网关设计最值得细读。

---
*数据来源:GitHub 趋势聚合(OSSInsight / star-history / trendshift 等)+ 各仓库页面 · 说明:本期 GitHub Search API 直连不可用,改用 Web 趋势数据源,项目按近期 star 增速/热度排序,创建日期为近似值。*

*本文由每日定时任务自动生成。*
