---
title: "每日 GitHub 开源速报 · 2026-09-22"
date: "2026-09-22"
category: "github-brief"
tags: ["GitHub", "开源", "AI", "LLM", "Agent"]
excerpt: "近 7 天新晋高 star 项目 Top 5:jev-ultrafast、ZCode、jev-chat-jarvis、jianying-headless、AirCard。Agent 竞争从「能不能做」转向「多快多便宜」,安全边界成为 README 的第一段。"
---

# 每日 GitHub 开源速报 · 2026-09-22

> 关键词:AI / LLM / Agent · 范围:近 7 天新晋高 star 项目 · Top 5

---

## 1. [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast) ⭐ 17,303

**Jev Ultrafast — 用「动态索引动作空间」把 browser agent 做到秒级**

`Python` · Fork 1,097 · 创建于 09-16 · MIT

Browser Use 团队的新作,核心思路是抛弃截图驱动:每次观察把页面渲染成一张带编号的元素表(`[1] button · [2] combobox · ...`),模型只在 `CLICK / TYPE_TEXT / SELECT / SCROLL / WAIT / DONE / BLOCKED` 这套固定操作集里选一个操作 + 一个目标,且操作头与目标头在**同一次网络请求**里推测性并发下发(speculative fan-out),只有选中 `TYPE_TEXT` 时才让一个小模型生成文本。官方给出的基准:Google Flights 一次真实机票查询 **7.07 秒**完成,相比旧版中位耗时 9.450s → 7.092s(-25%),浏览器协议调用从 1,092 次降到 101 次。README 明确标注这只是单任务三次重复,不是通用可靠性基准。

**看点**:安全边界设计很值得抄——「模型输出绝不变成 selector、坐标、shell 命令或可执行 JS」,所有目标必须从已观测的 DOM 节点解析,执行前重新校验页面新鲜度和点击遮挡。对做 UI 自动化测试 / E2E 流水线的人来说,这套「结构化状态 + 白名单动作 + 执行期二次校验」比 vision agent 更容易在 CI 里跑稳、跑便宜。

---

## 2. [zai-org/ZCode](https://github.com/zai-org/ZCode) ⭐ 6,115

**ZCode — 智谱的 AI 编程工作台(Desktop + Web + 终端 Agent 三合一)**

`TypeScript` · Fork 1,764 · 创建于 09-20 · Apache-2.0

Z.ai 开源的 coding agent harness,一个 monorepo 同时交付三种形态:Electron 桌面应用、浏览器工作台、以及终端里的 `zcode` CLI/TUI,三者共用同一套 Agent 运行时。发行包把 TUI、Web 和 Agent 打成一个独立运行包,`zcode` 无参数进 TUI、`zcode --web` 起本地 Web(默认只监听 127.0.0.1,监听非本机地址时自动生成访问令牌)。还内置了 SSH / WSL 远程工作区能力,资源走本地构建 + SFTP 上传而非 CDN。工程侧用 pnpm workspace + mise 锁定 Node 24.14.0 / pnpm 10.33.2。

**看点**:对 DevOps 读者有两个直接可借鉴点——① 用 `mise.toml` 把语言与包管理器版本钉死,是比 `.nvmrc` 更彻底的环境可复现方案;② 发行流程做了 `sha256.txt` + `latest.json` + `install.sh` 的完整分发索引,等于把一套轻量 release channel 写进了仓库,自建工具链发布时可以照搬。注意 PR 策略是 `collaborators_only`,外部贡献门槛较高。

---

## 3. [jev-chat/jev-chat-jarvis](https://github.com/jev-chat/jev-chat-jarvis) ⭐ 2,782

**Jev 聊天助手 — 手机上的「对话副驾」,只读屏幕、不替你发送**

`Kotlin` · Fork 717 · 创建于 09-21 · MIT

Android 端悬浮窗助手,通过系统无障碍服务读取微信 / QQ / X 私信 / 飞书当前屏幕上的对话(飞书正文是自绘控件,改用 ML Kit 离线 OCR 兜底),先用「判断模型」一次性输出对方真实意图、危险等级 1–9、该不该马上回,再由生成模型起草 3 条候选回复并排序。判断 / 回复 / 视觉三路接口可分别配置自己的 API Key,不经过任何中间服务器。明确不 hook、不改包、不调用 App 接口、不读数据库,回复只填进输入框,**任何情况下都不自动发送**,也不碰转账红包。

**看点**:这是一个把「能力边界」当作卖点写进 README 的项目——不 root、不注入、不自动发送、密钥存 App 私有空间、聊天记录默认不落盘。做内部工具时这种「显式列出我不做什么」的文档风格,比罗列功能更能降低合规评审成本。另一面也要清醒:无障碍服务读取聊天内容本身在企业环境中通常属高风险权限,别在办公设备上随手装。

---

## 4. [mcncarl/jianying-headless](https://github.com/mcncarl/jianying-headless) ⭐ 2,428

**Jianying Headless — 给剪映专业版做的本地 headless 自动化 + Agent Skill**

`Python` · Fork 1,830 · 创建于 09-15 · 个人学习/非商业许可(NOASSERTION)

把「结构化剪辑计划 JSON → 可编辑剪映草稿 → 本机引擎原生导出 MP4」串成一条命令行流水线,支持多轨、变速、画中画、字幕、关键帧动画和静态蒙版转场,并提供配套 Agent Skill 供 AI 视频工作流调用。运行环境卡得极死:Apple Silicon + macOS 26.0+、剪映 11.5.0(兼容 11.4.2),会校验应用版本、build、官方库哈希、签名与开发者身份,不匹配直接拒绝运行而非放宽校验。README 罕见地用大篇幅写「当前限制」与「验收状态」:复合片段只支持实验性冻结快照、图片/GIF 偶发少一帧根因未解决、干净机器安装验收尚未完成。

**看点**:1,830 fork 对 2,428 star——fork/star 比接近 0.75,在新项目里极不寻常,通常意味着大量人在拿它做私有改造而非单纯收藏。工程上最值得学的是它的 `doctor` 子命令:把环境前置检查做成一等公民,并且明确声明「检查通过 ≠ 任意草稿可用」,这正是 CI 里 preflight check 应有的诚实度。注意许可证是非商用。

---

## 5. [Mak5er/AirCard](https://github.com/Mak5er/AirCard) ⭐ 2,425

**AirCard — 免越狱定制 Apple Wallet 卡面与锁屏密码键盘主题**

`Swift` · Fork 101 · 创建于 09-16 · MIT

macOS 桌面工具,基于 `airlift`(AirTraffic 同步沙箱逃逸)实现,在 iOS 18+ 上无需越狱即可替换 Apple Pay / Wallet 卡面贴图,以及刷入 `.passthm` 锁屏数字键盘主题。带主题创作器(整张壁纸切片或逐键构建)、交互式取景、实时 iPhone 预览,并能直接打开编辑 Cowabunga / Nugget 主题包。打包成 Universal DMG,Apple Silicon 与 Intel 通用,设备通信工具与图像引擎全部预置,无需 Homebrew 或 Python 环境。

**看点**:严格说这是本期唯一与 AI 无关的项目,能进榜是因为搜索词命中——但它反映了另一条真实趋势:**依赖系统漏洞的「越狱替代品」在 iOS 生态持续有巨大需求**。工程角度可借鉴的是它的零依赖分发思路:把所有 native 工具链打进 app bundle,用户端 setup 步骤降到零。需要提醒的是,底层是 sandbox escape exploit,iOS 补丁一到即失效,且此类工具不建议在有 MDM 管控的工作设备上使用。

---

## 今日趋势小结

**① Agent 的竞争焦点从「能不能做」转向「多快多便宜」。** jev-ultrafast 用结构化元素表 + 单次请求双头推测,把浏览器 agent 的协议调用砍掉 90%;这条路线的本质是拿确定性工程换掉模型的自由度,和一年前堆截图堆上下文的思路正好相反。

**② 安全与能力边界正在成为 README 的第一段而不是最后一段。** 本期三个高 star 项目(jev-ultrafast、jev-chat-jarvis、jianying-headless)都把「模型输出不可信」「不自动发送」「版本哈希不匹配即拒绝运行」写在显眼位置。对 DevOps 而言这是好信号:AI 工具正在学会用 fail-closed 的方式描述自己,这让它们更容易通过内部评审、也更容易塞进流水线。

**③ 「本地优先 + 自带工具链」的分发形态成主流。** ZCode 的 sha256 + latest.json + install.sh 自建发布索引、AirCard 的 Universal DMG 零前置依赖、jianying-headless 的 `doctor` 前置检查,三者都在解决同一个问题:如何让工具在别人的机器上可复现地跑起来。这恰恰是 CI/CD 的核心命题,值得反向借鉴到内部工具的发布流程里。

---
*数据来源:GitHub Search API · 本文由每日定时任务自动生成*
