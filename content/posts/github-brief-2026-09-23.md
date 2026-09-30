---
title: "每日 GitHub 开源速报 · 2026-09-23"
date: "2026-09-23"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:jev-ultrafast、ZCode、jev-chat-jarvis、AirCard、jev-trader。延迟预算工程成为跨领域共同关键词,能力边界声明持续成为 README 标配。"
---

# 每日 GitHub 开源速报 · 2026-09-23

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast) ⭐ 18,696

**Jev Ultrafast — 用「动态索引动作空间」把 browser agent 做到秒级**

`Python` · Fork 1,220 · 创建于 09-16 · MIT

Browser Use 团队的新作,核心思路是抛弃截图驱动:每次观察把页面渲染成一张带编号的元素表(`[1] button · [2] combobox · ...`),模型只在 `CLICK / TYPE_TEXT / SELECT / SCROLL / WAIT / DONE / BLOCKED` 这套固定操作集里选一个操作 + 一个目标,且操作头与目标头在**同一次网络请求**里推测性并发下发(speculative fan-out),只有选中 `TYPE_TEXT` 时才让一个小模型生成文本。官方给出的基准:Google Flights 一次真实机票查询 **7.07 秒**完成,浏览器协议调用从 1,092 次降到 101 次。上榜一周后星标继续稳定增长(+1,393),说明这套结构化-动作范式获得了持续关注而非一次性热度。

**看点**:安全边界设计很值得抄——「模型输出绝不变成 selector、坐标、shell 命令或可执行 JS」,所有目标必须从已观测的 DOM 节点解析,执行前重新校验页面新鲜度。对做 UI 自动化测试 / E2E 流水线的人来说,这套「结构化状态 + 白名单动作 + 执行期二次校验」比 vision agent 更容易在 CI 里跑稳、跑便宜。

---

## 2. [zai-org/ZCode](https://github.com/zai-org/ZCode) ⭐ 6,465

**ZCode — 智谱的 AI 编程工作台(Desktop + Web + 终端 Agent 三合一)**

`TypeScript` · Fork 1,908 · 创建于 09-20 · Apache-2.0

Z.ai 开源的 coding agent harness,一个 monorepo 同时交付三种形态:Electron 桌面应用、浏览器工作台、以及终端里的 `zcode` CLI/TUI,三者共用同一套 Agent 运行时。`zcode` 无参数进 TUI、`zcode --web` 起本地 Web(默认只监听 127.0.0.1,监听非本机地址时自动生成访问令牌),还内置 SSH / WSL 远程工作区能力。工程侧用 pnpm workspace + mise 锁定 Node 24.14.0 / pnpm 10.33.2。三天内 fork 数已破 1,900,反应活跃。

**看点**:对 DevOps 读者有两个直接可借鉴点——① 用 `mise.toml` 把语言与包管理器版本钉死,是比 `.nvmrc` 更彻底的环境可复现方案;② 发行流程做了 `sha256.txt` + `latest.json` + `install.sh` 的完整分发索引,自建工具链发布时可以照搬。注意 PR 策略是 `collaborators_only`,外部贡献门槛较高。

---

## 3. [jev-chat/jev-chat-jarvis](https://github.com/jev-chat/jev-chat-jarvis) ⭐ 4,951

**Jev 聊天助手 — 手机上的「对话副驾」,只读屏幕、不替你发送**

`Kotlin` · Fork 977 · 创建于 09-21 · MIT

Android 端悬浮窗助手,通过系统无障碍服务读取微信 / QQ / X 私信 / 飞书当前屏幕上的对话,先用「判断模型」一次性输出对方真实意图、危险等级 1–9、该不该马上回,再由生成模型起草 3 条候选回复并排序。判断 / 回复 / 视觉三路接口可分别配置自己的 API Key,不经过任何中间服务器。明确不 hook、不改包、不调用 App 接口、不读数据库,回复只填进输入框,**任何情况下都不自动发送**,也不碰转账红包。

**看点**:这是一个把「能力边界」当作卖点写进 README 的项目——不 root、不注入、不自动发送、密钥存 App 私有空间。做内部工具时这种「显式列出我不做什么」的文档风格,比罗列功能更能降低合规评审成本。另一面也要清醒:无障碍服务读取聊天内容在企业环境中通常属高风险权限,别在办公设备上随手装。

---

## 4. [Mak5er/AirCard](https://github.com/Mak5er/AirCard) ⭐ 3,165

**AirCard — 免越狱定制 Apple Wallet 卡面与锁屏密码键盘主题**

`Swift` · Fork 135 · 创建于 09-16 · MIT

macOS 桌面工具,基于 `airlift`(AirTraffic 同步沙箱逃逸)实现,在 iOS 18+ 上无需越狱即可替换 Apple Pay / Wallet 卡面贴图,以及刷入 `.passthm` 锁屏数字键盘主题。带主题创作器(整张壁纸切片或逐键构建)、交互式取景、实时 iPhone 预览。打包成 Universal DMG,Apple Silicon 与 Intel 通用,设备通信工具与图像引擎全部预置,无需 Homebrew 或 Python 环境。

**看点**:与 AI 关键词无直接关系,靠搜索命中上榜,但持续保持热度反映「依赖系统漏洞的越狱替代品」在 iOS 生态的真实需求。工程角度可借鉴其零依赖分发思路:把所有 native 工具链打进 app bundle,用户端 setup 步骤降到零。提醒:底层是 sandbox escape exploit,iOS 补丁一到即失效,不建议在受 MDM 管控的办公设备上使用。

---

## 5. [jarrodwatts/jev-trader](https://github.com/jarrodwatts/jev-trader) ⭐ 2,128

**Jev Trader — 每个区块一次决策的低延迟做市 Agent(Monad 链上)**

`TypeScript` · Fork 408 · 创建于 09-16 · MIT

在 Monad 链上对 Kuru MON-USDC 订单簿做自动做市的 Agent,每个区块(约 300ms)只做一次 AI 决策:调用 TypeSafe Jev AI 模型(或本地动量启发式作为 mock)预测买卖概率,随后在盘口内侧一档挂 post-only 限价单赚取价差而非支付价差。为压住 300ms 预算,每个区块**只发两次 RPC 调用**——`eth_call` 读订单簿快照(约 18ms)、`eth_sendRawTransaction` 提交订单,回执处理、手续费估算等都挪到链下异步进行。提供 dry-run 模式,可用真实订单簿 + 模拟成交在无私钥情况下测试,并内置仓位上限、gas 费硬编码优化和成交回执状态追踪(下单成功/回滚/丢失三态)。

**看点**:本期唯一的链上交易类项目,工程价值不在「策略」而在「延迟预算工程」——把每区块的关键路径砍到两次 RPC、非关键操作全部异步化,这套「硬实时预算 + 关键路径最小化」的思路对任何低延迟服务(不止交易)都有参考意义。repo 自带 `bench-read.ts`、`dry-encode.ts` 两个基准脚本,把延迟和正确性验证做成了一等公民,这点值得 CI 流水线设计借鉴。提醒:这是链上自动化交易工具,涉及真实资金操作,非投资建议,使用前需充分理解私钥与资金风险。

---

## 今日趋势小结

**① 高 star 榜单出现明显「延续性」。** 本期 5 席中有 4 席与昨日重叠(jev-ultrafast、ZCode、jev-chat-jarvis、AirCard),星标仍在稳定上涨而非增速放缓,说明这几个项目已经从「爆发式关注」进入「持续沉淀」阶段,值得作为中期观察对象而非一次性速览。

**② 「延迟预算工程」成为跨领域的共同关键词。** jev-ultrafast 把浏览器协议调用压缩到 101 次,jev-trader 把每区块关键路径压到两次 RPC 调用,两者虽领域不同(UI 自动化 vs. 链上交易),但都在做同一件事:把不确定的模型推理挪出关键路径,只让确定性执行留在硬实时预算里。这对设计任何低延迟 CI/CD 或线上服务网关都有直接借鉴价值。

**③ 「能力边界声明」持续成为 README 标配。** jev-chat-jarvis 延续了「不自动发送」「不 root」的边界写法,jev-trader 同样在 README 里明确标注 dry-run 与真实资金操作的界限。对 DevOps/平台团队而言,这种把「我不做什么」显式写进文档的习惯,正在成为 AI 工具能否通过企业内部评审的关键因素。

---
*数据来源:GitHub Search API · 本文由每日定时任务自动生成*
