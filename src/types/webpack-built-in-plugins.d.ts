declare module 'webpack/lib/SingleEntryPlugin' {
  import { Plugin } from 'webpack'
  export default class extends Plugin {
    constructor(context: string, request: string, chunkName: string)
  }
}
