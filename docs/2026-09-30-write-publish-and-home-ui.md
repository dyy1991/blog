# 设计文档：/write 在线发布(方案B) + 首页美化 + 导航精简

> 日期:2026-09-30
> 状态:已确认方案,待实现 → 实现中
> 涉及文件见文末清单。本文档先于代码落盘,便于会话中断后恢复。

---

## 1. 背景

当前发布流程:`/write` 页写作 → `Download .md` → 手动放入 `content/posts/` → git commit/push → GitHub Actions(tsc/lint → 构建镜像 → SSH 部署 → 健康检查)。

文章是构建期打进 Docker 镜像的,容器无文章持久化卷,所以"在线编辑直接保存"此前不可行。已确认走 **方案B(Git-native)**:`/write` 页直接调 GitHub Contents API 把 .md commit 到仓库,复用现有 CICD,不动部署架构,保留版本历史与 CI 检查。

## 2. 方案B:/write 在线发布

### 2.1 鉴权与配置

- Token 采用 **fine-grained PAT**,只授予 `dyy1991/blog` 仓库的 `Contents: Read and write` 权限。
- Token **只存在作者浏览器的 localStorage**(key: `write-gh-config`),不进服务器、不进环境变量、不进代码。
  - 理由:博客站点是公开的,`/write` 页任何人都能打开;如果做成服务端 API 持有 token,还得再造一套访问口令(类似 NOVEL_ACCESS_KEY),多一处泄露面。而 localStorage 方案下,没有 token 的访客点发布只会得到"未配置"提示,天然无害。
  - 代价:换浏览器要重新粘一次 token。可接受。
- 配置项:`owner`(默认 `dyy1991`)、`repo`(默认 `blog`)、`branch`(默认 `main`)、`token`。页面提供折叠的"⚙ 发布设置"面板,保存即写 localStorage。

### 2.2 发布流程

```
点击 Publish
  ├─ 校验:标题非空、token/owner/repo 已配置
  ├─ path = content/posts/{slug}.md   (slug 规则与下载一致)
  ├─ GET /repos/{o}/{r}/contents/{path}?ref={branch}
  │     ├─ 404 → 新文章,直接 PUT
  │     └─ 200 → 已存在:第一次点击只提示"同名文章已存在,再点一次覆盖",
  │              第二次点击带上 sha 走更新(避免用 window.confirm 阻塞)
  ├─ PUT /repos/{o}/{r}/contents/{path}
  │     body: { message: "post: {title}", content: base64(frontmatter+正文), branch, sha? }
  └─ 成功 → 显示 commit 链接 + Actions 链接,提示"CI 部署约需几分钟"
```

- `api.github.com` 支持 CORS,浏览器直连即可,无需服务端中转。
- base64 需 UTF-8 安全编码:`TextEncoder` → 二进制串 → `btoa`(中文内容必须走这条路,直接 `btoa` 会抛异常)。
- frontmatter 拼装逻辑与现有 `Download .md` 共用同一个 `buildMarkdown()`,保证两条通路产物一致。
- 错误处理:401 → token 无效/过期;403 → 权限不足或限流;404(PUT 时)→ owner/repo/branch 配置错;409/422 → 提示重试。所有状态用页面内联条显示,不用弹窗。

### 2.3 附带改进

- 草稿自动保存:content + meta 定时(800ms 防抖)写 localStorage(key: `write-draft`),页面加载时恢复,防止误关浏览器丢稿。
- `Download .md` 保留,作为无网络/无 token 时的兜底。

### 2.4 不做的事

- 不做服务端发布 API、不加服务器环境变量、不改 deploy.yml。
- 不做文章列表/删除/改名的在线管理(以后需要再说)。

## 3. 导航精简:下拉菜单

现状 7 个顶级入口:home / blog / write / support / checkin / novel / about,太挤。

- 新建客户端组件 `components/NavMenu.tsx`,`app/layout.tsx` 的导航区替换为 `<NavMenu />`。
- 结构:
  - 顶级保留:`~/home` `~/blog` `~/write` `~/about`
  - 新增下拉 `~/lab ▾`,收纳:`support`、`checkin`、`novel`(都是工具型子应用,归为"实验室"语义)。
- 交互:点击开合;点击外部、按 Esc、路由变化时关闭;当前路由高亮(绿色);下拉内当前项也高亮。移动端同样可用(点击交互,无 hover 依赖)。

## 4. 首页两侧动效

`main` 限宽 `max-w-5xl`(64rem),宽屏两侧留白。新建客户端组件 `components/SideFx.tsx`,只在 `app/page.tsx`(首页)挂载。

- **左侧:Matrix 代码雨**。`<canvas>` 实现,字符集用代码符号(`{ } < > / = ; 0 1 $ # λ` 等),绿色拖尾,低不透明度(整体 ≤0.35),不抢内容视觉。
- **右侧:CI/CD 流水线动画**。贴合博客主题——竖排五个节点 `git push → lint → build → deploy → online`,节点依次呼吸点亮,一颗光点沿管线循环下行;背景飘若干随机 commit hash(`a3f9c21` 风格)缓慢上浮消隐。
- 工程约束:
  - 仅 `≥1280px` 视口显示(CSS media query),宽度 `calc((100vw - 66rem)/2)`、上限 260px,`position: fixed`,`pointer-events: none`,`aria-hidden="true"`,上下边缘用 mask 渐隐。
  - `prefers-reduced-motion: reduce` 时:CSS 动画全停,canvas 只画一帧静态。
  - 随机内容(hash、雨滴)一律在 `useEffect` 挂载后生成,避免 SSR 水合不匹配。
  - canvas 用 `requestAnimationFrame`,标签页后台时浏览器自动暂停,无额外功耗。

## 5. 验收清单

- [ ] `npx tsc --noEmit` 通过(CI Job 0 关卡)
- [ ] `npm run lint` 通过(CI Job 0 关卡)
- [ ] `/write` 无 token 时:Publish 给出配置提示,不报错
- [ ] `/write` 配好 token:新文章一键发布,返回 commit 链接;同名文章二次确认后覆盖
- [ ] 发布的 md 与 Download 的 md 内容一致(frontmatter + 正文)
- [ ] 导航:桌面/移动端下拉均可开合,外点/Esc 关闭,当前路由高亮
- [ ] 首页:≥1280px 显示两侧动效,窄屏隐藏;动效不遮挡、不可点选
- [ ] `prefers-reduced-motion` 下无动画

## 6. 文件变更清单

| 文件 | 动作 | 说明 |
|---|---|---|
| `docs/2026-09-30-write-publish-and-home-ui.md` | 新增 | 本文档 |
| `app/write/page.tsx` | 修改 | 发布设置面板 + Publish 到 GitHub + 草稿自动保存 |
| `components/NavMenu.tsx` | 新增 | 带下拉的导航组件 |
| `app/layout.tsx` | 修改 | 导航区替换为 `<NavMenu />` |
| `components/SideFx.tsx` | 新增 | 首页两侧动效(代码雨 + CI/CD 流水线) |
| `app/page.tsx` | 修改 | 挂载 `<SideFx />` |
| `app/globals.css` | 修改 | 动效/导航所需样式与 keyframes |

不改:`deploy.yml`、`docker-compose.yml`、`Dockerfile`、`lib/posts.ts`、服务器任何配置。

---

## 附录(2026-09-30 追加):速报发布链路的 frontmatter 防线

**事故**:9-28 定时任务生成的速报 excerpt 含未转义英文双引号 → YAML 解析失败 → `getAllPosts()` 抛异常 → 首页 500。

**三层防线**(由外到内):
1. **生成端**:定时任务(Daily github brief)提示词第 4 步补充转义规则——值内英文双引号写 `\"` 或改用中文引号「」。提示词约束是软的,所以还有:
2. **发布关卡**:新增 `scripts/validate-posts.sh`(纯 bash/grep/awk,零依赖,沙盒必可用),`publish-brief.sh` 在 commit 前调用;frontmatter 不合法 → 拒绝 commit/push 并打印出错文件与行,修复后重跑即可。坏文件从此进不了仓库。
3. **运行时兜底**:`lib/posts.ts` 单篇解析失败时跳过该篇并 console.warn,一篇坏文章不再带崩整站(本次已修)。

校验器覆盖:首行/闭合 `---`、`title|date|category|excerpt` 的双引号标量(含 `\"` 转义)、`tags` 数组格式、模板外的溢出行;兼容 CRLF。
