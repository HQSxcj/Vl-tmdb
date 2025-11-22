# Vl-tmdb


通过合理利用 **Cloudflare** 和 **Vercel** 的全球边缘网络节点的免费套餐，部署代理 **TMDB** 的 `api.tmdb.org` 和 `image.tmdb.org` 两个接口的 JSON 节目信息和图片代理转发，让被屏蔽的 **Emby** 流畅恢复刮削 **TMDB** 的节目信息和节目图片。

不需要借助修改 host 节点方法和魔法网络工具代理。

＜ 打个广告🌟 emby-nginx助手[ GitHub 地址](https://github.com/HQSxcj/emby-nginx) ＞

**网盘媒体服务器专家级 Nginx 工具**

## 🚀 一键部署（两个都要部署）

## Vl-tmdb - TMDB 图片代理

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/HQSxcj/Vl-tmdb)

## 跳转至 Cf-tmdb 仓库 部署 API 代理

[![跳转到 Cf-tmdb](https://img.shields.io/badge/跳转到-Cf--tmdb%20仓库-blue?style=for-the-badge&logo=github)](https://github.com/HQSxcj/Cf-tmdb)

## 📋 必备要素

1. 一个域名 - 并托管至 **Cloudflare**
2. 一个 **GitHub** 账号 - 需要魔法网络登录申请
3. **Emby** 里的神医助手插件 - 2.0 或 3.0 版

## 🔧 部署步骤

### 自动部署

1. Fork 本仓库到你的 GitHub 账户  
2. 连接 **Vercel**：  
   - 点击上方 **Deploy to Vercel** 按钮  
   - 授权 GitHub 账户  
   - 选择 **Vl-tmdb** 仓库  


3. 部署完项目绑定自定义域名，也就是托管在 cloudflare 的域名的子域名

   - vercel 绑定子域名 → 点开项目主页 → 右上角 Domains(域名） → Add Domain)添加域名 → 填个 cloudflare 托管主域名的子域名 例:主 abc.com 子域名可以:vl.abc.com  → Save(保存）→ 点开红色字体旁的 learn more → 点击 Configure Automatically(自动配置）
就跳转进 couldflare 网站 点击 授权  然后回到这个页面 就绑定成功了

# 使用方式

Emby 神医助手配置

在神医助手 → 元数据增强 → 使用代替 TMDB 配置

	•	代替 TMDB API 地址：Workers 自定义域名 例: https://cf.abc.com
	•	代替 TMDB 图像 地址：Vercel 自定义域名  例: https://vl.abc.com

#### 填完后保存，重启 Emby 服务器 即可生效。

## 部署效果

   利用cloudflare workers的快速的边缘计算去先一步匹配节目信息的json信息。
   emby 通过接收到的 json 信息里的图片字符串拼接出完整的图片url链接
   返回图片url链接让 Vercel 的 cdn 优秀的图像缓存处理后一步刮削海报图片

   充分利用两个网站的的项目优势去智能组合刮削，并进一步节省单个网站请求，避免触发免费范围

# 注意⚠️

#### 正确刮削的前提是 标准文件名和文件夹名称，名字乱七八糟的没改好，问为啥不出海报？会被大家喷！你还只能乖乖受喷！

#### 图片代理 TMDB 插件的必须要 json的节目信息能获取到才能从里面 拼接出字符串，所以验证这个机制是否正常，先识别一部剧或者一个电影，如果手动识别 没有节目信息证明负责api的那个 worker连通性不正常，tmdb没办法请求到图片。

#### imdb omdb tvdb 插件属于无效插件还会影响 tmdb 的拼接图片抓取地址，可以删掉。

## Vercel Hobby 免费套餐 — 限制说明
🧱 项目与部署

📌 项目上限：200 个

适合个人多项目存放，但不适合大量子项目分仓库。

📌 部署限制：每日最多 100 次

过多 CI 推送会触发限制，建议合并提交或手动触发。

📌 并行构建：1 个

同时发起多次部署会排队，团队协作时需注意。

📌 构建时间：单次最多约 45 分钟

构建过慢会被中断，需要优化构建或减少步骤。

📌 CLI 上传文件大小：100 MB

大文件请使用外部对象存储（S3、COS、OSS 等）。

⸻

⚙️ 函数与执行资源

📌 活跃 CPU：4 CPU-小时 / 月

计算型任务过多会触发冻结，建议做好缓存或迁移到后端服务。

📌 内存配额：360 GB-小时 / 月

高内存函数运行久会快速消耗配额。

📌 函数调用：100 万次 / 月

适用于轻量 API；高流量接口需使用缓存或外部服务器。

📌 函数运行时长：100 GB-小时 / 月

运行时间 × 内存越高，消耗越快。

⸻

🌐 流量与传输

📌 快速数据传输：约 100 GB / 月

托管大流量网站可能达到上限，建议使用 CDN 或对象存储。

📌 快速回源：约 10 GB / 月

频繁回源热点文件会消耗很快，应让静态资源保持高缓存率。

⸻

🖼 图片优化相关

📌 源图片处理上限：1,000 张 / 月

适合博客、小站；不适合大量动态裁图与多尺寸图像生成。

⸻

📄 日志与调试

📌 Runtime Logs：仅保留 1 小时

重要日志请外接日志服务（如 Logtail、Datadog）。

⸻

⏰ 定时任务

📌 Cron Jobs：每账号最多 2 个

单账号仅能设置两个定时任务；更多任务需升级或使用 GitHub Actions。

⸻

💼 用途限制

📌 仅允许个人 / 非商业使用

Hobby 不适合用于商业产品或要求高 SLA 的场景。

