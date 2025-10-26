import React, { useState, useEffect } from 'react';

interface PermissionPageProps {
  onPermissionGranted: () => void;
}

export const PermissionPage: React.FC<PermissionPageProps> = ({ onPermissionGranted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      // Check if camera permission is already granted
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      if (result.state === 'granted') {
        // Permission already granted, proceed to photo booth
        onPermissionGranted();
        return;
      }
      
      setIsChecking(false);
    } catch (err) {
      console.log('Permission API not supported, will request manually');
      setIsChecking(false);
    }
  };

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
      
      // Permission granted, proceed to photo booth
      onPermissionGranted();
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError(`Gagal akses kamera (${(err as Error).name}). Pastikan Anda memberi izin.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div id="permission-gate">
        <div className="permission-content">
          <h1>Pixel Booth</h1>
          <p>Memeriksa izin kamera...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div id="permission-gate">
      <div className="permission-content">
        <h1>Pixel Booth</h1>
        <p>Izinkan akses kamera untuk memulai sesi foto Anda.</p>
        <button 
          id="permissionBtn" 
          onClick={handleRequestPermission}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Izinkan Kamera'}
        </button>
        {error && (
          <p id="permission-error" className="error-message">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
