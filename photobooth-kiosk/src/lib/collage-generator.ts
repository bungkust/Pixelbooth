import { Layout } from '@/types'
import { createImageDataFromCanvas, resizeImageData } from './thermal-printer'

export interface CollageOptions {
  photos: string[]
  layout: Layout
  boothName: string
  downloadCode: string
  downloadUrl: string
}

export class CollageGenerator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
  }

  async generateCollage(options: CollageOptions): Promise<ImageData> {
    const { photos, layout, boothName, downloadCode, downloadUrl } = options

    // Set canvas size
    this.canvas.width = layout.canvas.width
    this.canvas.height = layout.canvas.height === 'auto' 
      ? this.calculateHeight(layout) 
      : layout.canvas.height

    // Clear canvas
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw header if specified
    if (layout.header) {
      this.drawHeader(layout.header, boothName)
    }

    // Draw photos
    for (let i = 0; i < Math.min(photos.length, layout.frames.length); i++) {
      await this.drawPhoto(photos[i], layout.frames[i])
    }

    // Draw logo if specified
    if (layout.logo) {
      await this.drawLogo(layout.logo)
    }

    // Draw caption if specified
    if (layout.caption) {
      this.drawCaption(layout.caption, downloadCode)
    }

    // Draw footer with QR code and download code
    await this.drawFooter(layout.footer, downloadCode, downloadUrl)

    return createImageDataFromCanvas(this.canvas)
  }

  private calculateHeight(layout: Layout): number {
    let maxY = 0

    // Find the bottom-most element
    layout.frames.forEach(frame => {
      maxY = Math.max(maxY, frame.y + frame.h)
    })

    if (layout.logo) {
      maxY = Math.max(maxY, layout.logo.y + layout.logo.h)
    }

    if (layout.caption) {
      maxY = Math.max(maxY, layout.caption.y + layout.caption.h)
    }

    // Add footer height
    const footerHeight = layout.footer.qr.size + 40 // QR size + padding
    maxY += footerHeight

    // Add margins
    return maxY + layout.margins.top + layout.margins.bottom
  }

  private drawHeader(header: any, boothName: string): void {
    const { text } = header
    const value = text.value.replace('{{booth_name}}', boothName)

    this.ctx.fillStyle = '#000000'
    this.ctx.font = `${text.size}px ${text.font === 'mono' ? 'ui-monospace' : 'Inter'}`
    this.ctx.textAlign = text.align as CanvasTextAlign
    this.ctx.textBaseline = 'top'

    const x = text.align === 'center' 
      ? this.canvas.width / 2
      : text.align === 'right' 
        ? this.canvas.width - 20
        : 20

    this.ctx.fillText(value, x, 20)
  }

  private async drawPhoto(photoUrl: string, frame: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // Create temporary canvas for photo processing
          const tempCanvas = document.createElement('canvas')
          const tempCtx = tempCanvas.getContext('2d')!
          
          tempCanvas.width = frame.w
          tempCanvas.height = frame.h

          // Apply frame border if specified
          if (frame.border) {
            tempCtx.fillStyle = '#000000'
            tempCtx.fillRect(0, 0, frame.w, frame.h)
            tempCtx.fillStyle = '#FFFFFF'
            tempCtx.fillRect(frame.border, frame.border, frame.w - frame.border * 2, frame.h - frame.border * 2)
          }

          // Draw image with specified fit mode
          this.drawImageWithFit(tempCtx, img, 0, 0, frame.w, frame.h, frame.fit)

          // Draw to main canvas
          this.ctx.drawImage(tempCanvas, frame.x, frame.y)
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = reject
      img.src = photoUrl
    })
  }

  private drawImageWithFit(
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    fit: string
  ): void {
    let drawX = x
    let drawY = y
    let drawWidth = width
    let drawHeight = height

    if (fit === 'cover') {
      const imgAspect = img.width / img.height
      const frameAspect = width / height

      if (imgAspect > frameAspect) {
        // Image is wider, fit to height
        drawHeight = height
        drawWidth = height * imgAspect
        drawX = x - (drawWidth - width) / 2
      } else {
        // Image is taller, fit to width
        drawWidth = width
        drawHeight = width / imgAspect
        drawY = y - (drawHeight - height) / 2
      }
    } else if (fit === 'contain') {
      const imgAspect = img.width / img.height
      const frameAspect = width / height

      if (imgAspect > frameAspect) {
        // Image is wider, fit to width
        drawWidth = width
        drawHeight = width / imgAspect
        drawY = y + (height - drawHeight) / 2
      } else {
        // Image is taller, fit to height
        drawHeight = height
        drawWidth = height * imgAspect
        drawX = x + (width - drawWidth) / 2
      }
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
  }

  private async drawLogo(logo: any): Promise<void> {
    // For now, draw a placeholder rectangle
    // In a real implementation, you would load and draw the actual logo
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(logo.x, logo.y, logo.w, logo.h)
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '16px ui-monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('LOGO', logo.x + logo.w / 2, logo.y + logo.h / 2)
  }

  private drawCaption(caption: any, downloadCode: string): void {
    const text = caption.text.replace('{{code}}', downloadCode)

    this.ctx.fillStyle = '#000000'
    this.ctx.font = `${caption.size}px ${caption.font === 'mono' ? 'ui-monospace' : 'Inter'}`
    this.ctx.textAlign = caption.align as CanvasTextAlign
    this.ctx.textBaseline = 'top'

    const x = caption.align === 'center' 
      ? caption.x + caption.w / 2
      : caption.align === 'right' 
        ? caption.x + caption.w - 10
        : caption.x + 10

    this.ctx.fillText(text, x, caption.y + 10)
  }

  private async drawFooter(footer: any, downloadCode: string, downloadUrl: string): Promise<void> {
    const qrSize = footer.qr.size
    const qrX = footer.qr.align === 'center' 
      ? (this.canvas.width - qrSize) / 2
      : footer.qr.align === 'right' 
        ? this.canvas.width - qrSize - 20
        : 20

    const qrY = this.canvas.height - qrSize - 40

    // Draw QR code placeholder
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(qrX, qrY, qrSize, qrSize)
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '12px ui-monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('QR', qrX + qrSize / 2, qrY + qrSize / 2)

    // Draw download code
    const codeText = footer.code.value.replace('{{code}}', downloadCode)
    const codeX = footer.code.align === 'center' 
      ? this.canvas.width / 2
      : footer.code.align === 'right' 
        ? this.canvas.width - 20
        : 20

    const codeY = qrY + qrSize + 20

    this.ctx.fillStyle = '#000000'
    this.ctx.font = `${footer.code.size}px ${footer.code.font === 'mono' ? 'ui-monospace' : 'Inter'}`
    this.ctx.textAlign = footer.code.align as CanvasTextAlign
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(codeText, codeX, codeY)
  }

  // Generate QR code (simplified version)
  private generateQRCode(data: string, size: number): ImageData {
    // This is a placeholder - in a real implementation, you would use a QR code library
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = size
    canvas.height = size
    
    // Draw a simple pattern as placeholder
    ctx.fillStyle = '#000000'
    for (let i = 0; i < size; i += 4) {
      for (let j = 0; j < size; j += 4) {
        if ((i + j) % 8 === 0) {
          ctx.fillRect(i, j, 2, 2)
        }
      }
    }
    
    return createImageDataFromCanvas(canvas)
  }
}

// Utility function to create collage
export async function createCollage(options: CollageOptions): Promise<ImageData> {
  const generator = new CollageGenerator()
  return await generator.generateCollage(options)
}
