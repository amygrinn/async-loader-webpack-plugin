class ProgressTracker extends EventTarget {
  private total = 0
  private loaded = 0
  private initialFileLoadCountdown = 1

  constructor(private numFiles: number = 1) { 
    super()
    this.initialFileLoadCountdown = numFiles
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
        const percentage = Math.round(100 * (this.loaded / this.total))

        this.dispatchEvent(new CustomEvent('progress', { detail: {
          percentage,
          total: this.total,
          loaded: this.loaded
        }}))
        
        if(percentage === 100) {
          this.dispatchEvent(new CustomEvent('complete'))
        }
      }
    }
  }
}

const injectScript = (xhr: XMLHttpRequest) => () => {
  if(xhr.readyState === XMLHttpRequest.DONE) {
    const script = document.createElement('script')
    script.innerHTML = xhr.responseText
    document.body.appendChild(script)
  }
}

const injectCSS = (xhr: XMLHttpRequest) => () => {
  if(xhr.readyState === XMLHttpRequest.DONE) {
    const style = document.createElement('style')
    style.innerHTML = xhr.responseText
    document.head.appendChild(style)
  }
}

const files = ['async-loader-file-list']

const tracker = new ProgressTracker(files.length);

const xhrs = files.map((file: string) => {
  const xhr = new XMLHttpRequest()
  xhr.onprogress = tracker.createProgressEventHandler()

  if(/\.js$/.test(file)) {
    xhr.onreadystatechange = injectScript(xhr)
  } else if(/\.css$/.test(file)) {
    xhr.onreadystatechange = injectCSS(xhr)
  }

  xhr.open('GET', '/' + file)
  return xhr;
});

xhrs.forEach(xhr => xhr.send())

// @ts-ignore
window['AsyncLoader'] = tracker;
