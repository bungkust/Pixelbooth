import { useState } from 'react';
import { PermissionPage } from './components/PermissionPage';
import { TemplateSelector } from './components/TemplateSelector';
import { PhotoBoothApp } from './components/PhotoBoothApp';
import './App.css';

type AppPage = 'permission' | 'template' | 'photobooth';

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

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('permission');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handlePermissionGranted = () => {
    setCurrentPage('template');
  };

  const handleTemplateSelected = (template: Template) => {
    setSelectedTemplate(template);
    setCurrentPage('photobooth');
  };

  const handleBackToTemplate = () => {
    setCurrentPage('template');
  };

  return (
    <div id="app-container">
      {currentPage === 'permission' && (
        <PermissionPage onPermissionGranted={handlePermissionGranted} />
      )}
      {currentPage === 'template' && (
        <TemplateSelector onTemplateSelected={handleTemplateSelected} />
      )}
      {currentPage === 'photobooth' && selectedTemplate && (
        <PhotoBoothApp template={selectedTemplate} onBackToTemplate={handleBackToTemplate} />
      )}
    </div>
  );
}

export default App;
