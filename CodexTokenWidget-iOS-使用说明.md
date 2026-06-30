# Codex Token iOS 小组件使用说明

这个方案使用 iOS 上的 Scriptable。iPhone 端不能直接读取 Mac 的 `~/.codex`，所以流程是：

1. Mac 端定期生成一个 `codex-token-snapshot.json`
2. 把这个 JSON 放到 iPhone 能访问的 URL
3. Scriptable 小组件读取这个 URL 并渲染 token 使用量

## 一、Mac 端生成 JSON

在 Mac 上运行：

```bash
python3 /Users/julia_mac/Documents/Codex/2026-06-29/npm-error-if-you-believe-this/outputs/codex_token_snapshot_exporter.py \
  --output /tmp/codex-token-snapshot.json
```

生成的 JSON 字段包括：

```json
{
  "updated_at": "2026-06-30T10:00:00Z",
  "primary": {"label": "5小时", "used_percent": 38, "remaining_percent": 62, "resets_at": "..."},
  "secondary": {"label": "周限额", "used_percent": 54, "remaining_percent": 46, "resets_at": "..."},
  "today_tokens": 128000,
  "five_day_tokens": [{"date": "06-30", "tokens": 128000}],
  "status": "live"
}
```

## 二、让 iPhone 能访问 JSON

当前已经配置为上传到 GitHub，iOS 端建议使用这个 raw 直链：

```text
https://raw.githubusercontent.com/zhuwangjulia/icon_image/main/codex-token-snapshot.json
```

如果后续改用别的仓库，也可以把 `/tmp/codex-token-snapshot.json` 上传到 GitHub、Gist、对象存储或你已有的服务器，拿到 raw 直链。

临时测试也可以在 Mac 上开局域网服务：

```bash
cd /tmp
python3 -m http.server 8787
```

然后在 iPhone Safari 打开：

```text
http://你的Mac局域网IP:8787/codex-token-snapshot.json
```

能看到 JSON 就说明 Scriptable 也能读取。

## 三、Scriptable 配置

1. iPhone 安装 Scriptable
2. 新建脚本，命名为 `Codex Token`
3. 把 `CodexTokenWidget.scriptable.js` 的内容粘贴进去
4. 修改脚本顶部的：

```javascript
dataUrl: "https://example.com/codex-token-snapshot.json",
```

替换成你的 JSON raw 直链。

当前可填：

```javascript
dataUrl: "https://raw.githubusercontent.com/zhuwangjulia/icon_image/main/codex-token-snapshot.json",
```

也可以不改脚本，在桌面小组件的 Parameter 里填 JSON URL。

## 四、添加桌面小组件

1. 长按 iPhone 桌面
2. 点击左上角 `+`
3. 搜索 `Scriptable`
4. 选择小号或中号小组件
5. 添加后长按小组件，选择 `编辑小组件`
6. Script 选择 `Codex Token`
7. Parameter 填你的 JSON URL，或留空使用脚本内的 `dataUrl`

## 五、刷新说明

小组件脚本设置了约 10 分钟刷新一次，但 iOS 会自行调度，不能保证秒级实时。脚本会自动给 JSON URL 追加 10 分钟粒度的缓存参数，减少 GitHub 缓存旧数据的概率。

如果 `raw.githubusercontent.com` 在你的网络下读取失败，脚本内置了 fallback：

```text
https://github.com/zhuwangjulia/icon_image/raw/refs/heads/main/codex-token-snapshot.json
```

当前 Mac 端使用 launchd 每 10 分钟运行一次同步脚本：

```text
/Users/julia_mac/.codex/codex_token_github_sync.sh
```

它会生成 JSON、提交到 `zhuwangjulia/icon_image` 仓库并 push 到 GitHub。

如果小组件显示 `读取失败`，优先检查：

- iPhone Safari 是否能打开 JSON URL
- URL 是否是 raw 文件地址，而不是 GitHub 页面地址
- JSON 是否包含 `primary`、`secondary`、`today_tokens` 字段
