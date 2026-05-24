import React from 'react';
import { View } from 'react-native';

export const CameraView = ({ children, style, ...props }: any) =>
  React.createElement(View, { style, testID: 'camera-view', ...props }, children);

export const CameraType = { back: 'back', front: 'front' };
export const FlashMode = { off: 'off', on: 'on', auto: 'auto' };

export const Camera = {
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  getCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
};
