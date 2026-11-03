# 门骨动作片 · 免费发布

游戏已完整放入 `docs/`，无需安装依赖或构建。角色为云宝宝和泰风，首页标题为“云泰跳跳跳”。

## 启用 GitHub Pages

GitHub Free 的 Pages 要求公开仓库。如果仓库还是 Private，需要先在 Settings → General → Danger Zone → Change repository visibility 改为 Public。注意：这会公开整个仓库及其提交历史，不只是游戏网页。

然后进入 Settings → Pages，在 Build and deployment 中设置：

- Source：Deploy from a branch
- Branch：main
- Folder：/docs
- 点击 Save

等待 GitHub 构建完成，以 Pages 设置页显示的实际网址为准。按当前账号和仓库名称，预计地址为：

https://zzzyero.github.io/my-web-project/

启用前，这个地址不是可用网站。可以到仓库 Actions 查看 Pages 构建进度。

## 修改与同步

修改 `docs/` 下的文件并提交到 main，会触发后续自动发布。所有运行资源均为相对路径，支持仓库子目录地址。

最高分保存在当前浏览器。旧站点与新域名的浏览器存储互相独立，旧最高分不会自动迁移。

GitHub Pages 免费，但不同国内网络的访问速度、可用性可能有差异。上线后请用手机实测。背景歌曲尚未加入：需先提供可以用于公开游戏的音频素材。
