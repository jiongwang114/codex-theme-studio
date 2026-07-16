# CodeDrobe Theme Studio

一个无需构建步骤的 Codex 主题工作台原型。直接在浏览器打开 `index.html` 即可预览。

## 当前能力

- 浏览并切换内置主题
- 上传 PNG、JPG、WebP 图片并自动提取配色
- 将上传图片保存为本次会话中的自定义主题
- 模拟主题即时应用和恢复原生外观
- 响应式布局，适合桌面和窄屏查看

## 运行

直接打开 `index.html`，无需安装依赖。

## 接入 CodeDrobe

当前版本是视觉和交互原型，不会修改 Codex。下一步可将“应用此主题”按钮接到 `@codedrobe/core` 的 `applySkin()`，把自定义主题打包成 `.codedrobe-theme` 并通过本机 CDP 可逆注入。
