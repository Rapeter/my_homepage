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
- `assets/agent-demo.js`：情境选择、步骤切换和来源展开。
- `assets/agent-scenarios.js`：正常完成、超时重试、步数耗尽的预设步骤与对应结果。
- `assets/notes.js`：标签筛选、目录当前位置和本地阅读位置保存。
- `assets/note-search.js`：构建与浏览器共用的章节索引、关键词匹配、摘要和高亮分段。
- `assets/interview-draw.js`：Notes 随机抽题、题目链接与贴纸动效；两张角色 PNG 来自《ちいかわ》动画官网：[小八](https://www.anime-chiikawa.jp/images/loading/hachiware.png)、[乌萨奇](https://www.anime-chiikawa.jp/images/loading/usagi.png)。
- `assets/theme.js`、`assets/chiikawa-stars.svg`：全站主题偏好、页底模式开关与星星装饰。
- `assets/profile-card.css`、`assets/profile-card.js`：首页个人卡片的外观、鼠标 / 触摸倾斜与键盘交互。
- `assets/profile-foil.svg`：个人卡片的全息纹理遮罩。
- `assets/about-contact.js`、`assets/wechat-qr.jpg`：首页侧栏与 About 联系图标共用的二维码交互与图片。
- `notes/*.md`：公开的笔记正文及面试实录公开版。
- `notes/collection.json`：笔记分类、标题、状态、更新日期及面试日期。
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

首页介绍下方的四个导航链接与 `listening-note`（最近在听）在 `index.html` 编辑。`latest-note` 注释之间的最新笔记由 `npm run notes` 按 `updated` 日期自动更新，请保留该标记。

## 首页个人卡片

卡片内容在 `index.html` 的 `data-profile-card` 区域编辑，复用 `assets/avatar.jpg`。鼠标移动或触摸卡片会改变倾斜角度与反光；移出或松开后复位。键盘聚焦后可用方向键倾斜，Esc 复位。尊重系统减少动态效果设置，停留不动时停止动画循环，不申请设备方向权限；关闭 JavaScript 后仍可查看卡片和使用邮件链接。

卡片参考 [React Bits Profile Card](https://reactbits.dev/components/profile-card)，适配为原生 HTML/CSS/JavaScript，未引入 React 或构建依赖。上游署名与许可证保留在 `assets/profile-card.LICENSE.txt`，会随静态资源一起发布。

## Chiikawa 模式

每页底部都可切换 Chiikawa 模式。默认使用原浅蓝主题；开启后使用奶油色背景、浅蓝控件、静态星星装饰，以及已有的原版角色 PNG。主题样式集中在 `styles.css` 的 `data-theme="chiikawa"` 选择器中。

`assets/theme.js` 在样式表之前读取 `localStorage` 的 `zhong:theme`，取值为 `chiikawa` 或 `default`；更新根元素、浏览器主题色及页底按钮，支持同源多标签页同步。存储被禁用时仍可切换当前页，关闭 JavaScript 时保留默认主题与页面内容。手写 HTML 需保留头部脚本，Notes 页面由 `scripts/site.js` 自动加入相应相对路径。

## 更新笔记

1. 修改 `notes/agent-interview.md`，或用更新后的原文覆盖它。
2. 在 `notes/collection.json` 中更新对应的 `updated` 日期（`YYYY-MM-DD`）、状态及 `tags` 标签数组。
3. 运行 `npm run notes`，核对网页后提交 Markdown、元数据和生成的 HTML。

`npm run dev` 启动前和每次构建时也会自动生成笔记页面；开发服务运行期间修改 Markdown，需再运行一次 `npm run notes` 并刷新页面。不要直接修改生成的 Notes HTML。

新增笔记时，在 `notes/` 创建一个 Markdown 文件，并在 `collection.json` 增加条目；`slug` 应与文件名一致，使用小写字母、数字及连字符。

Markdown 支持标题、段落、列表、粗体、斜体、行内代码、代码块、引用和链接；`**Q数字…**` 独立行会生成题目标题和目录锚点。原始 HTML 按文字显示。

### 面试记录

新增面试时，创建脱敏后的 `notes/<slug>.md`，并在 `collection.json` 添加 `type: "interview"`、`interviewDate`、`company`、`role`、`round` 和普通笔记已有字段。`interviewDate` 表示实际面试日期，`updated` 表示公开版最后修订日期，两者独立展示。列表按实际面试日期／学习笔记更新日期倒序排列；首页按更新日期选最新条目，同日更新时以面试日期排序。

正文用 `## 主题` 和 `### Q01｜问题` 组织；反问使用 `R01`，直接反馈使用 `F01`。题号生成稳定链接，目录按标题层级嵌套；页面不重复 Markdown 首行 H1。问答保持纵向展开；比较表格使用普通 Markdown 表格，单元格同样转义 HTML。页面提供「下载公开版」。

`notes/` 中的 Markdown 随网站一起公开。私有原稿、视频、转写片段和未脱敏附件应留在仓库外；只更新公开版正文。现有面试正文不包含录屏时间戳，问答、面试官说明与后续学习提醒分别保留。更新后运行 `npm run notes`。

分类保存在 URL 的 `?category=interview` 或 `?category=learning` 参数中，标签筛选可与分类同时使用；切换分类会重置标签。

### 全文搜索

Notes 顶部提供学习笔记与面试记录全文搜索，范围是 `notes/collection.json` 中声明的公开条目。匹配标题、描述、标签及正文，支持中文子串、英文大小写不敏感和空格分隔的多关键词（全部关键词均须命中）。结果按相关度排序，附高亮摘要和章节链接；前三个匹配章节直接显示，其余可展开。

`npm run notes` 将公开 Markdown 的渲染正文提取为章节文本，按实际目录锚点生成索引，转义后嵌入 `notes/index.html` 的 `note-search-index` 数据块，不读取仓库外私有原稿。浏览器本地完成搜索，无后端、外部搜索服务或新增依赖。更新笔记时重新生成页面即可同步索引。

搜索词保存在 `?q=`，可与 `category`、`tag` 组合；输入时替换当前历史状态，分类、标签和清除操作保留前进／后退记录。输入上限 160 字符，支持中文输入法组合输入。关闭 JavaScript 时仍显示完整笔记列表与普通链接。

「乌萨奇抽一题」复用索引中的 `interview` 类型及 `Q` 题目锚点。抽题范围是全部已公开面试题，与当前搜索及筛选无关；有多道题时连续抽取不会重复上一题。点击结果打开原题章节。贴纸动效由点击触发，尊重系统减少动态效果设置。

Notes 列表按 `tags` 生成筛选按钮，选中标签保存在 URL 的 `?tag=` 参数中，可以复制链接或通过浏览器前进、后退切换。详情页目录标记当前章节；阅读位置按页面路径保存在浏览器 `localStorage`，再次打开时点击「继续阅读」恢复，不跨设备同步。带章节锚点的链接优先定位到指定章节。存储不可用或关闭 JavaScript 时，正文和目录链接仍可阅读。

## Agent 演示

所有情境在浏览器本地回放预设数据，不调用模型或真实工具。`assets/agent-scenarios.js` 中维护步骤、工具输入输出、策略说明和结果；`assets/agent-demo.js` 负责界面。切换情境会重置进度。步数耗尽情境仅展示已读取资料的部分结果，并标注未完成。

## 文章元信息

首页文章、文章阅读页、Notes 列表及笔记阅读页均显示日期、预计阅读时间、字数与标签。字数只计算正文（笔记包含正文标题和代码），汉字逐字计数，英文、数字串按词计数，不含标点、HTML 标签和链接地址。阅读时间按每分钟 300 个汉字、200 个英文词混合估算，向上取整，最少 1 分钟。

文章正文放在 `<!-- article-body -->` 与 `<!-- /article-body -->` 之间，日期保留在 `article-meta` 区域的 `<time datetime="YYYY-MM-DD">` 中。修改正文、日期或 `posts/collection.json` 的标签后，运行 `npm run articles`；Notes 更新运行 `npm run notes`。两者在启动开发服务前和构建时都会自动更新。

新增文章时，在 `posts/collection.json` 增加 slug 与标签，在对应文章页保留 `article-body`、`article-meta` 注释标记，并在首页文章条目中添加 `<!-- post-meta:slug --><!-- /post-meta:slug -->` 标记。生成的元信息不需要手工填写。

## 发布

运行 `npm run build` 后，将 `dist/` 部署到静态托管平台。每次构建会清理并重新生成该目录，不要直接修改构建产物。

也可在 GitHub 仓库 Settings → Pages 中选择 main 分支的根目录发布。页面使用相对路径，支持子目录部署。
