import React from 'react';

export type AppState = 'IDLE' | 'PREVIEW' | 'COUNTDOWN' | 'CAPTURING' | 'COMPOSING' | 'REVIEW';

interface ControlsProps {
  state: AppState;
  onStart: () => void;
  onRetake: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  state,
  onStart,
  onRetake,
  onDownload,
  onPrint
}) => {
  return (
    <div id="controls">
      {state === 'PREVIEW' && (
        <button id="startBtn" onClick={onStart}>
          Start
        </button>
      )}
      
      {state === 'REVIEW' && (
        <>
          <div className="button-row">
            <button id="retakeBtn" onClick={onRetake}>
              Ulangi
            </button>
            <button id="downloadBtn" onClick={onDownload}>
              Download
            </button>
          </div>
          <button id="printBtn" onClick={onPrint}>
            Print
          </button>
        </>
      )}
    </div>
  );
};
