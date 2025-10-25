import { useState, useRef, useEffect } from 'react';
import { PermissionGate } from './components/PermissionGate';
import { PhotoBooth, type PhotoBoothRef } from './components/PhotoBooth';
import { Controls, type AppState } from './components/Controls';
import { useWakeLock } from './hooks/useWakeLock';
import './App.css';

function App() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState('');
  const [, setFrames] = useState<any[]>([]);
  const [, setFinalComposite] = useState<any | null>(null);
  const [, setCanvasSize] = useState({ width: 640, height: 480 });
  const [, setIsReviewMode] = useState(false);
  
  const photoBoothRef = useRef<PhotoBoothRef>(null);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  const handleRequestPermission = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      // Stop the stream as we'll let p5.js handle it
      stream.getTracks().forEach(track => track.stop());
      
      // Request wake lock
      await requestWakeLock();
      
      setAppState('PREVIEW');
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError(`Gagal akses kamera (${(err as Error).name}). Pastikan Anda memberi izin.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    if (photoBoothRef.current) {
      photoBoothRef.current.startCountdown(3);
    }
  };

  const handleRetake = () => {
    if (photoBoothRef.current) {
      photoBoothRef.current.resetToPreview();
    }
  };

  const handleDownload = () => {
    if (photoBoothRef.current) {
      photoBoothRef.current.downloadComposite();
    }
  };

  const handlePrint = async () => {
    try {
      // Get the final composite data URL (same as download)
      if (!photoBoothRef.current) {
        console.error('PhotoBooth ref not found');
        return;
      }

      const dataURL = photoBoothRef.current.getFinalCompositeDataURL();
      if (!dataURL) {
        console.error('Final composite not found for printing');
        return;
      }

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.error('Failed to open print window');
        return;
      }
      
      // Create print-friendly HTML
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pixel Booth Print</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: monospace;
              background: white;
            }
            .print-container {
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .print-image {
              max-width: 100%;
              height: auto;
              image-rendering: pixelated;
              image-rendering: -moz-crisp-edges;
              image-rendering: crisp-edges;
            }
            .print-footer {
              text-align: center;
              font-size: 12px;
              margin-top: 10px;
              padding: 5px;
            }
            @media print {
              body { margin: 0; }
              .print-container { width: 100%; }
              .print-image { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <img src="${dataURL}" alt="Pixel Booth Photo" class="print-image" />
            <div class="print-footer">
              PIXEL BOOTH<br/>
              ${new Date().toLocaleDateString('id-ID')}
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Wait for image to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
      
    } catch (error) {
      console.error('Print failed:', error);
      alert('Gagal mencetak. Silakan coba lagi.');
    }
  };

  const handleStateChange = (newState: AppState) => {
    setAppState(newState);
    
    // Release wake lock when in review mode
    if (newState === 'REVIEW') {
      releaseWakeLock();
    }
  };

  const handleFramesUpdate = (newFrames: any[]) => {
    setFrames(newFrames);
  };

  const handleFinalCompositeUpdate = (composite: any | null) => {
    setFinalComposite(composite);
  };

  const handleCountdownTextUpdate = (text: string) => {
    setCountdownText(text);
  };

  const handleCanvasResize = (width: number, height: number) => {
    setCanvasSize({ width, height });
  };

  const handleCanvasModeChange = (isReview: boolean) => {
    setIsReviewMode(isReview);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return (
    <div id="app-container">
      {appState === 'IDLE' && (
        <PermissionGate
          onRequestPermission={handleRequestPermission}
          isLoading={isLoading}
          error={error}
        />
      )}
      
      {appState !== 'IDLE' && (
        <>
          <div className="app-header">
            <h1 className="app-title">PIXEL BOOTH</h1>
            <p className="app-description">
              SNAP & PRINT! PRESS START FOR A QUICK<br/>
              PHOTO SESSION, COUNTDOWN BEGINS IN...<br/>
              3-2-1-SMILE! 3 PHOTOS WILL BE TAKEN<br/>
              AUTOMATICALLY! YOUR PICS PRINT INSTANTLY!
            </p>
          </div>
          
          <PhotoBooth
            ref={photoBoothRef}
            state={appState}
            countdownText={countdownText}
            onStateChange={handleStateChange}
            onFramesUpdate={handleFramesUpdate}
            onFinalCompositeUpdate={handleFinalCompositeUpdate}
            onCountdownTextUpdate={handleCountdownTextUpdate}
            onCanvasResize={handleCanvasResize}
            onCanvasModeChange={handleCanvasModeChange}
          />
          
          <div id="ui-overlay">
            <Controls
              state={appState}
              onStart={handleStart}
              onRetake={handleRetake}
              onDownload={handleDownload}
              onPrint={handlePrint}
            />
          </div>
          
          <div className="app-footer">
            <div className="stars">****</div>
            <div>THANK YOU FOR SMILING WITH PIXEL BOOTH</div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
