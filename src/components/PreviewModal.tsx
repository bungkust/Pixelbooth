import React, { useState, useRef, useEffect } from 'react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageDataURL: string | null;
  templateName: string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  imageDataURL,
  templateName
}) => {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setImagePosition({ x: 0, y: 0 });
      setLastPinchDistance(0);
      setIsPinching(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 2) {
        // Start pinch gesture
        setIsPinching(true);
        setIsDragging(false);
        const distance = getDistance(e.touches[0], e.touches[1]);
        setLastPinchDistance(distance);
      } else if (e.touches.length === 1 && zoom > 1) {
        // Start single finger drag
        setIsDragging(true);
        setIsPinching(false);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX - imagePosition.x, y: touch.clientY - imagePosition.y });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 2 && isPinching) {
        // Handle pinch zoom
        const distance = getDistance(e.touches[0], e.touches[1]);
        if (lastPinchDistance > 0) {
          const scale = distance / lastPinchDistance;
          setZoom(prev => {
            const newZoom = prev * scale;
            return Math.max(0.1, Math.min(5, newZoom));
          });
        }
        setLastPinchDistance(distance);
      } else if (e.touches.length === 1 && isDragging && zoom > 1) {
        // Handle single finger drag
        const touch = e.touches[0];
        setImagePosition({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 0) {
        // All touches ended
        setIsDragging(false);
        setIsPinching(false);
        setLastPinchDistance(0);
      } else if (e.touches.length === 1) {
        // One touch ended, but another remains
        setIsPinching(false);
        if (zoom > 1) {
          setIsDragging(true);
          const touch = e.touches[0];
          setDragStart({ x: touch.clientX - imagePosition.x, y: touch.clientY - imagePosition.y });
        }
      }
    };

    if (isOpen) {
      const container = document.querySelector('.modal-body-fullscreen');
      if (container) {
        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        return () => {
          container.removeEventListener('wheel', handleWheel);
          container.removeEventListener('touchstart', handleTouchStart);
          container.removeEventListener('touchmove', handleTouchMove);
          container.removeEventListener('touchend', handleTouchEnd);
        };
      }
    }
  }, [isOpen, zoom, imagePosition, dragStart, isDragging, isPinching, lastPinchDistance]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setImagePosition({ x: 0, y: 0 });
    setLastPinchDistance(0);
    setIsPinching(false);
  };

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };


  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };


  if (!isOpen || !imageDataURL) return null;

  return (
    <div className="modal-overlay-fullscreen" onClick={onClose}>
      <div className="modal-content-fullscreen" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-fullscreen">
          <h3>Preview untuk Print & Download</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div 
          className="modal-body-fullscreen"
        >
          <div 
            className="preview-image-container-fullscreen"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ 
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              touchAction: 'none'
            }}
          >
            <img 
              ref={imageRef}
              src={imageDataURL} 
              alt="Preview untuk print" 
              className="preview-image-fullscreen"
              style={{
                transform: `scale(${zoom}) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
                transformOrigin: 'center center'
              }}
            />
          </div>
        </div>
        
        <div className="modal-footer-fullscreen">
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={handleZoomOut}>-</button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button className="zoom-btn" onClick={handleZoomIn}>+</button>
            <button className="reset-btn" onClick={handleResetZoom}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
};
