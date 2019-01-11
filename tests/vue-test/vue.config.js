const AsyncLoader = require('@tygr/async-loader-webpack-plugin')

module.exports = {
  configureWebpack: {
    plugins: [ new AsyncLoader({
      chunks: ['app', 'chunk-vendors'],
      files: ['map.jpg']
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
