import React from 'react';
import { Haptics, ImpactFeedbackStyle } from '../services/haptics';

export const getDistance = (t1: React.Touch, t2: React.Touch) => {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

export const getAngle = (t1: React.Touch, t2: React.Touch) => {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

export const snapRotation = (rotation: number): number => {
  const normalized = (rotation % 360 + 360) % 360; 
  const snapAngles = [0, 90, 180, 270, 360];
  const threshold = 5;

  for (const angle of snapAngles) {
    if (Math.abs(normalized - angle) < threshold) {
      if (Math.abs(normalized - angle) > 0.1) { 
         Haptics.impactAsync(ImpactFeedbackStyle.Light);
      }
      return angle % 360;
    }
  }
  return rotation;
};
