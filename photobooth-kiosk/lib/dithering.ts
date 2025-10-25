/**
 * Dithering functions for Docket Booth
 * Based on reference implementation from code photo.md
 */

import p5 from 'p5'

/**
 * Apply Bayer/Ordered dithering (4x4 matrix) to a p5.Image
 * Fast dithering for real-time preview
 */
export function applyBayerDithering(image: p5.Image, threshold: number = 128): void {
  image.loadPixels()
  
  const M4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ]
  
  const n = M4.length
  const n2 = n * n
  const scale = 255 / n2 // 255 / 16

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const idx = (y * image.width + x) * 4
      const lum = image.pixels[idx] // Already grayscale
      const thresholdValue = M4[y % n][x % n] * scale
      const v = lum < thresholdValue ? 0 : 255
      
      image.pixels[idx] = v
      image.pixels[idx + 1] = v
      image.pixels[idx + 2] = v
    }
  }
  
  image.updatePixels()
}

/**
 * Apply Floyd-Steinberg dithering to a p5.Image
 * High-quality dithering for final composite
 */
export function applyFloydSteinbergDither(image: p5.Image): p5.Image {
  const ditheredImg = (image as any).p5Instance.createImage(image.width, image.height)
  ditheredImg.copy(image, 0, 0, image.width, image.height, 0, 0, ditheredImg.width, ditheredImg.height)
  
  ditheredImg.loadPixels()
  
  const getPix = (x: number, y: number): number => {
    if (x < 0 || x >= ditheredImg.width || y < 0 || y >= ditheredImg.height) return 0
    return ditheredImg.pixels[(y * ditheredImg.width + x) * 4]
  }
  
  const setPix = (x: number, y: number, val: number): void => {
    if (x < 0 || x >= ditheredImg.width || y < 0 || y >= ditheredImg.height) return
    const idx = (y * ditheredImg.width + x) * 4
    const v = Math.max(0, Math.min(255, val))
    ditheredImg.pixels[idx] = v
    ditheredImg.pixels[idx + 1] = v
    ditheredImg.pixels[idx + 2] = v
    ditheredImg.pixels[idx + 3] = 255
  }

  for (let y = 0; y < ditheredImg.height; y++) {
    for (let x = 0; x < ditheredImg.width; x++) {
      const oldVal = getPix(x, y)
      const newVal = oldVal < 128 ? 0 : 255
      setPix(x, y, newVal)

      const err = oldVal - newVal

      // Distribute error to neighboring pixels
      setPix(x + 1, y,     getPix(x + 1, y)     + err * 7 / 16)
      setPix(x - 1, y + 1, getPix(x - 1, y + 1) + err * 3 / 16)
      setPix(x,     y + 1, getPix(x,     y + 1) + err * 5 / 16)
      setPix(x + 1, y + 1, getPix(x + 1, y + 1) + err * 1 / 16)
    }
  }
  
  ditheredImg.updatePixels()
  return ditheredImg
}
