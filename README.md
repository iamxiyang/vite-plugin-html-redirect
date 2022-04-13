### README

一个 Vite 小插件，解决使用 Vite 开发阶段路由带 .html 后缀时访问 404 的问题。

### 使用方法

#### 安装

```bash
npm i vite-plugin-html-redirect -D
yarn add vite-plugin-html-redirect -D
```

### 在 vite.config.js 中配置

```js
// 引入
import ViteHtmlRedirect from 'vite-plugin-html-redirect'

// 最简单的方法
{
  // ...其他配置
  plugins: [
    // ...其他插件
    ViteHtmlRedirect(),
  ]
}

// 使用配置，目前只支持一个参数，即配置页面路径，默认匹配的是 ./index.html，如果需要自定义html，可以通过如下方式配置

{
  // ...其他配置
  plugins: [
    // ...其他插件
    ViteHtmlRedirect({
      redirectPath: './index.html',
    }),
  ]
}
```

### 开发原因

我要对一个基于 Vue2、Vue cli 的项目进行重构，因此要保证和之前的路由地址一样。我使用 Vite 初始化了一个 Vue3+VueRouter 的项目。

我通过浏览器进行访问，但当我刷新时总会 404，经过排查发现是因为我的路由地址带有 .html 的后缀，如 `a.html`、`b/123.html`。经过查看 Vite 的源码，发现以下代码片段：

```js
// indexHtmlMiddleware 会对html文件进行处理
if (!middlewareMode || middlewareMode === 'html') {
  // transform index.html
  middlewares.use(indexHtmlMiddleware(server))
  // handle 404s
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  middlewares.use(function vite404Middleware(_, res) {
    res.statusCode = 404
    res.end()
  })
}
```

```js
// 判断是以.html结尾 且 req.headers['sec-fetch-dest'] !== 'script'，就获取文件名去读取对应的html文件，而我是通过路由配置的当然不存在这个文件，此时抛错下一步就是返回404
export function indexHtmlMiddleware(
  server: ViteDevServer
): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return async function viteIndexHtmlMiddleware(req, res, next) {
    if (res.writableEnded) {
      return next()
    }

    const url = req.url && cleanUrl(req.url)
    // spa-fallback always redirects to /index.html
    if (url?.endsWith('.html') && req.headers['sec-fetch-dest'] !== 'script') {
      const filename = getHtmlFilename(url, server)
      if (fs.existsSync(filename)) {
        try {
          let html = fs.readFileSync(filename, 'utf-8')
          html = await server.transformIndexHtml(url, html, req.originalUrl)
          return send(req, res, html, 'html', {
            headers: server.config.server.headers
          })
        } catch (e) {
          return next(e)
        }
      }
    }
    next()
  }
```

因此路由配置以 .html 结尾在进行开发时会返回 404，我翻了一遍文档，没有发现什么配置项和现有插件能够解决我的问题，因此我尝试借助插件 API 写了一个小插件，解决了这个问题，如果你有类似问题希望能帮助到你，如果你有更好的方案也请告诉我。

思路是匹配到.html 结尾时，自动重定向到 ./index.html 这个文件。
