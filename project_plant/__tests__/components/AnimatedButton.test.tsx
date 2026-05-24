import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('expo-linear-gradient');

import AnimatedButton from '../../components/AnimatedButton';

describe('AnimatedButton', () => {
  it('renders children text', () => {
    const { getByText } = render(
      <AnimatedButton onPress={jest.fn()}>Iniciar sesión</AnimatedButton>,
    );
    expect(getByText('Iniciar sesión')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedButton onPress={onPress}>Press me</AnimatedButton>,
    );
    fireEvent.press(getByText('Press me'));
    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedButton onPress={onPress} loading>
        Loading
      </AnimatedButton>,
    );
    fireEvent.press(getByText('Loading'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
