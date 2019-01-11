const AsyncLoader = require('async-loader-webpack-plugin')

module.exports = {
  configureWebpack: {
    plugins: [ new AsyncLoader({
      chunks: ['app', 'chunk-vendors']
    }) ]
  },
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => [{ 
        ...args[0],
        excludeChunks: ['app', 'chunk-vendors'],
        inject: 'head',
        chunksSortMode: 'none'
      }])
    config
      .plugin('preload')
      .tap(args => [{
        ...args[0],
        rel: 'prefetch',
      }])
  }
}
