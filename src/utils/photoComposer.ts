import { floydSteinbergDither } from './dithering';
import { loadConfig } from './config';

interface Template {
  id: string;
  name: string;
  description: string;
  width: number; // mm
  height: number; // mm
  photoCount: number;
  layout: 'vertical' | 'horizontal' | 'grid';
  thermalSize: '58mm' | '80mm';
}

/**
 * Compose photos into a single strip with high-quality dithering based on template
 */
export async function composeResult(p: any, frames: any[], template: Template): Promise<any> {
  console.log('Composing result...');
  
  // Load config for custom text
  const config = await loadConfig();
  console.log('Config loaded:', config);
  
  // Tentukan layout berdasarkan template
  const W = 1024; // 1024px
  const margin = 24;
  const gap = 16;
  const cellW = W - margin * 2;
  const cellH = cellW; // Rasio 1:1
  const footerH = 80;
  const headerH = (config.mainText && config.mainText.trim()) || (config.subText && config.subText.trim()) ? 120 : 0; // Space for custom text

  let H: number = margin + headerH + cellH + footerH + margin; // Default height
  let photoPositions: { x: number; y: number }[] = [];

  if (template.layout === 'vertical') {
    // Vertical layout: photos stacked vertically
    H = margin + headerH + (cellH * template.photoCount) + (gap * (template.photoCount - 1)) + footerH + margin;
    
    for (let i = 0; i < template.photoCount; i++) {
      photoPositions.push({
        x: margin,
        y: margin + headerH + i * (cellH + gap)
      });
    }
  } else if (template.layout === 'horizontal') {
    // Horizontal layout: photos side by side
    const photoWidth = (W - margin * 2 - gap * (template.photoCount - 1)) / template.photoCount;
    H = margin + headerH + photoWidth + footerH + margin;
    
    for (let i = 0; i < template.photoCount; i++) {
      photoPositions.push({
        x: margin + i * (photoWidth + gap),
        y: margin + headerH
      });
    }
  } else if (template.layout === 'grid') {
    // Grid layout: photos in grid (2x2 for 4 photos, etc.)
    const cols = template.photoCount === 4 ? 2 : template.photoCount === 6 ? 3 : 2;
    const rows = Math.ceil(template.photoCount / cols);
    const photoWidth = (W - margin * 2 - gap * (cols - 1)) / cols;
    const photoHeight = photoWidth; // Square photos
    
    H = margin + headerH + (photoHeight * rows) + (gap * (rows - 1)) + footerH + margin;
    
    for (let i = 0; i < template.photoCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      photoPositions.push({
        x: margin + col * (photoWidth + gap),
        y: margin + headerH + row * (photoHeight + gap)
      });
    }
  }

  const out = p.createGraphics(W, H);
  out.background(255); // Latar putih
  
  // Render custom text header if provided
  if ((config.mainText && config.mainText.trim()) || (config.subText && config.subText.trim())) {
    out.fill(0);
    out.noStroke();
    out.textAlign(p.CENTER, p.CENTER);
    out.textFont('monospace');
    
    const headerY = margin + (headerH / 2);
    
    if (config.mainText && config.mainText.trim()) {
      out.textSize(48);
      out.text(config.mainText.trim(), W / 2, headerY - 15);
    }
    
    if (config.subText && config.subText.trim()) {
      out.textSize(32);
      out.text(config.subText.trim(), W / 2, headerY + 25);
    }
  }
  
  for (let i = 0; i < template.photoCount; i++) {
    const pos = photoPositions[i];
    
    // Terapkan dither kualitas tinggi (Floyd-Steinberg)
    console.log(`Applying FS dither to frame ${i}...`);
    const ditheredFrame = floydSteinbergDither(p, frames[i]);
    console.log(`Dither complete for frame ${i}.`);

    if (template.layout === 'horizontal') {
      const photoWidth = (W - margin * 2 - gap * (template.photoCount - 1)) / template.photoCount;
      out.image(ditheredFrame, pos.x, pos.y, photoWidth, photoWidth);
    } else if (template.layout === 'grid') {
      const cols = template.photoCount === 4 ? 2 : template.photoCount === 6 ? 3 : 2;
      const photoWidth = (W - margin * 2 - gap * (cols - 1)) / cols;
      out.image(ditheredFrame, pos.x, pos.y, photoWidth, photoWidth);
    } else {
      // Vertical layout
      out.image(ditheredFrame, pos.x, pos.y, cellW, cellH);
    }
  }

  // Tambahkan Footer
  const footerY = H - margin - footerH;
  out.fill(0);
  out.noStroke();
  out.textAlign(p.CENTER, p.CENTER);
  out.textFont('monospace'); 
  out.textSize(28);
  
  const tgl = new Date();
  const dateStr = `${tgl.getFullYear()}.${(tgl.getMonth()+1).toString().padStart(2,'0')}.${tgl.getDate().toString().padStart(2,'0')}`;
  const footerText = `PIXEL BOOTH // ${dateStr}`;
  
  out.text(footerText, W / 2, footerY + (footerH / 2));

  console.log('Composing complete. Ready for review.');
  return out;
}
