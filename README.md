# my_homepage

静态网站，使用 HTML、CSS 和原生 JavaScript，Node.js 提供笔记生成、本地预览、构建和测试脚本。无前端框架、后端或第三方依赖。

## 运行

需要 Node.js 20 或更新版本，无需安装依赖。

```sh
npm run dev      # http://127.0.0.1:4173
npm run notes    # 从 Markdown 重新生成 Notes 页面
npm run articles # 更新首页与文章页的字数、阅读时间和标签
npm test         # 运行构建检查
npm run build    # 清理并生成 dist/
npm run preview  # 预览 dist/，请先停止同端口的 dev 服务
```

## 目录结构

- `index.html`：首页入口。
- `about/index.html`：About 页面。
- `posts/*/index.html`：文章页面。
- `posts/collection.json`：文章 slug 与标签。
- `lab/agent/index.html`：Agent 工具调用过程演示。
- `assets/agent-demo.js`：演示数据、步骤切换和来源展开。
- `assets/profile-card.css`、`assets/profile-card.js`：首页个人卡片的外观、鼠标 / 触摸倾斜与键盘交互。
- `assets/profile-foil.svg`：个人卡片的全息纹理遮罩。
- `assets/about-contact.js`、`assets/wechat-qr.jpg`：首页侧栏与 About 联系图标共用的二维码交互与图片。
- `notes/*.md`：笔记原文。
- `notes/collection.json`：笔记标题、状态和更新日期。
- `notes/index.html`、`notes/*/index.html`：生成的笔记目录及阅读页。
- `styles.css`：全站样式与响应式布局。
- `assets/`：图片和网站图标。
- `assets/avatar.jpg`、`assets/favicon-avatar.ico`：页面头像及由同一头像生成的浏览器图标。
- `scripts/serve.js`：本地静态服务器。
- `scripts/build.js`：静态文件构建脚本。
- `scripts/notes.js`、`scripts/markdown.js`：笔记页面生成和 Markdown 转换。
- `scripts/articles.js`、`scripts/content-meta.js`：文章元信息生成、正文字数与阅读时间计算。
- `tests/`：构建检查。
- `dist/`：构建产物，不提交到 Git。

页面内容直接在对应 HTML 文件中编辑；全站布局在 `styles.css`，首页个人卡片的独立样式在 `assets/profile-card.css`。

## 首页个人卡片

卡片内容在 `index.html` 的 `data-profile-card` 区域编辑，复用 `assets/avatar.jpg`。鼠标移动或触摸卡片会改变倾斜角度与反光；移出或松开后复位。键盘聚焦后可用方向键倾斜，Esc 复位。尊重系统减少动态效果设置，停留不动时停止动画循环，不申请设备方向权限；关闭 JavaScript 后仍可查看卡片和使用邮件链接。

卡片参考 [React Bits Profile Card](https://reactbits.dev/components/profile-card)，适配为原生 HTML/CSS/JavaScript，未引入 React 或构建依赖。上游署名与许可证保留在 `assets/profile-card.LICENSE.txt`，会随静态资源一起发布。

## 更新笔记

1. 修改 `notes/agent-interview.md`，或用更新后的原文覆盖它。
2. 在 `notes/collection.json` 中更新对应的 `updated` 日期（`YYYY-MM-DD`）、状态及 `tags` 标签数组。
3. 运行 `npm run notes`，核对网页后提交 Markdown、元数据和生成的 HTML。

`npm run dev` 启动前和每次构建时也会自动生成笔记页面；开发服务运行期间修改 Markdown，需再运行一次 `npm run notes` 并刷新页面。不要直接修改生成的 Notes HTML。

新增笔记时，在 `notes/` 创建一个 Markdown 文件，并在 `collection.json` 增加条目；`slug` 应与文件名一致，使用小写字母、数字及连字符。

Markdown 支持标题、段落、列表、粗体、斜体、行内代码、代码块、引用和链接；`**Q数字…**` 独立行会生成题目标题和目录锚点。原始 HTML 按文字显示。

## 文章元信息

首页文章、文章阅读页、Notes 列表及笔记阅读页均显示日期、预计阅读时间、字数与标签。字数只计算正文（笔记包含正文标题和代码），汉字逐字计数，英文、数字串按词计数，不含标点、HTML 标签和链接地址。阅读时间按每分钟 300 个汉字、200 个英文词混合估算，向上取整，最少 1 分钟。

文章正文放在 `<!-- article-body -->` 与 `<!-- /article-body -->` 之间，日期保留在 `article-meta` 区域的 `<time datetime="YYYY-MM-DD">` 中。修改正文、日期或 `posts/collection.json` 的标签后，运行 `npm run articles`；Notes 更新运行 `npm run notes`。两者在启动开发服务前和构建时都会自动更新。

新增文章时，在 `posts/collection.json` 增加 slug 与标签，在对应文章页保留 `article-body`、`article-meta` 注释标记，并在首页文章条目中添加 `<!-- post-meta:slug --><!-- /post-meta:slug -->` 标记。生成的元信息不需要手工填写。

## 发布

运行 `npm run build` 后，将 `dist/` 部署到静态托管平台。每次构建会清理并重新生成该目录，不要直接修改构建产物。

也可在 GitHub 仓库 Settings → Pages 中选择 main 分支的根目录发布。页面使用相对路径，支持子目录部署。
