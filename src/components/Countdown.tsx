import React from 'react';
import type { AppState } from './Controls';

interface CountdownProps {
  state: AppState;
  countdownText: string;
}

export const Countdown: React.FC<CountdownProps> = ({
  state,
  countdownText
}) => {
  const shouldShow = ['COUNTDOWN', 'CAPTURING', 'COMPOSING'].includes(state);
  
  if (!shouldShow || !countdownText) {
    return null;
  }

  return (
    <div id="countdown-display">
      {countdownText}
    </div>
  );
};
