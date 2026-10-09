# my_homepage

静态网站，使用 HTML 和 CSS，Node.js 提供本地预览、构建和测试脚本。无前端框架、后端或第三方依赖。

## 运行

需要 Node.js 20 或更新版本，无需安装依赖。

```sh
npm run dev      # http://127.0.0.1:4173
npm test         # 运行构建检查
npm run build    # 清理并生成 dist/
npm run preview  # 预览 dist/，请先停止同端口的 dev 服务
```

## 目录结构

- `index.html`：首页入口。
- `about/index.html`：About 页面。
- `posts/*/index.html`：文章页面。
- `styles.css`：全站样式与响应式布局。
- `assets/`：图片和网站图标。
- `scripts/serve.js`：本地静态服务器。
- `scripts/build.js`：静态文件构建脚本。
- `tests/`：构建检查。
- `dist/`：构建产物，不提交到 Git。

页面内容直接在对应 HTML 文件中编辑，样式统一在 `styles.css` 中修改。

## 发布

运行 `npm run build` 后，将 `dist/` 部署到静态托管平台。每次构建会清理并重新生成该目录，不要直接修改构建产物。

也可在 GitHub 仓库 Settings → Pages 中选择 main 分支的根目录发布。页面使用相对路径，支持子目录部署。
