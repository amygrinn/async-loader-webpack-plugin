# Async Loader Webpack Plugin

# [DEMO](https://async-loader-webpack-plugin.tygr.info)

Is your SPA getting unwieldy? Use this plugin to give immediate content to clients while loading large scripts and styles in the background.

When using async-loader-webpack-plugin, an object named `AsyncLoader` is exposed which emits loading progress events. Write a loading bar in your `index.html` template file that subscribes to `AsyncLoader`. Once the scripts have been downloaded and injected and processed by the browser, `AsyncLoader` will emit a `complete` event.

**This plugin is meant to be used with HtmlWebpackPlugin**

## Installation

`npm install --save-dev @tygr/async-loader-webpack-plugin`

`yarn add --dev @tygr/async-loader-webpack-plugin`

## Plugin Options

| option     | type       | default          | description                                                                                                                                                            |
| :--------- | :--------- | :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| chunks     | string[]   | `null`           | Choose which files to load by specifiying a list of chunks where each chunk's list of files will load asyncronously                                                    |
| patterns   | RegExp[]   | `null`           | Choose which files to load by specifying a list of regex patterns that will test each file emitted by webpack                                                          |
| files      | string[]   | `[]`             | Choose files manually using a list of strings, each one will be attempted to load asynchronously regardless of whether or not it is emitted by webpack                 |
| extensions | string[]   | `['css', 'js']`  | Specify which extensions you would like to load asynchronously. Files specified by 'files' option ignores this option                                                  |
| scriptName | string     | `'async-loader'` | AsyncLoader will put a script named 'async-loader.js' in your output directory and add it into HTMLWebpackPlugin. You may specify a different name for the script here |
| load       | boolean    | `true`           | Choose whether or not to load files immediately or wait until AsyncLoader.load() is called                                                                             |

**`chunks` and `patterns` are mutually exlusive, use one or the other**

## AsyncLoader Events

AsyncLoader will be injected into the browser globally. To listen to an event from AsyncLoader, call `AsyncLoader.addEventListener(<event-name>, <handler>)`. Access event parameters in your handler by calling `ev.detail.<parameter>`

| event             | parameters                       | description                                                               |
| :---------------- | :------------------------------ | :------------------------------------------------------------------------ |
| progress          | 'percentage', 'loaded', 'total' | Called every time a progress event is recorded while downloading files    |
| download-complete | none                            | Called when all files have finished downloading                           |
| complete          | none                            | Called after files have finished being injected and parsed by the browser |

## AsyncLoader functions

| name | parameters | description                                                                                     |
| :--- | :--------- | :---------------------------------------------------------------------------------------------- |
| load |            | Load all scripts and inject them. Called immediately by default if `load` option is set to true |

## Setup

You will want to edit the HtmlWebpackPlugin options to exclude the chunks you specify in the AsyncLoader plugin. It's also required that you do not sort the chunks by specifying `chunksSortMode: 'none'`. You'll also want to inject the scripts in the head so they will be available to you in the body using `inject: 'head'`.

(webpack.config.js)
```
const AsyncLoader = require('@tygr/async-loader-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  ...
  plugins: [
    new AsyncLoader({
      chunks: ['app', 'chunk-vendors']
    }),
    new HtmlWebpackPlugin({
      ...,
      excludeChunks: ['app', 'chunk-vendors'],
      chunksSortMode: 'none',
      inject: 'head'
    })
  ]
}
```

## vue CLI setup

When using the vue CLI to create your app, you'll need to edit your webpack config in a root level file named `vue.config.js`. This configuration also modifies the 'preload' plugin that comes built in automatically. By specifying some scripts to preload, it may slow down your initial render, so it's been modified to specify `prefetch` instead.

```
const AsyncLoader = require('@tygr/async-loader-webpack-plugin')

module.exports = {
  configureWebpack: {
    plugins: [ new AsyncLoader({
      chunks: ['app', 'chunk-vendors'],
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
```

## index.html Setup

Inside the index.html template file is where you should hook into the AsyncLoader plugin. It should look something like this:

```
<html>
  ...
  <body>
    <div id="app"></div>
    <!-- Use the AsyncLoader object (already injected as a global object by the plugin) here -->
    <script>
      AsyncLoader.addEventListener('progress', ev => {
        console.log(ev.detail.percentage)
      })

      AsyncLoader.addEventListener('complete', () => {
        console.log('Finished loading and injecting scripts')
      })
    </script>
  </body>
</html>
```

## Vue tips

If you would like to add an `enter website` button, modify your `src/main.js` so that it does not mount the app immediately but instead exposes it to the window object:

```
// @ts-ignore
window['app'] = new Vue({
  router,
  store,
  render: (h) => h(App),
});
```

Then, in your `public/index.html`, wait for a complete event to show the enter button and set the onclick handler to `$mount` the app:

```
<html>
  ...
  <body>
    <button id="enter-btn" style="display: none;" onclick="enterApp()">Enter</button>
    <div id="app"></div>
    <script>
      AsyncLoader.addEventListener('complete', () => {
        document.getElementById('enter-btn').style.display = 'block'
      })

      const enterApp = () => {
        document.getElementById('enter-btn').style.display = 'none'
        app.$mount('#app')
      }
    </script>
  </body>
</html>
```