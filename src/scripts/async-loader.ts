class AsyncLoader extends EventTarget {

  private total = 0
  private loaded = 0
  private initialFileLoadCountdown = 1
  private finalFileLoadCountdown = 1

  constructor(private files: string[], options) { 
    super()
    this.initialFileLoadCountdown = this.finalFileLoadCountdown = files.length
    if(options.load) {
      this.load()
    }
  }

  load() {
    const xhrs = this.files.map((file: string) => {
      const xhr = new XMLHttpRequest()
      xhr.onprogress = this.createProgressEventHandler()
    
      xhr.onreadystatechange = () => {
        if(xhr.readyState === XMLHttpRequest.DONE) {
          this.fileDownloaded()
        }
      }
    
      xhr.open('GET', '/' + file)
      xhr.send()
      return xhr;
    });
    
    this.addEventListener('download-complete', () => {
      for(let i = 0; i < this.files.length; i++) {
        if(/\.js$/.test(this.files[i])) {
          this.injectScript(xhrs[i])
        } else if(/\.css$/.test(this.files[i])) {
          this.injectCSS(xhrs[i])
        }
      }
    
      // Add script to determine when the browser finishes parsing the new files
      const script = document.createElement('script')
      script.innerHTML = 'AsyncLoader.dispatchEvent(new Event(\'complete\'))'
      document.body.appendChild(script)
    })
  }

  createProgressEventHandler() {
    let first = true;
    let lastEvent = 0

    return (ev: ProgressEvent) => {
      if(first) {
        this.total += ev.total
        this.initialFileLoadCountdown--
        first = false
      }

      this.loaded += ev.loaded - lastEvent
      lastEvent = ev.loaded

      if(this.initialFileLoadCountdown === 0) {
        const percentage = Math.min(100, Math.round(100 * (this.loaded / this.total)))

        this.dispatchEvent(new CustomEvent('progress', { detail: {
          percentage,
          total: this.total,
          loaded: this.loaded
        }}))
      }
    }
  }

  fileDownloaded() {
    this.finalFileLoadCountdown--
    if(this.finalFileLoadCountdown === 0) {
      this.dispatchEvent(new Event('download-complete'))
    }
  }

  injectScript(xhr: XMLHttpRequest) {
    const script = document.createElement('script')
    script.innerHTML = xhr.responseText
    document.body.appendChild(script)
  }
  
  injectCSS(xhr: XMLHttpRequest) {
    const style = document.createElement('style')
    style.innerHTML = xhr.responseText
    document.head.appendChild(style)
  }
}

window['AsyncLoader'] = new AsyncLoader(['async-loader-file-list'], { load: true })
