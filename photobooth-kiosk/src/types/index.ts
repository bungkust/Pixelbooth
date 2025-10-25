export interface PrinterConfig {
  host: string
  port: number
  paper: '58mm' | '80mm'
  dpi: number
  density: number
  connection: 'LAN' | 'Proxy' | 'WebUSB'
  token_hint?: string
}

export interface PhotoSession {
  id: string
  download_code: string
  photos: string[] // blob URLs
  collage?: string
  layout: string
  created_at: string
  expires_at: string
  paper: '58mm' | '80mm'
  booth_name: string
  checksum: string
}

export interface Layout {
  name: string
  paper: '58mm' | '80mm'
  canvas: {
    width: number
    height: 'auto' | number
  }
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  dither: 'atkinson' | 'floyd-steinberg'
  header?: {
    text: {
      value: string
      font: 'mono' | 'sans'
      size: number
      align: 'left' | 'center' | 'right'
    }
  }
  frames: Array<{
    x: number
    y: number
    w: number
    h: number
    fit: 'cover' | 'contain' | 'fill'
  }>
  footer: {
    qr: {
      size: number
      data: string
      align?: 'left' | 'center' | 'right'
    }
    code: {
      font: 'mono' | 'sans'
      size: number
      align: 'left' | 'center' | 'right'
      value: string
    }
  }
  logo?: {
    x: number
    y: number
    w: number
    h: number
    mode: 'monochrome'
  }
  caption?: {
    text: string
    x: number
    y: number
    w: number
    h: number
    font: 'mono' | 'sans'
    size: number
    align: 'left' | 'center' | 'right'
  }
  frame_border?: number
}

export type SessionState = 
  | 'CREATED'
  | 'CAPTURING'
  | 'REVIEW'
  | 'COMPOSING'
  | 'PRINTING'
  | 'PRINTED'
  | 'ERROR'

export interface KioskState {
  currentState: SessionState
  session?: PhotoSession
  printerConfig?: PrinterConfig
  isPrinterReady: boolean
  isCameraReady: boolean
  isFullscreen: boolean
  isWakeLockActive: boolean
  tapTapMode: boolean
  currentPhotoIndex: number
  photos: string[]
}
