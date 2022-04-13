module.exports = function createVitePluginHtmlRedirect(options = {}) {
  return {
    name: 'vite-plugin-html-redirect',
    apply: 'serve',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          const redirectPath = options.redirectPath || './index.html'
          if (req.url.endsWith('.html') && req.headers['sec-fetch-dest'] !== 'script') {
            req.url = redirectPath
          }
          next()
        })
      }
    },
  }
}
