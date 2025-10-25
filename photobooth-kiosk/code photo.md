<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <!-- Viewport & PWA tags -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Docket Booth</title>
  <meta name="theme-color" content="#ffffff">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">

  <!-- 
    Inlined PWA Manifest
  -->
  <link rel="manifest" href='data:application/json,{
    "name": "Docket Booth",
    "short_name": "Docket",
    "description": "B&W Dithered Photo Booth (MVP)",
    "start_url": ".",
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#ffffff",
    "theme_color": "#000000",
    "icons": [
      {
        "src": "https.placehold.co/192x192/000000/FFFFFF?text=DOCKET",
        "type": "image/png",
        "sizes": "192x192",
        "purpose": "any maskable"
      },
      {
        "src": "https.placehold.co/512x512/000000/FFFFFF?text=DOCKET",
        "type": "image/png",
        "sizes": "512x512",
        "purpose": "any maskable"
      }
    ]
  }'>
  
  <!-- Preconnect CDN -->
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>

  <!-- 
    Inlined CSS Styles
  -->
  <style>
    /* Global Reset & Font Setup */
    @font-face {
      font-family: 'PixelFont';
      src: local('Courier New'), local('Courier'), monospace;
    }

    :root {
      --c-black: #000000;
      --c-white: #ffffff;
      --size-margin: 24px;
      --size-gap: 16px;
      --font-main: 'PixelFont', monospace;
    }

    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: var(--font-main);
      background: var(--c-white);
      color: var(--c-black);
      overflow: hidden; /* Mencegah scrolling */
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    #app-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: relative;
      box-sizing: border-box;
    }

    /* 1. Permission Gate */
    #permission-gate {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--size-margin);
    }
    #permission-gate h1 {
      font-size: 32px;
      margin-bottom: var(--size-gap);
    }
    #permission-gate p {
      font-size: 18px;
      margin-bottom: var(--size-margin);
      max-width: 300px;
    }
    #permission-gate .error-message {
        color: #D32F2F; /* Merah */
        font-size: 16px;
        margin-top: 10px;
    }

    /* 2. Canvas Wrapper */
    #canvas-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      max-width: 640px; 
      margin: 0 auto;
      position: relative;
      border: 2px solid var(--c-black);
      box-sizing: border-box;
      background: #eee; /* Placeholder saat loading */
    }

    #canvas-wrap.review-mode {
      max-width: 1024px;
    }

    canvas {
      max-width: 100%;
      height: auto;
      display: block;
    }

    /* 3. UI Overlay */
    #ui-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      pointer-events: none; 
    }

    #countdown-display {
      font-size: 150px;
      color: var(--c-white);
      text-shadow: 0 0 10px var(--c-black), 0 0 5px var(--c-black), 0 2px 2px var(--c-black);
      text-align: center;
      padding-top: 40%;
      font-weight: bold;
    }

    #controls {
      width: 100%;
      display: flex;
      justify-content: center;
      gap: var(--size-gap);
      padding: var(--size-margin);
      box-sizing: border-box;
      pointer-events: all; /* Tombol bisa diklik */
    }

    /* Tombol */
    button {
      font-family: var(--font-main);
      font-size: 20px;
      padding: 16px 24px;
      border: 2px solid var(--c-black);
      background: var(--c-white);
      color: var(--c-black);
      cursor: pointer;
      text-align: center;
      transition: all 0.1s ease-in-out;
      box-shadow: 4px 4px 0 0 var(--c-black);
    }
    button:hover, button:active {
      background: var(--c-black);
      color: var(--c-white);
      box-shadow: 1px 1px 0 0 var(--c-black);
      transform: translate(3px, 3px);
    }
    button:active {
      transform: translate(4px, 4px);
      box-shadow: none;
    }
    button:disabled {
      background: #ccc;
      color: #888;
      box-shadow: none;
      transform: none;
      cursor: not-allowed;
    }


    /* Utility */
    .hidden {
      display: none !important;
    }

    /* Paksa Portrait Mode */
    @media (orientation: landscape) {
      body::after {
        content: 'Harap putar ke mode Portrait.';
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: var(--c-white);
        color: var(--c-black);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24px;
        z-index: 100;
      }
    }
  </style>
</head>
<body>

  <!-- Kontainer utama aplikasi -->
  <div id="app-container">
    
    <!-- 1. Permission Gate -->
    <div id="permission-gate">
      <h1>Docket Booth</h1>
      <p>Izinkan akses kamera untuk memulai sesi foto Anda.</p>
      <button id="permissionBtn">Izinkan Kamera</button>
      <p id="permission-error" class="error-message hidden"></p>
    </div>

    <!-- 2. Wrapper untuk canvas p5.js -->
    <main id="canvas-wrap" class="hidden"></main>

    <!-- 3. UI Overlay (Countdown & Tombol Kontrol) -->
    <div id="ui-overlay" class="hidden">
      <!-- Tampilan countdown (3, 2, 1...) -->
      <div id="countdown-display"></div>
      
      <!-- Tombol kontrol utama -->
      <div id="controls">
        <button id="startBtn" class="hidden">Start</button>
        <button id="retakeBtn" class="hidden">Ulangi</button>
        <button id="downloadBtn" class="hidden">Download</button>
      </div>
    </div>
  </div>

  <!-- Library -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
  
  <!-- 
    Inlined Aplikasi JavaScript
    (Gabungan sketch.js, app.js, dan service-worker.js)
  -->
  <script>
    // =======================================================
    // BAGIAN 1: Logika P5.js & Photo Booth (dari sketch.js)
    // =======================================================

    // Variabel Global untuk State & Objek p5
    let video;            // Objek video capture
    let pgPreview;        // p5.Graphics untuk buffer preview (fast dither)
    let state = 'IDLE';   // State machine: IDLE, PREVIEW, COUNTDOWN, CAPTURING, COMPOSING, REVIEW
    let frames = [];      // Array untuk menyimpan 3 frame (mentah, grayscale)
    let finalComposite;   // p5.Graphics untuk hasil akhir (strip foto)

    const shotsNeeded = 3;
    let lastShotAt = 0;
    let countdownEndAt = 0;

    // Ukuran resolusi
    let previewWidth = 640;
    let previewHeight = 480;
    const finalWidth = 1024; 

    // Referensi Elemen UI
    let countdownEl, startBtn, retakeBtn, downloadBtn, canvasWrapEl;
    let wakeLock = null;

    /**
     * Memulai kamera, wake lock, dan UI.
     * Dipanggil setelah user menekan tombol 'Izinkan Kamera'.
     */
    function initializeCameraAndUI(onSuccess, onError) {
      try {
        // 1. Inisialisasi Video Capture
        const constraints = {
          video: {
            facingMode: 'user', // Coba kamera depan dulu
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false // <-- PERBAIKAN: Tetap matikan microphone
        };

        video = createCapture(constraints, async (stream) => {
          // Sukses mendapat stream
          console.log('Video stream acquired (audio: false).');
          
          const settings = stream.getVideoTracks()[0].getSettings();
          // Paksakan 4:3
          previewWidth = 640;
          previewHeight = 480;

          video.size(previewWidth, previewHeight);
          video.hide();
          
          // 2. Setup Canvas p5.js
          const canvas = createCanvas(previewWidth, previewHeight);
          canvas.parent('canvas-wrap');
          pixelDensity(1);

          // 3. Buat buffer preview
          pgPreview = createGraphics(previewWidth, previewHeight);

          // 4. Bind Tombol UI
          bindUI();

          // 5. Minta Wake Lock
          await requestWakeLock();

          // 6. Set state dan mulai loop
          state = 'PREVIEW';
          loop(); // Mulai p5 draw loop
          
          // 7. Panggil callback sukses
          onSuccess(); 
          
        });
        
        // Tangani error jika createCapture gagal (penting untuk iOS)
        video.elt.onerror = (e) => {
          console.error("Error pada elemen video:", e);
          onError(e);
        };
        video.elt.onstalled = (e) => {
            console.warn("Video stream stalled:", e);
        };

      } catch (err) {
        console.error("Gagal memulai createCapture:", err);
        onError(err);
      }
    }

    /**
     * p5.js Setup (dijalankan 1x saat script load)
     */
    function setup() {
      // Ambil referensi elemen UI
      countdownEl = document.getElementById('countdown-display');
      startBtn = document.getElementById('startBtn');
      retakeBtn = document.getElementById('retakeBtn');
      downloadBtn = document.getElementById('downloadBtn');
      canvasWrapEl = document.getElementById('canvas-wrap');

      noLoop(); // Jangan jalankan draw() sebelum kamera siap
    }

    /**
     * p5.js Draw Loop (dijalankan terus-menerus setelah loop())
     */
    function draw() {
      if (!video) return; // Jangan gambar jika video belum siap

      background(255); // Latar putih

      if (state === 'PREVIEW' || state === 'COUNTDOWN' || state === 'CAPTURING') {
        // Tampilkan preview video dengan dither cepat
        
        // 1. Gambar video ke buffer
        pgPreview.image(video, 0, 0, pgPreview.width, pgPreview.height);
        // 2. Grayscale
        pgPreview.filter(GRAY);
        // 3. Dithering Bayer (Ordered) - cepat untuk preview
        orderedDither(pgPreview);
        // 4. Tampilkan buffer ke canvas utama
        image(pgPreview, 0, 0, width, height);

        // Handle state logic
        if (state === 'COUNTDOWN') handleCountdown();
        if (state === 'CAPTURING') autoCaptureLoop();
      
      } else if (state === 'REVIEW') {
        // Tampilkan hasil strip foto yang sudah jadi
        if (finalComposite) {
          image(finalComposite, 0, 0, width, height);
        }
      }
    }

    /**
     * Dithering Bayer (Ordered) 4x4.
     */
    function orderedDither(gfx, mSize = 4) {
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
      const scale = 255 / n2; // Skala threshold (255 / 16)

      for (let y = 0; y < gfx.height; y++) {
        for (let x = 0; x < gfx.width; x++) {
          const idx = (y * gfx.width + x) * 4;
          const lum = gfx.pixels[idx]; // Ambil nilai R (sudah grayscale)
          const threshold = M[y % n][x % n] * scale;
          const v = lum < threshold ? 0 : 255;
          
          gfx.pixels[idx] = v;
          gfx.pixels[idx + 1] = v;
          gfx.pixels[idx + 2] = v;
        }
      }
      gfx.updatePixels();
    }

    /**
     * Dithering Floyd-Steinberg.
     * Kualitas tinggi, lambat. Untuk compose final.
     */
    function floydSteinbergDither(img) {
      const ditheredImg = createImage(img.width, img.height);
      ditheredImg.copy(img, 0, 0, img.width, img.height, 0, 0, ditheredImg.width, ditheredImg.height);
      
      ditheredImg.loadPixels();
      
      const getPix = (x, y) => {
        if (x < 0 || x >= ditheredImg.width || y < 0 || y >= ditheredImg.height) return 0;
        return ditheredImg.pixels[(y * ditheredImg.width + x) * 4];
      };
      
      const setPix = (x, y, val) => {
        if (x < 0 || x >= ditheredImg.width || y < 0 || y >= ditheredImg.height) return;
        const idx = (y * ditheredImg.width + x) * 4;
        const v = constrain(val, 0, 255); // Pastikan nilai valid
        ditheredImg.pixels[idx] = v;
        ditheredImg.pixels[idx + 1] = v;
        ditheredImg.pixels[idx + 2] = v;
        ditheredImg.pixels[idx + 3] = 255;
      };

      for (let y = 0; y < ditheredImg.height; y++) {
        for (let x = 0; x < ditheredImg.width; x++) {
          const oldVal = getPix(x, y);
          const newVal = (oldVal < 128) ? 0 : 255; // Threshold 50%
          setPix(x, y, newVal);

          const err = oldVal - newVal;

          // Distribusikan error ke piksel tetangga
          setPix(x + 1, y,     getPix(x + 1, y)     + err * 7 / 16);
          setPix(x - 1, y + 1, getPix(x - 1, y + 1) + err * 3 / 16);
          setPix(x,     y + 1, getPix(x,     y + 1) + err * 5 / 16);
          setPix(x + 1, y + 1, getPix(x + 1, y + 1) + err * 1 / 16);
        }
      }
      ditheredImg.updatePixels();
      return ditheredImg;
    }

    /**
     * Menghubungkan tombol UI ke fungsi state machine.
     */
    function bindUI() {
      startBtn.onclick = () => {
        startBtn.classList.add('hidden');
        startCountdown(3); 
      };

      retakeBtn.onclick = () => {
        frames = []; 
        finalComposite = null; 
        
        resizeCanvas(previewWidth, previewHeight);
        canvasWrapEl.classList.remove('review-mode');
        
        state = 'PREVIEW';
        retakeBtn.classList.add('hidden');
        downloadBtn.classList.add('hidden');
        startBtn.classList.remove('hidden');
      };

      downloadBtn.onclick = () => {
        if (finalComposite) {
          const timestamp = new Date().toISOString()
            .replace(/[-:.]/g, '')
            .substring(0, 15); // YYYYMMDDTHHmmss
          const filename = `booth-${timestamp}.png`;
          save(finalComposite, filename);
        }
      };
    }

    /**
     * Memulai proses countdown.
     */
    function startCountdown(sec) {
      countdownEndAt = millis() + sec * 1000;
      countdownEl.textContent = sec;
      state = 'COUNTDOWN';
    }

    /**
     * Menangani update teks countdown.
     */
    function handleCountdown() {
      const timeLeft = Math.ceil((countdownEndAt - millis()) / 1000);
      
      if (timeLeft > 0) {
        if (countdownEl.textContent != timeLeft) {
          countdownEl.textContent = timeLeft;
        }
      } else if (timeLeft <= 0 && state === 'COUNTDOWN') {
        countdownEl.textContent = 'SMILE!';
        state = 'CAPTURING';
        lastShotAt = 0; 
        frames = []; 
      }
    }

    /**
     * Loop otomatis untuk mengambil 3 foto.
     */
    function autoCaptureLoop() {
      const now = millis();
      const interval = 2500; // Jeda 2.5 detik antar foto

      if (frames.length < shotsNeeded && (now - lastShotAt > interval || lastShotAt === 0)) {
        
        // Ambil gambar mentah dari video, BUKAN dari preview
        const rawShot = createImage(video.width, video.height);
        rawShot.copy(video, 0, 0, video.width, video.height, 0, 0, rawShot.width, rawShot.height);
        
        // Konversi ke grayscale
        rawShot.filter(GRAY);
        
        frames.push(rawShot);
        lastShotAt = now;
        console.log(`Foto ${frames.length} diambil.`);

        countdownEl.textContent = `SNAP ${frames.length}`;
        setTimeout(() => {
          if(state === 'CAPTURING') countdownEl.textContent = '';
        }, 500);

        if (frames.length === shotsNeeded) {
          state = 'COMPOSING';
          countdownEl.textContent = 'Merging...';
          setTimeout(composeResult, 100); 
        }
      }
    }

    /**
     * Menyusun 3 foto menjadi 1 strip.
     */
    function composeResult() {
      console.log('Composing result...');
      
      // Tentukan layout
      const W = finalWidth; // 1024px
      const margin = 24;
      const gap = 16;
      const cellW = W - margin * 2;
      const cellH = cellW; // Rasio 1:1
      const footerH = 80;

      const H = margin + (cellH * 3) + (gap * 2) + footerH + margin;

      const out = createGraphics(W, H);
      out.background(255); // Latar putih
      
      for (let i = 0; i < 3; i++) {
        const x = margin;
        const y = margin + i * (cellH + gap);
        
        // Terapkan dither kualitas tinggi (Floyd-Steinberg)
        console.log(`Applying FS dither to frame ${i}...`);
        const ditheredFrame = floydSteinbergDither(frames[i]);
        console.log(`Dither complete for frame ${i}.`);

        out.image(ditheredFrame, x, y, cellW, cellH);
      }

      // Tambahkan Footer
      const footerY = H - margin - footerH;
      out.fill(0);
      out.noStroke();
      out.textAlign(CENTER, CENTER);
      out.textFont(textStyle('monospace')); 
      out.textSize(28);
      
      const tgl = new Date();
      const dateStr = `${tgl.getFullYear()}.${(tgl.getMonth()+1).toString().padStart(2,'0')}.${tgl.getDate().toString().padStart(2,'0')}`;
      const footerText = `DOCKET BOOTH // ${dateStr}`;
      
      out.text(footerText, W / 2, footerY + (footerH / 2));

      finalComposite = out;

      // Pindah ke state REVIEW
      state = 'REVIEW';
      countdownEl.textContent = '';
      
      resizeCanvas(W, H);
      canvasWrapEl.classList.add('review-mode'); 

      retakeBtn.classList.remove('hidden');
      downloadBtn.classList.remove('hidden');
      
      console.log('Composing complete. Ready for review.');
    }


    /**
     * Meminta screen wake lock agar layar tidak mati.
     */
    async function requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => {
            console.log('Screen Wake Lock was released.');
          });
          console.log('Screen Wake Lock is active.');
        } catch (err) {
          console.error(`${err.name}, ${err.message}`);
        }
      } else {
        console.warn('Wake Lock API is not supported.');
      }
    }

    /**
     * Melepas wake lock (saat review atau app ditutup).
     */
    function releaseWakeLock() {
      if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
      }
    }


    // =======================================================
    // BAGIAN 2: Logika PWA & UI (dari app.js & service-worker.js)
    // =======================================================
    
    window.addEventListener('load', () => {
      
      // --- 1. Inlined Service Worker ---
      const swCode = `
        const CACHE_NAME = 'docket-booth-v1.0';
        // Cache file HTML ini sendiri dan library p5.js
        const URLS_TO_CACHE = [
          '.', 
          'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js'
        ];

        self.addEventListener('install', (event) => {
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('Service Worker: Opened cache');
                return cache.addAll(URLS_TO_CACHE);
              })
              .catch(err => {
                console.error('Service Worker: Failed to cache assets during install', err);
              })
          );
        });

        self.addEventListener('activate', (event) => {
          const cacheWhitelist = [CACHE_NAME];
          event.waitUntil(
            caches.keys().then((cacheNames) => {
              return Promise.all(
                cacheNames.map((cacheName) => {
                  if (cacheWhitelist.indexOf(cacheName) === -1) {
                    console.log('Service Worker: Deleting old cache', cacheName);
                    return caches.delete(cacheName);
                  }
                })
              );
            })
          );
        });

        self.addEventListener('fetch', (event) => {
          event.respondWith(
            caches.match(event.request)
              .then((response) => {
                if (response) {
                  return response;
                }
                return fetch(event.request);
              }
            )
          );
        });
      `;
      
      try {
        const swBlob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(swBlob);
        
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register(swUrl)
            .then(reg => console.log('Service Worker registered from Blob.', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
        }
      } catch (e) {
        console.error('Failed to create/register Service Worker from Blob', e);
      }

      // --- 2. Hubungkan UI (Permission Gate) ---
      const permBtn = document.getElementById('permissionBtn');
      const gateEl = document.getElementById('permission-gate');
      const canvasWrapEl = document.getElementById('canvas-wrap');
      const uiOverlayEl = document.getElementById('ui-overlay');
      const startBtnEl = document.getElementById('startBtn');
      const errorEl = document.getElementById('permission-error');

      permBtn.onclick = () => {
        permBtn.textContent = 'Loading...';
        permBtn.disabled = true;
        errorEl.classList.add('hidden');
        
        // Panggil fungsi inisialisasi dari BAGIAN 1 (sketch.js)
        if (typeof initializeCameraAndUI === 'function') {
          
          initializeCameraAndUI(
            // === PERBAIKAN BUG ===
            // Callback Sukses (kode yang hilang dikembalikan)
            () => {
              console.log('Camera and WakeLock ready.');
              gateEl.classList.add('hidden');
              canvasWrapEl.classList.remove('hidden');
              uiOverlayEl.classList.remove('hidden');
              startBtnEl.classList.remove('hidden');
              permBtn.textContent = 'Izinkan Kamera'; // Reset tombol
              permBtn.disabled = false;
            },
            // Callback Error
            (error) => {
              console.error('Failed to initialize:', error);
              permBtn.textContent = 'Error! Coba lagi.';
              permBtn.disabled = false;
              errorEl.textContent = `Gagal akses kamera (${error.name}). Pastikan Anda memberi izin.`;
              errorEl.classList.remove('hidden');
            }
          );

        } else {
          console.error('initializeCameraAndUI is not defined.');
          errorEl.textContent = 'Aplikasi gagal dimuat. Coba refresh.';
          errorEl.classList.remove('hidden');
        }
      };
    });
  </script>

</body>
</html>

