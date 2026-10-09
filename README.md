# Zhong

以 [Zach Holman 当前首页](https://zachholman.com/) 为视觉参考的静态个人网站。

保留其首页的浅蓝底色、渐变介绍横幅、年份与日期文章列表、右侧简短介绍，以及“更多关于我”、文章阅读、社交链接和 Atom 订阅。内容采用 Zhong 提供的个人资料，文章是本次整理的简短介绍，不包含虚构的经历或历史文章。

上一版的数字分身、聊天脚本、卡片式内容区、顶部导航和按钮均已删除。历史版本可从 Git 记录中恢复。

## 运行

需要 Node.js 20 或更新版本，无需安装依赖。

```sh
npm run dev      # http://127.0.0.1:4173
npm test         # 确认打包不会残留已删除的代码
npm run build    # 清理并生成 dist/
npm run preview  # 预览 dist/，请先停止同端口的 dev 服务
```

## 内容在哪

- `index.html`：首页介绍、文章列表、侧栏。
- `styles.css`：全站样式与手机布局。
- `about/index.html`：个人介绍。
- `posts/*/index.html`：文章正文。
- `atom.xml`：文章订阅；增加文章时同步更新。
- `scripts/`：本地预览与静态打包，不参与网页运行。

网站没有前端 JavaScript、后端、API Key 或第三方请求。侧栏内容直接保存在各 HTML 文件中，修改个人资料时同步修改这四个页面。

## 发布

把 `dist/` 放到静态托管平台即可，支持 GitHub Pages 子目录部署。

也可以在 GitHub 仓库 Settings → Pages 选择 main 分支的根目录发布。当前 Atom 中 `xml:base` 使用预期的 Pages 地址 `https://rapeter.github.io/my_homepage/`；使用其他地址时须同步修改。代码推送不代表已启用公网托管。

复刻范围和验证记录见 [docs/reference.md](docs/reference.md)。
