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

   充分利用两个网站的的项目优势去智能组合刮削，并进一步节省单个网站请求，避免触发免费范围限制

## Vercel Hobby 计划 最新限制（官方数据）

| 分类 | 限制 / 配额 |
|---|---|
| **一般资源** | 项目数上限：200 个  [oai_citation:0‡Vercel](https://vercel.com/docs/limits?utm_source=chatgpt.com) |
| | 每日部署 (Deployments)：100 次 / 天  [oai_citation:1‡Vercel](https://vercel.com/docs/limits?utm_source=chatgpt.com) |
| | 并行构建 (Concurrent Builds)：1 个  [oai_citation:2‡Vercel](https://vercel.com/docs/limits/overview?utm_source=chatgpt.com) |
| | 构建时间 (单次 Build)：最长期限 45 分钟  [oai_citation:3‡Vercel](https://vercel.com/docs/limits?utm_source=chatgpt.com) |
| | 静态文件上传 (CLI)：最大 100 MB  [oai_citation:4‡Vercel](https://vercel.com/docs/limits/overview?utm_source=chatgpt.com) |
| | Cron Jobs：每账号 **2 个**  [oai_citation:5‡Vercel](https://vercel.com/docs/limits?utm_source=chatgpt.com) |
| **函数 /计算资源** | 活跃 CPU (Active CPU)：4 CPU-小时 / 月  [oai_citation:6‡Vercel](https://vercel.com/docs/plans/hobby?utm_source=chatgpt.com) |
| | 配置内存 (Provisioned Memory)：360 GB-小时 / 月  [oai_citation:7‡Vercel](https://vercel.com/docs/limits/overview?utm_source=chatgpt.com) |
| | 函数调用次数 (Invocations)：1,000,000 次 / 月  [oai_citation:8‡Vercel](https://vercel.com/docs/plans/hobby?utm_source=chatgpt.com) |
| | 函数运行时长 (Function Duration)：100 GB-小时 / 月  [oai_citation:9‡Vercel](https://vercel.com/docs/plans/hobby?utm_source=chatgpt.com) |
| **网络 /传输** | 快速数据传输 (Fast Data Transfer)：100 GB / 月  [oai_citation:10‡Vercel](https://vercel.com/docs/limits?utm_source=chatgpt.com) |
| | 快速回源 (Fast Origin Transfer)：最多 10 GB / 月  [oai_citation:11‡Vercel](https://vercel.com/docs/limits/overview?utm_source=chatgpt.com) |
| **图片优化** | Source Images (图像优化源图)：1,000 张 / 月  [oai_citation:12‡Vercel](https://vercel.com/docs/plans/hobby?utm_source=chatgpt.com) |
| **日志** | 运行时日志 (Runtime Logs)：保留 1 小时 (最多 ~ 4,000 行)  [oai_citation:13‡Vercel](https://vercel.com/docs/plans/hobby?utm_source=chatgpt.com) |
| **用途限制** | 仅限个人 / 非商业用途  [oai_citation:14‡Vercel](https://vercel.com/docs/plans/hobby?utm_source=chatgpt.com) |
| **构建配额** | 构建执行时间 (Build Execution)：100 小时 / 月  [oai_citation:15‡Vercel](https://vercel.com/docs/limits?utm_source=chatgpt.com) |

---

