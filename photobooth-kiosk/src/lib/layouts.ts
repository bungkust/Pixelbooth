import { Layout } from '@/types'

export const LAYOUTS: Layout[] = [
  {
    name: "Strip 58 – Classic",
    paper: "58mm",
    canvas: { width: 384, height: "auto" },
    margins: { top: 16, right: 16, bottom: 16, left: 16 },
    dither: "atkinson",
    header: {
      text: {
        value: "{{booth_name}}",
        font: "mono",
        size: 16,
        align: "center"
      }
    },
    frames: [
      { x: 24, y: 56, w: 336, h: 336, fit: "cover" },
      { x: 24, y: 416, w: 336, h: 336, fit: "cover" },
      { x: 24, y: 776, w: 336, h: 336, fit: "cover" }
    ],
    footer: {
      qr: { size: 256, data: "{{download_url}}" },
      code: { font: "mono", size: 18, align: "center", value: "{{code}}" }
    }
  },
  {
    name: "Strip 58 – Compact QR",
    paper: "58mm",
    canvas: { width: 384, height: "auto" },
    margins: { top: 16, right: 16, bottom: 16, left: 16 },
    dither: "atkinson",
    header: {
      text: {
        value: "{{booth_name}}",
        font: "mono",
        size: 16,
        align: "center"
      }
    },
    frames: [
      { x: 24, y: 56, w: 336, h: 300, fit: "cover" },
      { x: 24, y: 372, w: 336, h: 300, fit: "cover" },
      { x: 24, y: 688, w: 336, h: 300, fit: "cover" }
    ],
    footer: {
      qr: { size: 192, data: "{{download_url}}" },
      code: { font: "mono", size: 16, align: "center", value: "{{code}}" }
    }
  },
  {
    name: "Grid 80 – 2x2",
    paper: "80mm",
    canvas: { width: 576, height: "auto" },
    margins: { top: 24, right: 24, bottom: 24, left: 24 },
    dither: "atkinson",
    frames: [
      { x: 24, y: 24, w: 264, h: 264, fit: "cover" },
      { x: 288, y: 24, w: 264, h: 264, fit: "cover" },
      { x: 24, y: 288, w: 264, h: 264, fit: "cover" }
    ],
    logo: { x: 288, y: 288, w: 264, h: 264, mode: "monochrome" },
    footer: {
      qr: { size: 256, data: "{{download_url}}" },
      code: { font: "mono", size: 18, align: "center", value: "{{code}}" }
    }
  },
  {
    name: "Poster 80 – XL Single",
    paper: "80mm",
    canvas: { width: 576, height: "auto" },
    margins: { top: 24, right: 24, bottom: 24, left: 24 },
    dither: "floyd-steinberg",
    frames: [
      { x: 24, y: 24, w: 528, h: 640, fit: "cover" }
    ],
    footer: {
      qr: { size: 256, align: "center", data: "{{download_url}}" },
      code: { font: "mono", size: 18, align: "center", value: "{{code}}" }
    }
  },
  {
    name: "Polaroid 80 – Caption",
    paper: "80mm",
    canvas: { width: 576, height: "auto" },
    margins: { top: 24, right: 24, bottom: 24, left: 24 },
    dither: "atkinson",
    frame_border: 16,
    frames: [
      { x: 56, y: 56, w: 464, h: 464, fit: "cover" }
    ],
    caption: {
      text: "",
      x: 56,
      y: 536,
      w: 464,
      h: 80,
      font: "mono",
      size: 16,
      align: "center"
    },
    footer: {
      qr: { size: 192, align: "right", data: "{{download_url}}" },
      code: { font: "mono", size: 16, align: "left", value: "{{code}}" }
    }
  }
]

export function getLayoutByName(name: string): Layout | undefined {
  return LAYOUTS.find(layout => layout.name === name)
}

export function getLayoutsByPaper(paper: '58mm' | '80mm'): Layout[] {
  return LAYOUTS.filter(layout => layout.paper === paper)
}
