---
title: "每日 GitHub 开源速报 · 2026-10-08"
date: "2026-10-08"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:answer-me-with-html、replica-skill、leviathan、agentmemoryrepo、Papermorph。Skill 分发、Agent 记忆基础设施与多阶段产物流水线成为主线。"
---

# 每日 GitHub 开源速报 · 2026-10-08

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html) ⭐ 2,080

**answer-me-with-html — 用单页 HTML 回答复杂问题的 Agent Skill**

`JavaScript` · Fork 140 · 创建于 10-02 · MIT

让模型只写简短的 Markdown 草稿,由内置 CLI 负责排版、主题与图表,约 50 ms 生成一个可离线打开的 HTML 页面。支持流程图、时序图、树、时间线与对比表,提供明暗两套主题,并带草稿自检与写作风格检查;可通过命令、Claude Code plugin 或手动方式安装。项目称输出 token 约减少 7 倍、速度快约 3.6 倍。

**看点**:「轻量 DSL + 确定性渲染器」取代让 LLM 直接写 HTML,思路与 CI 中用模板生成报告一致;单文件离线产物也很适合作为流水线的构建报告。

---

## 2. [Jakeschincariol/replica-skill](https://github.com/Jakeschincariol/replica-skill) ⭐ 884

**replica-skill — 逆向、重建并测试 App 的 11 个 Claude skills**

`Python` · Fork 103 · 创建于 10-03 · MIT

覆盖 recon、技术栈规划、设计系统重建、页面开发、auth/支付、测试、与原版的 parity 打分、竞品差评挖掘、品牌重塑、落地页与上架文案,直至部署到自有域名。产物集中写入 `replica/` 目录,并附 6 个仅用标准库的 Python 工具(parity 打分、图像 diff、contrast 检查、brand sweep、listing lint 等)。强调 clean-room 重建,上线前必须 rebrand。

**看点**:把一次产品克隆拆成顺序化的阶段并以文件交接,近似一条多阶段 pipeline;parity 打分、图像 diff 可直接类比为 CI 里的回归与视觉测试门禁。使用时需注意版权与合规边界。

---

## 3. [elstongun/leviathan](https://github.com/elstongun/leviathan) ⭐ 668

**leviathan — 给 Agent 用的单二进制全文索引与「深度记忆」**

`Rust` · Fork 35 · 创建于 10-05 · Apache-2.0

把 JSONL、JSON、CSV/TSV、SQLite 或数据库 CLI 输出构建成带排名的全文索引,agent 用自然语言检索,每次返回约 450 token 的带引用结果卡。官方合成基准在 100 万条记录下中位回答 436 token、延迟 33 ms,而最佳 grep 方案超过 10 万 token。支持分组检索、字段过滤、增量 upsert/delete,可经 CLI 或只读 MCP server(4 个工具)调用,索引为单个 SQLite 文件,离线、只读、不持有数据库凭证。

**看点**:单静态二进制 + 单文件索引 + 不碰凭证,部署与安全面都很干净,适合放进容器或 CI 做日志、构建记录的快速检索。

---

## 4. [AgentMemoryRepo/agentmemoryrepo](https://github.com/AgentMemoryRepo/agentmemoryrepo) ⭐ 615

**agentmemoryrepo — 把 Agent 记忆存成 git 仓库的开放规范**

语言未标注 · Fork 31 · 创建于 10-04 · MIT

规范提出:每次会话 clone 最新记忆、检索、更新并 commit;由定期运行的「dreaming」agent 归纳跨会话规律、合并重复、清理过期与解决矛盾。格式以 `MEMORY.md` 为入口,Markdown 笔记带来源与日期元数据,并用 `[[path]]` 互链。可用于个人跨会话记忆、agent 集群共享发现与团队知识库。

**看点**:直接把 git 的版本历史、合并与权限用于 agent 状态管理,是 GitOps 思路向 AI 记忆的延伸;「定期整理」的 dreaming agent 也像一个 cron 型维护任务。

---

## 5. [DozenTwelve/Papermorph](https://github.com/DozenTwelve/Papermorph) ⭐ 531

**Papermorph — 把 PDF 变成带动画与旁白的交互式网页书**

`HTML` · Fork 68 · 创建于 10-03 · MIT

Claude Code Skill,流水线为 PDF → 书籍规划 → 分镜 → 旁白 → 动画与测验 → 网页书。通过 `npx skills add DozenTwelve/Papermorph` 安装,再用 `/papermorph` 指定 PDF 与目标读者;示例可用 Python 起 HTTP 服务预览 `site` 目录。目前仅支持 Opus 5.5,暂不支持图像模型、多语言与背景音乐。

**看点**:分阶段、可预览的静态站点产物,天然适合接入 GitHub Pages 或 CI 自动发布;对特定模型版本的硬依赖则是可复现性的风险点。

---

## 今日趋势小结

1. **Skill 成为主流分发形态**:answer-me-with-html、replica-skill、Papermorph 都以 `npx skills add` 或 plugin 方式分发,文件 + 脚本的形态可像代码一样版本化,并接入 CI 做 lint 与测试。
2. **Agent 记忆与检索基础设施化**:leviathan 与 agentmemoryrepo 分别从「单文件索引」和「git 仓库」两个方向解决记忆问题,都强调离线、可审计与低 token 成本。
3. **多阶段产物流水线**:replica-skill 与 Papermorph 把复杂任务拆成顺序阶段并落盘交接,与 CI/CD 的 stage 与 artifact 理念高度一致。

---

*本文由每日定时任务自动生成*
