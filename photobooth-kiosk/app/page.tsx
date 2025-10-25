"use client";

import { useRef, useEffect, useState } from "react";
import p5 from "p5";

declare global {
  interface Window {
    p5Instance: p5 | null;
  }
}

export default function Photobooth() {
  const p5ContainerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'PERMISSION' | 'PREVIEW' | 'COUNTDOWN' | 'CAPTURING' | 'COMPOSING' | 'REVIEW'>('PERMISSION');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // p5.js variables
  let video: any;
  let pgPreview: any;
  let frames: any[] = [];
  let finalComposite: any;
  const shotsNeeded = 3;
  let countdownEndAt = 0;
  let lastShotAt = 0;

  useEffect(() => {
    // Don't auto-initialize camera - wait for user permission
    // Camera should only start when user clicks "Izinkan Kamera" button
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize camera using p5.js createCapture() like in master file
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      if (window.p5Instance) {
        const p = window.p5Instance;

        // Use p5.js createCapture directly like master file
        video = p.createCapture(constraints, async (stream: any) => {
          console.log('Video stream acquired (audio: false).');

          const settings = stream.getVideoTracks()[0].getSettings();
          // Force 4:3 aspect ratio like master
          const previewWidth = 640;
          const previewHeight = 480;

          video.size(previewWidth, previewHeight);
          video.hide();

          // Setup canvas like master file
          const canvas = p.createCanvas(previewWidth, previewHeight);
          canvas.parent('canvas-wrap');
          p.pixelDensity(1);

          // Create preview buffer like master
          pgPreview = p.createGraphics(previewWidth, previewHeight);

          // Bind UI buttons like master
          bindUI();

          // Request wake lock like master
          if ('wakeLock' in navigator) {
            try {
              const wakeLock = await navigator.wakeLock.request('screen');
              console.log('Screen Wake Lock is active.');
            } catch (err) {
              console.error('Wake Lock error:', err);
            }
          }

          // Set state and start loop like master
          setState('PREVIEW');
          p.loop();

          // Handle UI transitions like master file
          const gateEl = document.getElementById('permission-gate');
          const canvasWrapEl = document.getElementById('canvas-wrap');
          const uiOverlayEl = document.getElementById('ui-overlay');
          const startBtnEl = document.getElementById('start-btn');
          const permBtn = document.getElementById('permission-btn');

          if (gateEl) gateEl.classList.add('hidden');
          if (canvasWrapEl) canvasWrapEl.classList.remove('hidden');
          if (uiOverlayEl) uiOverlayEl.classList.remove('hidden');
          if (startBtnEl) startBtnEl.classList.remove('hidden');

          // Reset permission button
          if (permBtn) {
            permBtn.textContent = 'Izinkan Kamera';
            (permBtn as HTMLButtonElement).disabled = false;
          }
        });

        // Handle errors like master file
        video.elt.onerror = (e: any) => {
          console.error("Error pada elemen video:", e);
          throw e;
        };
        video.elt.onstalled = (e: any) => {
          console.warn("Video stream stalled:", e);
        };

      }
    } catch (err: any) {
      // Error handling is done in handlePermissionClick
      throw err;
    }
  };

  const handlePermissionClick = async () => {
    const permBtn = document.getElementById('permission-btn') as HTMLButtonElement;
    const errorEl = document.getElementById('permission-error') as HTMLParagraphElement;

    if (permBtn) {
      permBtn.textContent = 'Loading...';
      permBtn.disabled = true;
    }

    if (errorEl) {
      errorEl.classList.add('hidden');
    }

    try {
      await initializeApp();
      // Success - UI transitions are handled in initializeApp
    } catch (err: any) {
      console.error('Failed to initialize camera:', err);
      if (permBtn) {
        permBtn.textContent = 'Error! Coba lagi.';
        permBtn.disabled = false;
      }
      setError(`Gagal akses kamera (${err.name}). Pastikan Anda memberi izin.`);
      if (errorEl) {
        errorEl.classList.remove('hidden');
      }
    }
  };

  const initializeP5 = () => {
    if (p5ContainerRef.current && !window.p5Instance) {
      window.p5Instance = new p5((p: p5) => {
        p.setup = () => {
          const canvas = p.createCanvas(640, 480);
          canvas.parent(p5ContainerRef.current!);
          p.pixelDensity(1);

          // Create preview buffer
          pgPreview = p.createGraphics(640, 480);
        };

        p.draw = () => {
          if (!video) return; // Don't draw if video not ready

          p.background(255); // White background

          if (state === 'PREVIEW' || state === 'COUNTDOWN' || state === 'CAPTURING' || state === 'COMPOSING') {
            // Draw video to buffer using p5.js video object
            pgPreview.image(video, 0, 0, pgPreview.width, pgPreview.height);
            // Grayscale
            pgPreview.filter(p.GRAY);
            // Dithering Bayer (Ordered) - fast for preview
            orderedDither(p, pgPreview);
            // Display buffer to main canvas
            p.image(pgPreview, 0, 0, p.width, p.height);

            // Handle state logic
            if (state === 'COUNTDOWN') handleCountdown();
            if (state === 'CAPTURING') autoCaptureLoop(p);
          } else if (state === 'REVIEW') {
            // Show final photo strip
            if (finalComposite) {
              p.image(finalComposite, 0, 0, p.width, p.height);
            }
          }
        };
      });
    }
  };

  const orderedDither = (p: p5, gfx: any) => {
    gfx.loadPixels();

    const M4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];

    const M = M4;
    const n = M.length;
    const n2 = n * n;
    const scale = 255 / n2;

    for (let y = 0; y < gfx.height; y++) {
      for (let x = 0; x < gfx.width; x++) {
        const idx = (y * gfx.width + x) * 4;
        const lum = gfx.pixels[idx];
        const threshold = M[y % n][x % n] * scale;
        const v = lum < threshold ? 0 : 255;

        gfx.pixels[idx] = v;
        gfx.pixels[idx + 1] = v;
        gfx.pixels[idx + 2] = v;
      }
    }
    gfx.updatePixels();
  };

  const floydSteinbergDither = (p: p5, img: any) => {
    const ditheredImg = p.createImage(img.width, img.height);
    ditheredImg.copy(img, 0, 0, img.width, img.height, 0, 0, ditheredImg.width, ditheredImg.height);

    ditheredImg.loadPixels();

    const getPix = (x: number, y: number) => {
      if (x < 0 || x >= ditheredImg.width || y < 0 || y >= ditheredImg.height) return 0;
      return ditheredImg.pixels[(y * ditheredImg.width + x) * 4];
    };

    const setPix = (x: number, y: number, val: number) => {
      if (x < 0 || x >= ditheredImg.width || y < 0 || y >= ditheredImg.height) return;
      const idx = (y * ditheredImg.width + x) * 4;
      const v = p.constrain(val, 0, 255);
      ditheredImg.pixels[idx] = v;
      ditheredImg.pixels[idx + 1] = v;
      ditheredImg.pixels[idx + 2] = v;
      ditheredImg.pixels[idx + 3] = 255;
    };

    for (let y = 0; y < ditheredImg.height; y++) {
      for (let x = 0; x < ditheredImg.width; x++) {
        const oldVal = getPix(x, y);
        const newVal = (oldVal < 128) ? 0 : 255;
        setPix(x, y, newVal);

        const err = oldVal - newVal;

        setPix(x + 1, y,     getPix(x + 1, y)     + err * 7 / 16);
        setPix(x - 1, y + 1, getPix(x - 1, y + 1) + err * 3 / 16);
        setPix(x,     y + 1, getPix(x,     y + 1) + err * 5 / 16);
        setPix(x + 1, y + 1, getPix(x + 1, y + 1) + err * 1 / 16);
      }
    }
    ditheredImg.updatePixels();
    return ditheredImg;
  };

  const handleCountdown = () => {
    const countdownEl = document.getElementById('countdown-display');
    const timeLeft = Math.ceil((countdownEndAt - Date.now()) / 1000);

    if (timeLeft > 0) {
      if (countdownEl && countdownEl.textContent != timeLeft.toString()) {
        countdownEl.textContent = timeLeft.toString();
      }
    } else if (timeLeft <= 0 && state === 'COUNTDOWN') {
      if (countdownEl) countdownEl.textContent = 'SMILE!';
      setState('CAPTURING');
      frames = [];
    }
  };

  const autoCaptureLoop = (p: p5) => {
    if (frames.length < shotsNeeded && video) {
      const now = Date.now();
      const interval = 2500;

      if (frames.length === 0 || (now - lastShotAt > interval)) {
        // Capture directly from p5.js video object like in master file
        const rawShot = p.createImage(video.width, video.height);
        rawShot.copy(video, 0, 0, video.width, video.height, 0, 0, rawShot.width, rawShot.height);

        // Convert to grayscale
        rawShot.filter(p.GRAY);

        frames.push(rawShot);
        lastShotAt = now;
        console.log(`Photo ${frames.length} captured.`);

        // Update countdown display like master file
        const countdownEl = document.getElementById('countdown-display');
        if (countdownEl) {
          countdownEl.textContent = `SNAP ${frames.length}`;
          setTimeout(() => {
            if (state === 'CAPTURING' && countdownEl) {
              countdownEl.textContent = '';
            }
          }, 500);
        }

        if (frames.length === shotsNeeded) {
          setState('COMPOSING');
          const countdownEl2 = document.getElementById('countdown-display');
          if (countdownEl2) countdownEl2.textContent = 'Merging...';
          setTimeout(composeResult, 100);
        }
      }
    }
  };

  const composeResult = () => {
    if (window.p5Instance) {
      const p = window.p5Instance;

      // Layout for photo strip
      const W = 1024;
      const margin = 24;
      const gap = 16;
      const cellW = W - margin * 2;
      const cellH = cellW;
      const footerH = 80;

      const H = margin + (cellH * 3) + (gap * 2) + footerH + margin;

      const out = p.createGraphics(W, H);
      out.background(255);

      // Draw 3 photos with dithering
      for (let i = 0; i < 3; i++) {
        const x = margin;
        const y = margin + i * (cellH + gap);

        const ditheredFrame = floydSteinbergDither(p, frames[i]);
        out.image(ditheredFrame, x, y, cellW, cellH);
      }

      // Add footer
      const footerY = H - margin - footerH;
      out.fill(0);
      out.noStroke();
      out.textAlign(p.CENTER, p.CENTER);
      out.textFont('Courier New');
      out.textSize(28);

      const tgl = new Date();
      const dateStr = `${tgl.getFullYear()}.${(tgl.getMonth()+1).toString().padStart(2,'0')}.${tgl.getDate().toString().padStart(2,'0')}`;
      const footerText = `DOCKET BOOTH // ${dateStr}`;

      out.text(footerText, W / 2, footerY + (footerH / 2));

      finalComposite = out;

      // Switch to review state
      setState('REVIEW');
      p.resizeCanvas(W, H);

      // Clear countdown display like master file
      const countdownEl = document.getElementById('countdown-display');
      if (countdownEl) countdownEl.textContent = '';

      // Show review buttons like in master file
      const retakeBtnEl = document.getElementById('retake-btn');
      const downloadBtnEl = document.getElementById('download-btn');

      if (retakeBtnEl) retakeBtnEl.classList.remove('hidden');
      if (downloadBtnEl) downloadBtnEl.classList.remove('hidden');

      console.log('Composition complete. Ready for review.');
    }
  };

  const bindUI = () => {
    const startBtn = document.getElementById('start-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const downloadBtn = document.getElementById('download-btn');

    if (startBtn) {
      startBtn.onclick = () => {
        startBtn.classList.add('hidden');
        startCountdown(3);
      };
    }

    if (retakeBtn) {
      retakeBtn.onclick = () => {
        frames = [];
        finalComposite = null;

        if (window.p5Instance) {
          window.p5Instance.resizeCanvas(640, 480);
        }

        setState('PREVIEW');
        retakeBtn.classList.add('hidden');
        downloadBtn?.classList.add('hidden');
        startBtn?.classList.remove('hidden');
      };
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => {
        if (finalComposite && window.p5Instance) {
          const timestamp = new Date().toISOString()
            .replace(/[-:.]/g, '')
            .substring(0, 15);
          const filename = `booth-${timestamp}.png`;
          window.p5Instance.save(finalComposite, filename);
        }
      };
    }
  };

  const startCountdown = (sec: number) => {
    countdownEndAt = Date.now() + sec * 1000;
    const countdownEl = document.getElementById('countdown-display');
    if (countdownEl) {
      countdownEl.textContent = sec.toString();
    }
    setState('COUNTDOWN');
  };

  return (
    <div className="min-h-screen bg-white text-black font-mono overflow-hidden">
      <div className="flex flex-col items-center justify-center w-full h-screen p-6 box-border">

        {/* Permission Gate */}
        {state === 'PERMISSION' && (
          <div id="permission-gate" className="text-center">
            <h1 className="text-4xl mb-4">Docket Booth</h1>
            <p className="text-xl mb-6 max-w-sm">Izinkan akses kamera untuk memulai sesi foto Anda.</p>
            <button
              id="permission-btn"
              onClick={handlePermissionClick}
              className="font-mono text-xl px-6 py-4 border-2 border-black bg-white hover:bg-black hover:text-white transition-all duration-100"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              onMouseDown={(e) => {
                e.currentTarget.style.boxShadow = '1px 1px 0 0 #000000';
                e.currentTarget.style.transform = 'translate(3px, 3px)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 0 0 #000000';
                e.currentTarget.style.transform = 'translate(0, 0)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 0 0 #000000';
                e.currentTarget.style.transform = 'translate(0, 0)';
              }}
            >
              Izinkan Kamera
            </button>
            {error && (
              <p id="permission-error" className="text-red-600 mt-4 hidden">{error}</p>
            )}
          </div>
        )}

        {/* Canvas Wrapper */}
        <div id="canvas-wrap" className={`relative border-2 border-black bg-gray-200 max-w-2xl w-full ${state === 'PERMISSION' ? 'hidden' : ''}`}>
          <div ref={p5ContainerRef} className="flex justify-center items-center"></div>

          {/* UI Overlay */}
          <div id="ui-overlay" className={`absolute inset-0 flex flex-col justify-between items-center pointer-events-none ${state === 'PERMISSION' ? 'hidden' : ''}`}>

            {/* Countdown Display */}
            <div id="countdown-display"></div>

            {/* Other state displays */}
            {state === 'CAPTURING' && (
              <div
                className="text-9xl font-bold text-white pt-16"
                style={{
                  textShadow: '0 0 10px #000000, 0 0 5px #000000, 0 2px 2px #000000'
                }}
              >
                SNAP {frames.length}
              </div>
            )}

            {state === 'COMPOSING' && (
              <div
                className="text-9xl font-bold text-white pt-16"
                style={{
                  textShadow: '0 0 10px #000000, 0 0 5px #000000, 0 2px 2px #000000'
                }}
              >
                Merging...
              </div>
            )}

            {/* Controls */}
            <div className="w-full flex justify-center gap-4 p-6 box-border pointer-events-auto">
              {state === 'PREVIEW' && (
                <button
                  id="start-btn"
                  className="hidden font-mono text-xl px-6 py-4 border-2 border-black bg-white hover:bg-black hover:text-white transition-all duration-100"
                  style={{ boxShadow: '4px 4px 0 0 #000000' }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.boxShadow = '1px 1px 0 0 #000000';
                    e.currentTarget.style.transform = 'translate(3px, 3px)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.boxShadow = '4px 4px 0 0 #000000';
                    e.currentTarget.style.transform = 'translate(0, 0)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '4px 4px 0 0 #000000';
                    e.currentTarget.style.transform = 'translate(0, 0)';
                  }}
                >
                  Start
                </button>
              )}

              {state === 'REVIEW' && (
                <>
                  <button
                    id="retake-btn"
                    className="hidden font-mono text-xl px-6 py-4 border-2 border-black bg-white hover:bg-black hover:text-white transition-all duration-100"
                    style={{ boxShadow: '4px 4px 0 0 #000000' }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.boxShadow = '1px 1px 0 0 #000000';
                      e.currentTarget.style.transform = 'translate(3px, 3px)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.boxShadow = '4px 4px 0 0 #000000';
                      e.currentTarget.style.transform = 'translate(0, 0)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '4px 4px 0 0 #000000';
                      e.currentTarget.style.transform = 'translate(0, 0)';
                    }}
                  >
                    Ulangi
                  </button>
                  <button
                    id="download-btn"
                    className="hidden font-mono text-xl px-6 py-4 border-2 border-black bg-white hover:bg-black hover:text-white transition-all duration-100"
                    style={{ boxShadow: '4px 4px 0 0 #000000' }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.boxShadow = '1px 1px 0 0 #000000';
                      e.currentTarget.style.transform = 'translate(3px, 3px)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.boxShadow = '4px 4px 0 0 #000000';
                      e.currentTarget.style.transform = 'translate(0, 0)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '4px 4px 0 0 #000000';
                      e.currentTarget.style.transform = 'translate(0, 0)';
                    }}
                  >
                    Download
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* No need for hidden canvas since p5.js handles everything */}
    </div>
  );
}
