/**
 * Collage generator for Docket Booth
 * Creates a vertical photo strip with 3 square photos and date footer
 */

import p5 from 'p5'
import { applyFloydSteinbergDither } from './dithering'

interface CollageOptions {
  p5: p5
  frames: p5.Image[]
}

/**
 * Create a vertical photo strip composite from 3 frames
 */
export function createCollage({ p5, frames }: CollageOptions): p5.Graphics {
  // Layout dimensions (from reference)
  const W = 1024 // Final width
  const margin = 24
  const gap = 16
  const cellW = W - margin * 2 // 976px
  const cellH = cellW // Square ratio 1:1
  const footerH = 80
  
  // Calculate total height
  const H = margin + (cellH * 3) + (gap * 2) + footerH + margin
  
  // Create output graphics
  const out = p5.createGraphics(W, H)
  out.background(255)
  
  // Draw 3 photos with Floyd-Steinberg dithering
  for (let i = 0; i < 3; i++) {
    const x = margin
    const y = margin + i * (cellH + gap)
    
    // Apply high-quality dithering to each frame
    const ditheredFrame = applyFloydSteinbergDither(frames[i])
    
    out.image(ditheredFrame, x, y, cellW, cellH)
  }
  
  // Add footer with date
  const footerY = H - margin - footerH
  out.fill(0)
  out.noStroke()
  out.textAlign(p5.CENTER, p5.CENTER)
  out.textFont('monospace')
  out.textSize(28)
  
  const now = new Date()
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
  const footerText = `DOCKET BOOTH // ${dateStr}`
  
  out.text(footerText, W / 2, footerY + footerH / 2)
  
  return out
}
