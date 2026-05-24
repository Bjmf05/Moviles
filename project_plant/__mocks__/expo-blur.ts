import React from 'react';
import { View } from 'react-native';

export const BlurView = ({ children, style, ...props }: any) =>
  React.createElement(View, { style, ...props }, children);

export default BlurView;
