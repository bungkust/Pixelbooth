import { floydSteinbergDither } from './dithering';

/**
 * Compose 3 photos into a single strip with high-quality dithering
 */
export function composeResult(p: any, frames: any[]): any {
  console.log('Composing result...');
  
  // Tentukan layout
  const W = 1024; // 1024px
  const margin = 24;
  const gap = 16;
  const cellW = W - margin * 2;
  const cellH = cellW; // Rasio 1:1
  const footerH = 80;

  const H = margin + (cellH * 3) + (gap * 2) + footerH + margin;

  const out = p.createGraphics(W, H);
  out.background(255); // Latar putih
  
  for (let i = 0; i < 3; i++) {
    const x = margin;
    const y = margin + i * (cellH + gap);
    
    // Terapkan dither kualitas tinggi (Floyd-Steinberg)
    console.log(`Applying FS dither to frame ${i}...`);
    const ditheredFrame = floydSteinbergDither(p, frames[i]);
    console.log(`Dither complete for frame ${i}.`);

    out.image(ditheredFrame, x, y, cellW, cellH);
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
