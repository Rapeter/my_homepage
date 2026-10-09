# V1 Implementation Plan

**Goal:** 完成需求文档中的个人主页原型，验证后推送 GitHub。
**Architecture:** 静态单页；资料回答逻辑独立于 DOM；Node 提供预览和静态打包。
**Tech Stack:** HTML / CSS / ES modules / Node built-in test runner。
**Spec:** [v1-design.md](v1-design.md)

## 实现步骤

- [x] 为 `getReply(question)` 编写知识范围、三种常见问题、多主题、空输入和未知问题测试，运行确认失败。
- [x] 在 `src/knowledge.js` 实现回答逻辑，运行测试通过。
- [x] 在 `index.html`、`styles.css`、`src/app.js`、`assets/avatar.svg` 实现响应式布局与会话。
- [x] 在 `scripts/` 提供仅本机预览服务器和静态构建脚本，README 说明使用和原型边界。
- [x] 运行单元测试、构建和浏览器检查：桌面、手机、快捷问答、自由输入、清空、空白、输入安全、键盘与控制台。

交付动作：检查 Git diff，提交并 push 到 origin/main，验证远端提交。

## Review focus

未知个人事实不可编造；多主题输入应同时回答；HTML 输入不能执行；输入法 Enter 不能误发送；手机聊天长文本不能挤出页面。
