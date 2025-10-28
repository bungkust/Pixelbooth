import { useState, useRef, useEffect } from 'react';
import { PhotoBooth, type PhotoBoothRef, type AppState } from './PhotoBooth';
import { Controls } from './Controls';
import { PreviewModal } from './PreviewModal';
import { useWakeLock } from '../hooks/useWakeLock';
import { generateQRCodeDataURL, getDownloadURL } from '../utils/qrCodeGenerator';
import { UniversalBluetoothPrinterService } from '../services/universalBluetoothPrinterService';

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

interface PhotoBoothAppProps {
  template: Template;
  onBackToTemplate: () => void;
}

export const PhotoBoothApp: React.FC<PhotoBoothAppProps> = ({ template, onBackToTemplate }) => {
  const [appState, setAppState] = useState<AppState>('PREVIEW');
  const [countdownText, setCountdownText] = useState('');
  const [, setFrames] = useState<any[]>([]);
  const [, setFinalComposite] = useState<any | null>(null);
  const [, setCanvasSize] = useState({ width: 640, height: 480 });
  const [, setIsReviewMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [highResImageDataURL, setHighResImageDataURL] = useState<string | null>(null);
  const [bluetoothPrinter, setBluetoothPrinter] = useState<UniversalBluetoothPrinterService | null>(null);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [bluetoothError, setBluetoothError] = useState<string>('');
  const [printerInfo, setPrinterInfo] = useState<{ name: string; width: number; dpi: number } | null>(null);
  
  const photoBoothRef = useRef<PhotoBoothRef>(null);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  // Initialize wake lock when component mounts
  useEffect(() => {
    requestWakeLock();
    
    return () => {
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock]);

  const handleStart = () => {
    if (photoBoothRef.current) {
      photoBoothRef.current.startCountdown(3);
    }
  };

  const handleRetake = () => {
    onBackToTemplate();
  };

  const handleCanvasClick = async () => {
    if (appState === 'REVIEW' && photoBoothRef.current) {
      const photoId = photoBoothRef.current.getPhotoIdForPrint?.();
      if (photoId) {
        // Generate QR code for download page
        const downloadURL = getDownloadURL(photoId);
        console.log('Download URL for modal:', downloadURL);
        const qrCodeDataURL = await generateQRCodeDataURL(downloadURL);
        console.log('QR Code generated for modal:', !!qrCodeDataURL);
        
        if (qrCodeDataURL) {
          // Compose modal version with QR code
          const { composeResult } = await import('../utils/photoComposer');
          const p5Instance = photoBoothRef.current.getP5Instance?.();
          const frames = photoBoothRef.current.getFrames?.();
          
          console.log('P5 instance for modal:', !!p5Instance, 'Frames:', frames?.length);
          
          if (p5Instance && frames) {
            const modalComposite = await composeResult(
              p5Instance,
              frames,
              template,
              qrCodeDataURL
            );
            
            if (modalComposite) {
              const modalDataURL = modalComposite.canvas.toDataURL('image/png');
              setHighResImageDataURL(modalDataURL);
              setIsModalOpen(true);
              console.log('Modal opened with QR code');
            }
          }
        } else {
          // Fallback to high-res without QR code
          const highResDataURL = photoBoothRef.current.getFinalCompositeDataURL();
          if (highResDataURL) {
            setHighResImageDataURL(highResDataURL);
            setIsModalOpen(true);
          }
        }
      } else {
        // Fallback to high-res without QR code
        const highResDataURL = photoBoothRef.current.getFinalCompositeDataURL();
        if (highResDataURL) {
          setHighResImageDataURL(highResDataURL);
          setIsModalOpen(true);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setHighResImageDataURL(null);
  };

  const handleDownload = () => {
    if (photoBoothRef.current) {
      photoBoothRef.current.downloadComposite();
    }
  };

  const handlePrint = async () => {
    try {
      if (!photoBoothRef.current) {
        console.error('PhotoBooth ref not found');
        return;
      }

      // Get photo ID
      const photoId = photoBoothRef.current.getPhotoIdForPrint();
      console.log('Photo ID for print:', photoId);
      
      let dataURL: string | null = null;

      if (photoId) {
        // Generate QR code for download page
        const downloadURL = getDownloadURL(photoId);
        console.log('Download URL:', downloadURL);
        const qrCodeDataURL = await generateQRCodeDataURL(downloadURL);
        console.log('QR Code generated:', !!qrCodeDataURL);
        
        if (qrCodeDataURL) {
          // Compose print version with QR code
          const { composeResult } = await import('../utils/photoComposer');
          const p5Instance = photoBoothRef.current.getP5Instance?.();
          const frames = photoBoothRef.current.getFrames?.();
          
          console.log('P5 instance:', !!p5Instance, 'Frames:', frames?.length);
          
          if (p5Instance && frames) {
            const printComposite = await composeResult(
              p5Instance,
              frames,
              template,
              qrCodeDataURL
            );
            dataURL = printComposite.canvas.toDataURL('image/png');
            console.log('Print composite with QR created:', !!dataURL);
          }
        }
      }
      
      // Fallback to regular composite
      if (!dataURL) {
        dataURL = photoBoothRef.current.getFinalCompositeDataURL();
      }

      if (!dataURL) {
        console.error('Final composite not found for printing');
        return;
      }

      // Try Bluetooth printing first
      if (isBluetoothConnected && bluetoothPrinter) {
        const ok = await bluetoothPrinter.printImage(dataURL);
        if (ok) {
          alert('Printed via Bluetooth');
          return;
        }
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

  const handleConnectBluetooth = async () => {
    try {
      setBluetoothError('');
      if (!('bluetooth' in navigator)) {
        setBluetoothError('Web Bluetooth not supported');
        alert('Web Bluetooth not supported in this browser');
        return;
      }
      const svc = new UniversalBluetoothPrinterService();
      const connected = await svc.connect();
      if (connected) {
        setBluetoothPrinter(svc);
        setIsBluetoothConnected(true);
        setPrinterInfo(svc.getPrinterInfo());
        alert(`Connected to ${svc.getPrinterInfo()?.name || 'Printer'}`);
      } else {
        setBluetoothError('Failed to connect to printer');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setBluetoothError(msg);
      alert('Bluetooth connect error: ' + msg);
    }
  };

  const handleDisconnectBluetooth = async () => {
    try {
      await bluetoothPrinter?.disconnect();
    } finally {
      setBluetoothPrinter(null);
      setIsBluetoothConnected(false);
      setPrinterInfo(null);
      setBluetoothError('');
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
    
    // Add/remove review-mode class to canvas wrap
    const canvasWrap = document.getElementById('canvas-wrap');
    if (canvasWrap) {
      if (isReview) {
        canvasWrap.classList.add('review-mode');
      } else {
        canvasWrap.classList.remove('review-mode');
      }
    }
  };

  return (
    <>
      <div className="app-header">
        <h1 className="app-title">PIXEL BOOTH</h1>
        <p className="template-info">Layout: {template.name}</p>
        <p className="app-description">
          SNAP & PRINT! PRESS START FOR A QUICK<br/>
          PHOTO SESSION, COUNTDOWN BEGINS IN...<br/>
          3-2-1-SMILE! {template.photoCount} PHOTOS WILL BE TAKEN<br/>
          AUTOMATICALLY! READY TO PRINT!
        </p>
      </div>

      {/* Bluetooth controls */}
      <div className="bluetooth-controls">
        {!isBluetoothConnected ? (
          <button
            className="bluetooth-btn"
            onClick={handleConnectBluetooth}
            disabled={!('bluetooth' in navigator)}
          >
            {('bluetooth' in navigator) ? 'Connect Bluetooth Printer' : 'Bluetooth Not Supported'}
          </button>
        ) : (
          <div className="bluetooth-status">
            <div className="printer-info">
              <span>Connected: {printerInfo?.name}</span>
              {printerInfo && (
                <span className="printer-specs">{printerInfo.width}px · {printerInfo.dpi} DPI</span>
              )}
            </div>
            <button className="disconnect-btn" onClick={handleDisconnectBluetooth}>Disconnect</button>
          </div>
        )}
        {bluetoothError && <div className="bluetooth-error">{bluetoothError}</div>}
      </div>
      
      <div onClick={handleCanvasClick}>
        <PhotoBooth
          ref={photoBoothRef}
          state={appState}
          countdownText={countdownText}
          template={template}
          onStateChange={handleStateChange}
          onFramesUpdate={handleFramesUpdate}
          onFinalCompositeUpdate={handleFinalCompositeUpdate}
          onCountdownTextUpdate={handleCountdownTextUpdate}
          onCanvasResize={handleCanvasResize}
          onCanvasModeChange={handleCanvasModeChange}
        />
      </div>
      
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
      
      <PreviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        imageDataURL={highResImageDataURL}
      />
    </>
  );
};
