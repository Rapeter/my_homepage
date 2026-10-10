# my_homepage

静态网站，使用 HTML、CSS 和原生 JavaScript，Node.js 提供笔记生成、本地预览、构建和测试脚本。无前端框架、后端或第三方依赖。

## 运行

需要 Node.js 20 或更新版本，无需安装依赖。

```sh
npm run dev      # http://127.0.0.1:4173
npm run notes    # 从 Markdown 重新生成 Notes 页面
npm test         # 运行构建检查
npm run build    # 清理并生成 dist/
npm run preview  # 预览 dist/，请先停止同端口的 dev 服务
```

## 目录结构

- `index.html`：首页入口。
- `about/index.html`：About 页面。
- `posts/*/index.html`：文章页面。
- `lab/agent/index.html`：Agent 工具调用过程演示。
- `assets/agent-demo.js`：演示数据、步骤切换和来源展开。
- `notes/*.md`：笔记原文。
- `notes/collection.json`：笔记标题、状态和更新日期。
- `notes/index.html`、`notes/*/index.html`：生成的笔记目录及阅读页。
- `styles.css`：全站样式与响应式布局。
- `assets/`：图片和网站图标。
- `scripts/serve.js`：本地静态服务器。
- `scripts/build.js`：静态文件构建脚本。
- `scripts/notes.js`、`scripts/markdown.js`：笔记页面生成和 Markdown 转换。
- `tests/`：构建检查。
- `dist/`：构建产物，不提交到 Git。

页面内容直接在对应 HTML 文件中编辑，样式统一在 `styles.css` 中修改。

## 更新笔记

1. 修改 `notes/agent-interview.md`，或用更新后的原文覆盖它。
2. 在 `notes/collection.json` 中更新对应的 `updated` 日期（`YYYY-MM-DD`）及需要修改的状态。
3. 运行 `npm run notes`，核对网页后提交 Markdown、元数据和生成的 HTML。

`npm run dev` 启动前和每次构建时也会自动生成笔记页面；开发服务运行期间修改 Markdown，需再运行一次 `npm run notes` 并刷新页面。不要直接修改生成的 Notes HTML。

新增笔记时，在 `notes/` 创建一个 Markdown 文件，并在 `collection.json` 增加条目；`slug` 应与文件名一致，使用小写字母、数字及连字符。

Markdown 支持标题、段落、列表、粗体、斜体、行内代码、代码块、引用和链接；`**Q数字…**` 独立行会生成题目标题和目录锚点。原始 HTML 按文字显示。

## 发布

运行 `npm run build` 后，将 `dist/` 部署到静态托管平台。每次构建会清理并重新生成该目录，不要直接修改构建产物。

也可在 GitHub 仓库 Settings → Pages 中选择 main 分支的根目录发布。页面使用相对路径，支持子目录部署。
