# CodeDrobe Theme Studio

一个本地运行的 Codex 主题工作台。它使用 CodeDrobe 的本机 CDP 运行时，主题不修改 `app.asar` 或 Codex 安装文件。

## 当前能力

- 浏览并切换内置主题
- 上传 PNG、JPG、WebP 图片并自动提取配色
- 将上传图片保存为本次会话中的自定义主题
- 将主题打包为标准 `.codedrobe-theme`
- 在应用前探测 Codex DOM 兼容性，再通过本机 CDP 可逆注入
- 一键恢复原生外观
- 响应式布局，适合桌面和窄屏查看

## 运行

```powershell
npm.cmd start
```

然后打开 `http://localhost:4173`。`@codedrobe/core` 已作为项目本地依赖安装，无需全局安装或额外运行 `npx`。

## 接入 CodeDrobe

上传图片会被保存为本地主题源文件，点击应用时依次执行 `theme pack`、`probe`、`apply`。若探测失败，服务会停止，不会注入 CSS。服务不使用 `--restart-existing`，因此不会自行关闭正在运行的 Codex；当主题变更需要重启时，CodeDrobe 会明确报告该状态。
