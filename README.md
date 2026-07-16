# CodeDrobe Theme Studio

一个运行在 Windows 本机的 Codex 主题控制台。它不修改 `app.asar`、程序签名或 Codex 安装文件，而是通过仅绑定 `127.0.0.1` 的 Chrome DevTools Protocol (CDP) 在运行时应用或移除界面皮肤。

## 这个项目做了什么

- 在浏览器中提供主题管理、图片上传和一键操作入口。
- 将图片主题保存为本地主题源文件，并支持 CodeDrobe 的打包、探测、应用和恢复流程。
- 为 HeiGe 风格界面提供一键启动入口：完整背景皮肤、玻璃面板、顶部中间 `🎨` 主题菜单和本地图片换肤。
- 适配 Microsoft Store 版 Codex：由 CodeDrobe 负责关闭旧实例并以 CDP 端口 `9335` 重启，再由 HeiGe 注入界面。这样避开 Store 激活接口可能丢失调试参数的问题。
- 所有控制命令仅在本机执行；网页不是公网远程控制器。

## 借用的开源项目

| 项目 | 使用的部分 | 本项目的改进 |
| --- | --- | --- |
| [CodeDrobe Core](https://github.com/CodeDrobe/core) | Codex 发现、重启、CDP 端口启动、主题包、DOM 探测、验证和恢复能力。 | 将其作为 Windows / Store 版 Codex 的可靠启动层，并接入网页控制台。 |
| [HeiGe Codex Skin Studio](https://github.com/HeiGeAi/heige-codex-skin-studio) | HeiGe 皮肤 CSS、图片主题逻辑、顶部 `🎨` 菜单和运行时注入器。源码以 Git submodule 位于 `vendor/heige-codex-skin-studio`。 | 使用 CodeDrobe 启动 CDP 后再执行 HeiGe 注入，解决其 Store 版启动参数可能失效的问题；增加网页中的二次确认和错误日志。 |

CodeDrobe Core 使用 Apache-2.0；HeiGe Codex Skin Studio 使用 MIT。HeiGe 自带角色主题中的人物、游戏名称和图片素材不由软件许可证授权，使用前请阅读其 `NOTICE.md`，并优先使用自己的图片创建主题。

## 最方便的操作演示

### 首次运行

在项目文件夹打开 PowerShell：

```powershell
cd F:\codex-theme-studio
git submodule update --init --recursive
npm.cmd install
npm.cmd start
```

然后在浏览器打开：

```text
http://localhost:4173
```

保持这个终端窗口运行。关闭终端会停止本地网页和主题控制服务。

### 一键应用 HeiGe 界面

1. 在网页右上角点击 **应用 HeiGe UI**。
2. 在确认窗口点击 **关闭并应用**。
3. 当前 Codex 会关闭并重新打开。这会中断正在运行的任务，因此先保存工作。
4. 重启后的 Codex 顶部中间出现 `🎨`。
5. 点击 `🎨`，可切换 HeiGe 内置主题、恢复原生界面，或选择本地 PNG/JPG/WebP 图片创建主题。

该路径实际执行的是：

```text
网页按钮
  -> 本地 Node 服务
  -> CodeDrobe 以 9335 重启 Codex
  -> HeiGe 向 9335 注入皮肤 CSS 和菜单脚本
```

### 使用 CodeDrobe 主题工作流

网页中的图片主题功能会把图片保存到 `data/themes/`。应用前会进行主题打包和 DOM 探测；若探测失败，不会注入 CSS。

```text
上传图片 -> 自动提取配色 -> 生成主题源文件
-> 打包 .codedrobe-theme -> probe -> apply / verify
```

## 目录说明

```text
app.js / index.html / styles.css   网页工作台
server.mjs                         本地 HTTP API 与主题操作编排
scripts/apply-heige-ui.ps1         CodeDrobe 启动 + HeiGe 注入的包装脚本
vendor/heige-codex-skin-studio     HeiGe 上游 Git submodule
data/themes                        本机生成的主题与图片，不提交到 Git
```

## 安全与限制

- CDP 只监听 `127.0.0.1`，不向局域网或公网开放。
- 应用 HeiGe UI 会强制重启 Codex；不要在未保存任务时点击确认。
- 不要同时运行多个主题注入器或 watcher。切换不同注入方案前先恢复原生界面，避免样式叠加。
- 如果 HeiGe 启动失败，查看 `data/heige-apply.log` 获取 PowerShell 的最后一次输出。
- 若从 GitHub 新克隆项目，必须运行 `git submodule update --init --recursive`，否则 HeiGe 注入器不存在。
