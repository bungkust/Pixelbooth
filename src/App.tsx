import { useState } from 'react';
import { PermissionPage } from './components/PermissionPage';
import { PhotoBoothApp } from './components/PhotoBoothApp';
import './App.css';

function App() {
  const [showPhotoBooth, setShowPhotoBooth] = useState(false);

  const handlePermissionGranted = () => {
    setShowPhotoBooth(true);
  };

  return (
    <div id="app-container">
      {!showPhotoBooth ? (
        <PermissionPage onPermissionGranted={handlePermissionGranted} />
      ) : (
        <PhotoBoothApp />
      )}
    </div>
  );
}

export default App;
