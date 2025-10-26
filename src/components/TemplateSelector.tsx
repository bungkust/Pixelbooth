import React, { useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  width: number; // mm
  height: number; // mm
  photoCount: number;
  layout: 'vertical' | 'horizontal' | 'grid';
  thermalSize: '58mm' | '80mm';
  customText?: string;
  customSubtext?: string;
}

interface TemplateSelectorProps {
  onTemplateSelected: (template: Template) => void;
}

const templates: Template[] = [
  {
    id: 'strip-vertical',
    name: 'Classic Strip',
    description: '3 photos stacked vertically',
    width: 58,
    height: 180,
    photoCount: 3,
    layout: 'vertical',
    thermalSize: '58mm'
  },
  {
    id: 'strip-horizontal',
    name: 'Side by Side',
    description: '2 photos side by side',
    width: 58,
    height: 120,
    photoCount: 2,
    layout: 'horizontal',
    thermalSize: '58mm'
  },
  {
    id: 'strip-double',
    name: 'Double Strip',
    description: '4 photos in 2 rows',
    width: 58,
    height: 200,
    photoCount: 4,
    layout: 'grid',
    thermalSize: '58mm'
  }
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onTemplateSelected }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleContinue = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      onTemplateSelected(template);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div id="template-selector">
      <div className="template-content">
        <h1>Pixel Booth</h1>
        <p className="template-subtitle">Choose Your Photo Layout</p>
        
        <div className="template-dropdown-container">
          <label htmlFor="template-select" className="dropdown-label">
            Select Layout:
          </label>
          <select
            id="template-select"
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="template-dropdown"
          >
            <option value="">-- Choose Template --</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate && (
          <div className="template-preview-card">
            <h3>{selectedTemplate.name}</h3>
            <p>{selectedTemplate.description}</p>
            <div className="template-specs">
              <div className="spec-row">
                <div className="spec-item">
                  <span className="spec-label">Photos:</span>
                  <span className="spec-value">{selectedTemplate.photoCount}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Layout:</span>
                  <span className="spec-value">{selectedTemplate.layout}</span>
                </div>
              </div>
              <div className="spec-description">
                {selectedTemplate.layout === 'vertical' && 'Photos will be stacked vertically in a single column'}
                {selectedTemplate.layout === 'horizontal' && 'Photos will be arranged side by side in a single row'}
                {selectedTemplate.layout === 'grid' && 'Photos will be arranged in a grid pattern (2x2 for 4 photos)'}
              </div>
            </div>
          </div>
        )}

        <button 
          className="continue-button"
          onClick={handleContinue}
          disabled={!selectedTemplateId}
        >
          {selectedTemplate ? `Continue with ${selectedTemplate.name}` : 'Select a Template'}
        </button>
      </div>
    </div>
  );
};
