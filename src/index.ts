/// <reference path='./types/webpack-built-in-plugins.d.ts' />

import * as path from 'path'
import * as fs from 'fs'
import { Compiler, Plugin } from 'webpack'
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin'

export type Extension = 'css' | 'js'

export type AsyncLoaderOptions = {
  chunks: string[],
  extensions: Extension[],
  scriptName: string
}

const PLUGIN_NAME = 'AsyncLoader'
const script = path.join(__dirname, 'scripts', 'async-loader.js');    

class AsyncLoader implements Plugin {

  constructor({
    chunks = ['app'],
    extensions = ['css', 'js'],
    scriptName = 'async-loader'
  }: AsyncLoaderOptions) { 
    this.options = { chunks, extensions, scriptName } 
  }

  private options: AsyncLoaderOptions
  private childCompilation: any
  private filesToLoad: string[] = []

  apply(compiler: Compiler) {

    console.log(script)

    compiler.hooks.make.tapAsync(PLUGIN_NAME, (compilation: any, cb) => {

      const childCompiler = compilation.createChildCompiler(PLUGIN_NAME, {
        filename: this.options.scriptName + '.js',
        path: compiler.options.output.path
      })

      new SingleEntryPlugin(childCompiler.context, script, 'async-loader').apply(childCompiler)
      
      childCompiler.runAsChild((err: any, entries: any, childCompilation: any) => {
        this.childCompilation = { ...childCompilation }
        // Don't emit assets from childCompiler
        childCompilation.assets = {}
        cb()
      })
    })

    compiler.hooks.shouldEmit.tap(PLUGIN_NAME, (compilation) => {
      compilation.entrypoints = new Map([...compilation.entrypoints, ...this.childCompilation.entrypoints])
      compilation.chunks = [...this.childCompilation.chunks, ...compilation.chunks]
    })

    compiler.hooks.emit.tap(PLUGIN_NAME, async (compilation) => {
      let extensionRegExs = this.options.extensions.map(ext => new RegExp(`\\.${ext}$`))

      compilation.chunks
        // Filter out chunks not in option.chunks
        .filter(chunk => this.options.chunks.indexOf(chunk.name) > -1)
        // Filter files by extensions in options.extensions
        .map(chunk => {
          const files = chunk.files.filter((file: string) => {
            for(let i = 0; i < extensionRegExs.length; i++) {
              if(extensionRegExs[i].test(file)) {
                return true
              }
            }
            return false
          })

          this.filesToLoad = this.filesToLoad.concat(files)
        })

      delete compilation.assets[this.options.scriptName + '.js']
      delete compilation.assets[this.options.scriptName + '.js.map']
    })

    compiler.hooks.done.tapAsync(PLUGIN_NAME, async (stats, cb) => {
      const readFile: (filename: string) => Promise<string> = 
      filename => new Promise(
        resolve => fs.readFile(filename, 
          (err, data) => resolve(data.toString())
        )
      )

      let scriptSource = await readFile(script)

      // Add filenames to loader script
      scriptSource = scriptSource.replace(
        /['|"]async-loader-file-list['|"]/, 
        `'${this.filesToLoad.join("','")}'`
      )

      // Write script to output folder
      fs.writeFile(
        path.join(compiler.options.output.path, this.options.scriptName + '.js'),
        scriptSource,
        cb
      )
    })
  }
}

module.exports = AsyncLoader
