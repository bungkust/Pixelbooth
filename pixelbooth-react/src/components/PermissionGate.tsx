import React from 'react';

interface PermissionGateProps {
  onRequestPermission: () => void;
  isLoading: boolean;
  error: string | null;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  onRequestPermission,
  isLoading,
  error
}) => {
  return (
    <div id="permission-gate">
      <div className="permission-content">
        <h1>Docket Booth</h1>
        <p>Izinkan akses kamera untuk memulai sesi foto Anda.</p>
        <button 
          id="permissionBtn" 
          onClick={onRequestPermission}
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
