# Vl-tmdb


通过合理利用 **Cloudflare** 和 **Vercel** 的全球边缘网络节点的免费套餐，部署代理 **TMDB** 的 `api.tmdb.org` 和 `image.tmdb.org` 两个接口的 JSON 节目信息和图片代理转发，让被屏蔽的 **Emby** 流畅恢复刮削 **TMDB** 的节目信息和节目图片。

不需要借助修改 host 节点方法和魔法网络工具代理。

## 🚀 一键部署（两个都要部署）



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
   - 选择 **CV-tmdb** 仓库  
   - 在项目设置中，根目录选择 `project`

3. 部署 **Cloudflare Workers**：  
   - 点击上方 **Deploy to Cloudflare** 按钮  
   - 创建 **Cloudflare** 账户（如没有）  
   - 在 **Workers** 页面创建新服务  
   - 将 `workers/src/index.js` 内容复制到 **Workers 编辑器**

4. 部署完两个项目绑定自定义域名，也就是托管在 cloudflare 的域名的子域名
   - workers 绑定自定义域名 → worker 项目主页 → 设置 → 域和路由 
→ 添加 → 自定义域 → 输入一个子域名 例:abc.com 子域名可: c.abc.com 点击 部署

   - vercel 绑定子域名

#使用方式

Emby 神医助手配置

在神医助手 → 元数据增强 → 使用代替 TMDB 配置
	•	代替 TMDB API 地址：你的 Workers 自定义域名
	•	代替 TMDB 图像 地址：你的 Vercel 自定义域名

填完后保存，重启 Emby 服务器 即可生效。

#部署效果

   利用cloudflare workers的快速的边缘计算去先一步匹配节目信息的json信息。
   emby 的 tmdb 插件通过接收到的 json 信息里的图片字符串拼接出完整的图片url链接
   返回图片url链接让 Vercel 的 cdn 优秀的图像缓存处理后一步刮削海报图片

   合理利用两个网站的的项目优势去智能组合刮削，并进一步节省单个网站请求，避免触发免费范围限制
🔄 优化和更新
