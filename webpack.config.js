const path = require('path')
const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: './src/scripts/async-loader.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: { presets: [ '@babel/preset-env' ] }
          },          
          {
            loader: 'ts-loader',
            options: { transpileOnly: true }
          }
        ]
      }
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'scripts/async-loader.js'
  },
  watch: process.env.NODE_ENV == 'production' ? false : true,
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
}
