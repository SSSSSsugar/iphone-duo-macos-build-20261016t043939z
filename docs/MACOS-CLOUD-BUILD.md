# macOS 云构建

使用 `.github/workflows/macos-package.yml` 在 GitHub 的 macOS 机器上构建当前源码。
本地的自提、联系人、门店搜索及商品列表修改都会随源码一起构建。

## 触发构建

将源码上传到自己的 GitHub 仓库的 `codex/macos-package` 分支会自动构建。
也可在仓库的 Actions 页面选择 **macOS app packages → Run workflow**。
首次使用 Actions 时，GitHub 可能要求先为仓库启用 Actions。

只上传源码，不要上传 `.local-data`、`.local-runtime`、`.venv`、`.tools`、
`node_modules`、`local-web-release`、浏览器配置、日志及账号/付款 JSON。
这些目录不属于构建输入。Windows 上的已编译 worker 也不能用于 Mac。

## 下载应用

两个任务均成功后，在本次 Actions 运行底部的 Artifacts 下载：

- `DUO-Killer-mac-arm64`：Apple 芯片 M 系列。
- `DUO-Killer-mac-x64`：Intel 芯片。

每份包含 `.dmg`、`.app.zip`、安装说明和 SHA-256 校验文件。
打开 DMG，把应用拖到 Applications；或者解压 `.app.zip` 后复制应用。
编译后的应用内置 Python，但登录仍需要 Chrome 或 Edge。
这两个版本分别原生编译，并非同一个通用架构安装包。

## 构建校验和限制

流水线运行 worker 回归测试、前端类型检查和构建、Rust 引擎测试，
并执行打包后 app 内的 worker 离线检查，同时核对主程序和 worker 的 CPU 架构。
这些检查不登录 Apple、不创建真实订单，也不付款。

应用未配置 Apple Developer 发行签名或公证。首次打开相关提示的处理方式见
[Apple 官方说明](https://support.apple.com/zh-cn/102445)。

私有仓库可能消耗 GitHub Actions 额度；额度、计费与是否需要验证由 GitHub 账号设置决定。
生成的构建产物保留 14 天，建议完成后及时下载。
