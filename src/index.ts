/// <reference path='./types/webpack-built-in-plugins.d.ts' />

import * as path from 'path'
import * as fs from 'fs'
import { Compiler, Plugin, compilation } from 'webpack'
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin'

export type AsyncLoaderOptions = {
  
  /**
   * Choose which files to load by specifiying a list of chunks
   * where each chunk's list of files will load asyncronously
   */
  chunks?: string[],
  
  /**
   * Choose which files to load by specifying a list of regex
   * patterns that will test each file emitted by webpack
   */
  patterns?: RegExp[],
  
  /**
   * Choose files manually using a list of strings, each one will
   * be attempted to load asynchronously regardless of whether or not
   * it is emitted by webpack
   */
  files: string[],

  /**
   * Specify which extensions you would like to load asynchronously.
   * Files specified by 'files' option ignores this option
   */
  extensions: string[],
  
  /**
   * AsyncLoader will put a script named 'async-loader.js' in your output
   * directory and add it into HTMLWebpackPlugin. You may specify a different
   * name for the script here
   */
  scriptName: string

  /**
   * Choose whether or not to load files immediately or wait until AsyncLoader.load() is called
   */
  load: boolean
}

const readFile: (filename: string) => Promise<string> = 
  filename => new Promise(
    resolve => fs.readFile(filename, 
      (err, data) => resolve(data.toString())
    )
  )

const PLUGIN_NAME = 'AsyncLoader'
const script = path.join(__dirname, 'scripts', 'async-loader.js');    

class AsyncLoader implements Plugin {

  constructor({
    chunks,
    patterns,
    files = [],
    extensions = ['css', 'js'],
    scriptName = 'async-loader',
    load = true
  }: AsyncLoaderOptions) {
    this.options = { chunks, patterns, files, extensions, scriptName, load } 
  }

  private options: AsyncLoaderOptions
  private childCompilation: any
  private filesToLoad: string[] = []

  apply(compiler: Compiler) {

    // Create child compiler to make fake chunk for HTMLWebpackPlugin to catch
    // Make hook runs before compilation
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

    // Add child compilation to main compilation before HTMLWebpackPlugin runs but after compilation
    compiler.hooks.shouldEmit.tap(PLUGIN_NAME, (compilation) => {
      compilation.entrypoints = new Map([...compilation.entrypoints, ...this.childCompilation.entrypoints])
      compilation.chunks = [...this.childCompilation.chunks, ...compilation.chunks]
    })

    // Find files from compilation that match options
    compiler.hooks.emit.tap(PLUGIN_NAME, async (compilation) => {

      this.filesToLoad = this.filterFiles(compilation)

      // Delete child compiler assets, add the script manually later
      delete compilation.assets[this.options.scriptName + '.js']
      delete compilation.assets[this.options.scriptName + '.js.map']
    })

    // Done hook is after emit, 'dist' folder now exists
    compiler.hooks.done.tapAsync(PLUGIN_NAME, async (stats, cb) => {

      let scriptSource = await readFile(script)

      // Add filenames from 'shouldEmit' hook to async-loader script and add options
      scriptSource = scriptSource.replace(
        /\[['"]async-loader-file-list['"]\],\s*{\s*load:\s*[^}]+}/, 
        `['${this.filesToLoad.join("','")}'], { load: ${this.options.load} }`
      )

      // Write script to output folder, call callback (cb) on finish
      fs.writeFile(
        path.join(compiler.options.output.path, this.options.scriptName + '.js'),
        scriptSource,
        cb
      )
    })
  }

  private filterFiles(compilation: compilation.Compilation): string[] {

    // Patterns to test against files to see if they match options.extensions
    let extensionRegExs = this.options.extensions.map(ext => new RegExp(`\\.${ext}$`))

    let filesToLoad: string[] = []

    if(this.options.chunks) {

      compilation.chunks
        // Filter out chunks not in option.chunks
        .filter(chunk => this.options.chunks.indexOf(chunk.name) > -1)
        .forEach(chunk => filesToLoad = [ ...filesToLoad, ...chunk.files ])

    } else if(this.options.patterns) {

      // gather all files
      compilation.chunks.forEach(chunk => filesToLoad = [...filesToLoad, ...chunk.files])

      // filter based on options.patterns
      filesToLoad.filter(file => {
        for(let i = 0; i < this.options.patterns.length; i++) {
          if(this.options.patterns[i].test(file)) {
            return true
          }
        }
        return false
      })
    }

    // Filter files by extension
    filesToLoad = filesToLoad.filter(file => {
      for(let i = 0; i < extensionRegExs.length; i++) {
        if(extensionRegExs[i].test(file)) {
          return true
        }
      }
      return false
    })

    // Add files that are manually set using options.files
    filesToLoad = [ ...filesToLoad, ...this.options.files ]
    return filesToLoad
  }
}

module.exports = AsyncLoader
