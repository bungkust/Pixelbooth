import { useRef, forwardRef, useImperativeHandle } from 'react';
import Sketch from 'react-p5';
import { orderedDither } from '../utils/dithering';
import { useAudio } from '../hooks/useAudio';
import type { AppState } from './Controls';

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

interface PhotoBoothProps {
  state: AppState;
  countdownText: string;
  template: Template;
  onStateChange: (newState: AppState) => void;
  onFramesUpdate: (frames: any[]) => void;
  onFinalCompositeUpdate: (composite: any | null) => void;
  onCountdownTextUpdate: (text: string) => void;
  onCanvasResize: (width: number, height: number) => void;
  onCanvasModeChange: (isReviewMode: boolean) => void;
}

export interface PhotoBoothRef {
  startCountdown: (seconds: number) => void;
  resetToPreview: () => void;
  downloadComposite: () => void;
  getFinalCompositeDataURL: () => string | null;
}

export const PhotoBooth = forwardRef<PhotoBoothRef, PhotoBoothProps>(({
  state,
  countdownText,
  template,
  onStateChange,
  onFramesUpdate,
  onFinalCompositeUpdate,
  onCountdownTextUpdate,
  onCanvasResize,
  onCanvasModeChange
}, ref) => {
  const videoRef = useRef<any>(null);
  const pgPreviewRef = useRef<any>(null);
  const framesRef = useRef<any[]>([]);
  const finalCompositeRef = useRef<any>(null);
  const lastShotAtRef = useRef<number>(0);
  const { initializeAudio, playCountdownBeep, playCaptureSound } = useAudio();
  const countdownEndAtRef = useRef<number>(0);
  const lastBeepTimeRef = useRef<number>(0);
  const p5InstanceRef = useRef<any>(null);
  const shotsNeeded = template.photoCount;
  const previewWidth = 500;
  const previewHeight = 375;
  const finalWidth = 1024;

  const setup = (p: any, canvasParentRef: Element) => {
    p5InstanceRef.current = p;
    
    // Initialize audio
    initializeAudio();
    
    // Create canvas with willReadFrequently for better performance
    const canvas = p.createCanvas(previewWidth, previewHeight);
    canvas.parent(canvasParentRef);
    canvas.elt.setAttribute('willReadFrequently', 'true');
    p.pixelDensity(1);
    
    console.log('Canvas created:', previewWidth, 'x', previewHeight);

    // Create preview buffer
    pgPreviewRef.current = p.createGraphics(previewWidth, previewHeight);

    // Initialize video capture
    const constraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

      videoRef.current = p.createCapture(constraints, () => {
        console.log('Video stream acquired (audio: false).');
        
        if (videoRef.current) {
          videoRef.current.size(previewWidth, previewHeight);
          videoRef.current.hide();
        }
        
        // Start the draw loop when camera is ready
        p.loop();
        onStateChange('PREVIEW');
      });

    // Handle video errors
    if (videoRef.current) {
      videoRef.current.elt.onerror = (e: Event) => {
        console.error("Error pada elemen video:", e);
      };
      videoRef.current.elt.onstalled = (e: Event) => {
        console.warn("Video stream stalled:", e);
      };
    }

    p.noLoop(); // Don't start draw loop until camera is ready
  };

  const draw = (p: any) => {
    if (!videoRef.current || !pgPreviewRef.current) {
      // Show loading state when camera is not ready
      p.background(200); // Gray background
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);
      p.text('Loading camera...', p.width/2, p.height/2);
      return;
    }

    p.background(255); // White background

    if (['PREVIEW', 'COUNTDOWN', 'CAPTURING'].includes(state)) {
      // Show preview with fast dithering
      const video = videoRef.current;
      const pgPreview = pgPreviewRef.current;
      
      // 1. Draw video to buffer
      pgPreview.image(video, 0, 0, pgPreview.width, pgPreview.height);
      // 2. Grayscale
      pgPreview.filter(p.GRAY);
      // 3. Bayer dithering for fast preview (only every few frames for performance)
      if (p.frameCount % 2 === 0) { // Only dither every other frame
        orderedDither(pgPreview);
      }
      // 4. Display buffer to main canvas
      p.image(pgPreview, 0, 0, p.width, p.height);

      // Draw countdown text overlay on canvas
      if (state === 'COUNTDOWN' || state === 'CAPTURING') {
        p.fill(255); // White text
        p.stroke(0); // Black outline
        p.strokeWeight(8);
        p.textAlign(p.CENTER, p.CENTER);
        
        // Adjust font size based on text length
        if (countdownText.includes('SNAP')) {
          p.textSize(80); // Much smaller for "SNAP 1/3" text
        } else {
          p.textSize(150); // Smaller for countdown numbers
        }
        
        const centerX = p.width / 2;
        const centerY = p.height * 0.5; // 50% from top (more centered)
        
        p.text(countdownText, centerX, centerY);
        
        // Draw progress indicator during capture
        if (state === 'CAPTURING' && framesRef.current.length > 0) {
          const progressY = p.height * 0.7; // 70% from top
          const barWidth = p.width * 0.6; // 60% of canvas width
          const barHeight = 20;
          const barX = (p.width - barWidth) / 2;
          
          // Background bar
          p.fill(100);
          p.noStroke();
          p.rect(barX, progressY, barWidth, barHeight);
          
          // Progress bar
          const progress = framesRef.current.length / shotsNeeded;
          p.fill(255);
          p.rect(barX, progressY, barWidth * progress, barHeight);
          
          // Progress text
          p.fill(0);
          p.stroke(255);
          p.strokeWeight(2);
          p.textSize(16);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(`${framesRef.current.length}/${shotsNeeded}`, centerX, progressY + barHeight + 25);
        }
      }

      // Handle state logic
      if (state === 'COUNTDOWN') {
        handleCountdown(p);
      }
      if (state === 'CAPTURING') {
        autoCaptureLoop(p);
      }
    } else if (state === 'REVIEW') {
      // Show final composite
      if (finalCompositeRef.current) {
        p.image(finalCompositeRef.current, 0, 0, p.width, p.height);
      }
    }
  };

  const handleCountdown = (p: any) => {
    const timeLeft = Math.ceil((countdownEndAtRef.current - p.millis()) / 1000);
    
    if (timeLeft > 0) {
      onCountdownTextUpdate(timeLeft.toString());
      
      // Play beep sound only once per countdown number
      const now = p.millis();
      if (now - lastBeepTimeRef.current > 800) { // Prevent multiple beeps
        playCountdownBeep();
        lastBeepTimeRef.current = now;
      }
    } else if (timeLeft <= 0 && state === 'COUNTDOWN') {
      onCountdownTextUpdate('SMILE!');
      onStateChange('CAPTURING');
      lastShotAtRef.current = 0;
      framesRef.current = [];
      onFramesUpdate([]);
    }
  };

  const autoCaptureLoop = (p: any) => {
    const now = p.millis();
    const interval = 2500; // 2.5 second interval between photos

    if (framesRef.current.length < shotsNeeded && 
        (now - lastShotAtRef.current > interval || lastShotAtRef.current === 0)) {
      
      if (videoRef.current) {
        // Capture raw image from video, not from preview
        const rawShot = p.createImage(
          videoRef.current.width, 
          videoRef.current.height
        );
        rawShot.copy(
          videoRef.current, 
          0, 0, 
          videoRef.current.width, 
          videoRef.current.height, 
          0, 0, 
          rawShot.width, 
          rawShot.height
        );
        
        // Convert to grayscale
        rawShot.filter(p.GRAY);
        
        framesRef.current.push(rawShot);
        lastShotAtRef.current = now;
        onFramesUpdate([...framesRef.current]);
        
        console.log(`Foto ${framesRef.current.length} diambil.`);

        // Play capture sound
        playCaptureSound();

        onCountdownTextUpdate(`SNAP ${framesRef.current.length}/${shotsNeeded}`);
        setTimeout(() => {
          if (state === 'CAPTURING') onCountdownTextUpdate('');
        }, 500);

        if (framesRef.current.length === shotsNeeded) {
          onStateChange('COMPOSING');
          onCountdownTextUpdate('Merging...');
          setTimeout(() => composeResult(p), 100);
        }
      }
    }
  };

  const composeResult = (p: any) => {
    console.log('Composing result...');
    
    // Import composeResult function dynamically to avoid circular dependency
    import('../utils/photoComposer').then(async ({ composeResult: compose }) => {
      const composite = await compose(p, framesRef.current, template);
      finalCompositeRef.current = composite;
      onFinalCompositeUpdate(composite);

      // Switch to REVIEW state
      onStateChange('REVIEW');
      onCountdownTextUpdate('');
      
      // Resize canvas for review mode based on template
      const margin = 24;
      const gap = 16;
      const cellW = finalWidth - margin * 2;
      const cellH = cellW;
      const footerH = 80;
      
      let H: number;
      if (template.layout === 'vertical') {
        H = margin + 120 + (cellH * template.photoCount) + (gap * (template.photoCount - 1)) + footerH + margin;
      } else if (template.layout === 'horizontal') {
        const photoWidth = (finalWidth - margin * 2 - gap * (template.photoCount - 1)) / template.photoCount;
        H = margin + 120 + photoWidth + footerH + margin;
      } else if (template.layout === 'grid') {
        const cols = template.photoCount === 4 ? 2 : template.photoCount === 6 ? 3 : 2;
        const rows = Math.ceil(template.photoCount / cols);
        const photoWidth = (finalWidth - margin * 2 - gap * (cols - 1)) / cols;
        H = margin + 120 + (photoWidth * rows) + (gap * (rows - 1)) + footerH + margin;
      } else {
        H = margin + 120 + (cellH * template.photoCount) + (gap * (template.photoCount - 1)) + footerH + margin;
      }
      
      p.resizeCanvas(finalWidth, H);
      onCanvasResize(finalWidth, H);
      onCanvasModeChange(true);
      
      console.log('Composing complete. Ready for review.');
    });
  };


  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    startCountdown: (seconds: number) => {
      if (p5InstanceRef.current) {
        countdownEndAtRef.current = p5InstanceRef.current.millis() + seconds * 1000;
        onCountdownTextUpdate(seconds.toString());
        onStateChange('COUNTDOWN');
      }
    },
    resetToPreview: () => {
      if (p5InstanceRef.current) {
        framesRef.current = [];
        finalCompositeRef.current = null;
        onFramesUpdate([]);
        onFinalCompositeUpdate(null);
        
        p5InstanceRef.current.resizeCanvas(previewWidth, previewHeight);
        onCanvasResize(previewWidth, previewHeight);
        onCanvasModeChange(false);
        
        onStateChange('PREVIEW');
      }
    },
    downloadComposite: () => {
      if (p5InstanceRef.current && finalCompositeRef.current) {
        const timestamp = new Date().toISOString()
          .replace(/[-:.]/g, '')
          .substring(0, 15);
        const filename = `booth-${timestamp}.png`;
        p5InstanceRef.current.save(finalCompositeRef.current, filename);
      }
    },
    getFinalCompositeDataURL: () => {
      if (finalCompositeRef.current) {
        return finalCompositeRef.current.canvas.toDataURL('image/png');
      }
      return null;
    }
  }));

  return (
    <div id="canvas-wrap">
      <Sketch setup={setup} draw={draw} />
    </div>
  );
});
