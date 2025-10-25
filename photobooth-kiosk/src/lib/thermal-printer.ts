import { PrinterConfig } from '@/types'

export interface PrintJob {
  id: string
  sessionId: string
  data: Uint8Array
  timestamp: number
  retryCount: number
}

export class ThermalPrinter {
  private config: PrinterConfig
  private printQueue: PrintJob[] = []
  private isProcessing = false

  constructor(config: PrinterConfig) {
    this.config = config
  }

  async printImage(imageData: ImageData, layout: any): Promise<boolean> {
    try {
      // Convert image to 1-bit monochrome
      const monochromeData = this.convertToMonochrome(imageData, layout.dither)
      
      // Generate ESC/POS commands
      const escPosCommands = this.generateEscPosCommands(monochromeData, layout)
      
      // Send to printer
      return await this.sendToPrinter(escPosCommands)
    } catch (error) {
      console.error('Print failed:', error)
      return false
    }
  }

  private convertToMonochrome(imageData: ImageData, ditherType: 'atkinson' | 'floyd-steinberg'): Uint8Array {
    const { width, height, data } = imageData
    const result = new Uint8Array(Math.ceil((width * height) / 8))
    
    // Convert to grayscale first
    const grayscale = new Uint8Array(width * height)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      grayscale[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    }

    // Apply dithering
    const dithered = this.applyDithering(grayscale, width, height, ditherType)
    
    // Convert to 1-bit
    for (let i = 0; i < dithered.length; i++) {
      const bitIndex = i % 8
      const byteIndex = Math.floor(i / 8)
      if (dithered[i] < 128) { // Black pixel
        result[byteIndex] |= (1 << (7 - bitIndex))
      }
    }

    return result
  }

  private applyDithering(data: Uint8Array, width: number, height: number, type: string): Uint8Array {
    const result = new Uint8Array(data)
    
    if (type === 'atkinson') {
      return this.atkinsonDither(result, width, height)
    } else if (type === 'floyd-steinberg') {
      return this.floydSteinbergDither(result, width, height)
    }
    
    return result
  }

  private atkinsonDither(data: Uint8Array, width: number, height: number): Uint8Array {
    const result = new Uint8Array(data)
    const error = new Float32Array(width * height)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        const oldPixel = result[index] + error[index]
        const newPixel = oldPixel < 128 ? 0 : 255
        result[index] = newPixel
        
        const quantError = oldPixel - newPixel
        const errorFactor = 1 / 8
        
        // Distribute error to neighboring pixels
        if (x + 1 < width) error[index + 1] += quantError * errorFactor
        if (x + 2 < width) error[index + 2] += quantError * errorFactor
        if (y + 1 < height) {
          if (x - 1 >= 0) error[index + width - 1] += quantError * errorFactor
          if (x >= 0) error[index + width] += quantError * errorFactor
          if (x + 1 < width) error[index + width + 1] += quantError * errorFactor
        }
        if (y + 2 < height) {
          if (x >= 0) error[index + width * 2] += quantError * errorFactor
        }
      }
    }
    
    return result
  }

  private floydSteinbergDither(data: Uint8Array, width: number, height: number): Uint8Array {
    const result = new Uint8Array(data)
    const error = new Float32Array(width * height)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        const oldPixel = result[index] + error[index]
        const newPixel = oldPixel < 128 ? 0 : 255
        result[index] = newPixel
        
        const quantError = oldPixel - newPixel
        
        // Distribute error to neighboring pixels
        if (x + 1 < width) error[index + 1] += quantError * 7 / 16
        if (y + 1 < height) {
          if (x - 1 >= 0) error[index + width - 1] += quantError * 3 / 16
          if (x >= 0) error[index + width] += quantError * 5 / 16
          if (x + 1 < width) error[index + width + 1] += quantError * 1 / 16
        }
      }
    }
    
    return result
  }

  private generateEscPosCommands(imageData: Uint8Array, layout: any): Uint8Array {
    const commands: number[] = []
    
    // Initialize printer
    commands.push(0x1B, 0x40) // ESC @
    
    // Set print density
    commands.push(0x1D, 0x28, 0x47, 0x02, 0x00, 0x10, this.config.density) // GS ( G
    
    // Set paper width
    const paperWidth = layout.canvas.width
    commands.push(0x1D, 0x57, (paperWidth >> 8) & 0xFF, paperWidth & 0xFF) // GS W
    
    // Print image data
    const imageWidth = layout.canvas.width
    const imageHeight = Math.ceil(imageData.length * 8 / imageWidth)
    
    // ESC * m nL nH d1...dk (bit image mode)
    commands.push(0x1B, 0x2A, 0x00, imageWidth & 0xFF, (imageWidth >> 8) & 0xFF)
    commands.push(...Array.from(imageData))
    
    // Line feed
    commands.push(0x0A) // LF
    
    // Cut paper
    commands.push(0x1D, 0x56, 0x00) // GS V 0
    
    return new Uint8Array(commands)
  }

  private async sendToPrinter(commands: Uint8Array): Promise<boolean> {
    switch (this.config.connection) {
      case 'LAN':
        return await this.sendViaLAN(commands)
      case 'Proxy':
        return await this.sendViaProxy(commands)
      case 'WebUSB':
        return await this.sendViaWebUSB(commands)
      default:
        throw new Error('Unsupported connection type')
    }
  }

  private async sendViaLAN(commands: Uint8Array): Promise<boolean> {
    try {
      // Create a WebSocket connection for raw TCP-like communication
      const ws = new WebSocket(`ws://${this.config.host}:${this.config.port}`)
      
      return new Promise((resolve) => {
        ws.onopen = () => {
          ws.send(commands)
          ws.close()
          resolve(true)
        }
        
        ws.onerror = () => {
          resolve(false)
        }
        
        ws.onclose = () => {
          resolve(true)
        }
      })
    } catch (error) {
      console.error('LAN print failed:', error)
      return false
    }
  }

  private async sendViaProxy(commands: Uint8Array): Promise<boolean> {
    try {
      const response = await fetch(`http://${this.config.host}:${this.config.port}/api/printer/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Kiosk-Token': this.config.token_hint || ''
        },
        body: commands
      })
      
      return response.ok
    } catch (error) {
      console.error('Proxy print failed:', error)
      return false
    }
  }

  private async sendViaWebUSB(commands: Uint8Array): Promise<boolean> {
    try {
      if (!navigator.usb) {
        throw new Error('WebUSB not supported')
      }
      
      const devices = await navigator.usb.getDevices()
      if (devices.length === 0) {
        throw new Error('No USB devices found')
      }
      
      const device = devices[0]
      await device.open()
      await device.selectConfiguration(1)
      await device.claimInterface(0)
      
      // Send commands via USB
      await device.transferOut(1, commands)
      
      await device.close()
      return true
    } catch (error) {
      console.error('WebUSB print failed:', error)
      return false
    }
  }

  // Queue management for offline printing
  addToQueue(printJob: PrintJob): void {
    this.printQueue.push(printJob)
    this.processQueue()
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.printQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.printQueue.length > 0) {
      const job = this.printQueue.shift()!
      
      try {
        const success = await this.sendToPrinter(job.data)
        
        if (!success && job.retryCount < 3) {
          job.retryCount++
          this.printQueue.unshift(job) // Retry at front of queue
        }
      } catch (error) {
        console.error('Print job failed:', error)
        if (job.retryCount < 3) {
          job.retryCount++
          this.printQueue.unshift(job)
        }
      }
    }

    this.isProcessing = false
  }

  // Test printer connection
  async testConnection(): Promise<boolean> {
    try {
      const testCommands = new Uint8Array([0x1B, 0x40, 0x1B, 0x64, 0x02]) // ESC @, ESC d (line feed)
      return await this.sendToPrinter(testCommands)
    } catch (error) {
      console.error('Printer test failed:', error)
      return false
    }
  }
}

// Utility functions for image processing
export function createImageDataFromCanvas(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')
  
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export function resizeImageData(imageData: ImageData, targetWidth: number, targetHeight: number): ImageData {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')
  
  canvas.width = targetWidth
  canvas.height = targetHeight
  
  // Create temporary canvas with original image
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) throw new Error('Could not get temp canvas context')
  
  tempCanvas.width = imageData.width
  tempCanvas.height = imageData.height
  tempCtx.putImageData(imageData, 0, 0)
  
  // Draw scaled image
  ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight)
  
  return ctx.getImageData(0, 0, targetWidth, targetHeight)
}
