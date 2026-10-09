# Zhong 的个人主页 · V1

一个清爽、适配手机的个人主页，包含个人介绍、兴趣、近况、作品入口和数字分身资料问答。

## 本地预览

需要 Node.js 20 或更新版本，无需安装依赖。

```sh
npm run dev
```

访问终端显示的 `http://127.0.0.1:4173`。按 Ctrl+C 关闭。若端口占用，可通过环境变量 `PORT` 设置其他端口。

```sh
npm test          # 资料问答测试
npm run build     # 生成 dist/ 静态文件
npm run preview   # 预览 dist/，请先停止同端口的 dev 服务
```

## 数字分身的范围

V1 是**本地规则匹配的资料问答原型，尚未接入大模型**。支持自我介绍、最近在做、作品、联系、兴趣和个人方向，也能组合回答多个主题；不能自由推理或持续理解上下文。未提供的个人事实会明确说明，不编造学校、邮箱、微信或已完成的项目。

对话仅存在本页内存中；清空或刷新后消失。没有统计、追踪、外部字体、模型请求或 API Key。GitHub 联系入口采用需求中指定仓库的所属账号。

## 修改内容

- `index.html`：页面文案、项目和联系入口。
- `styles.css`：配色和响应式布局。
- `assets/avatar.svg`：Z 字母头像，可替换成自己的照片并更新 HTML 引用。
- `src/knowledge.js`：数字分身资料和匹配规则。
- `src/app.js`：会话和输入交互。

后续接入模型时，使用服务端代理保管 Key，并保留“只依据已确认个人资料回答”的约束。

## 发布

`npm run build` 后将 `dist/` 上传至任意静态托管平台即可，资源使用相对路径，支持 GitHub Pages 子路径部署。

GitHub Pages 也可直接使用仓库主分支根目录：在仓库 **Settings → Pages → Build and deployment** 选择 **Deploy from a branch**，分支 **main**、目录 **/(root)** 并保存。`.nojekyll` 禁用不需要的 Jekyll 处理。具体操作参考 [GitHub 官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。推送代码本身不代表已启用 Pages。

需求与实现取舍见 [设计说明](docs/v1-design.md)。
