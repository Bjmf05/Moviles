import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('expo-linear-gradient');

import VariantButton from '../../components/VariantButton';

describe('VariantButton', () => {
  it('renders label text', () => {
    const { getByText } = render(
      <VariantButton onPress={jest.fn()} label="Guardar" />,
    );
    expect(getByText('Guardar')).toBeTruthy();
  });

  it('renders icon when provided', () => {
    const { getByText } = render(
      <VariantButton onPress={jest.fn()} label="Eliminar" icon="🗑️" />,
    );
    expect(getByText('🗑️')).toBeTruthy();
  });

  it('renders primary variant by default', () => {
    const { getByText } = render(
      <VariantButton onPress={jest.fn()} label="Primary" />,
    );
    expect(getByText('Primary')).toBeTruthy();
  });

  it('renders secondary variant', () => {
    const { getByText } = render(
      <VariantButton
        onPress={jest.fn()}
        label="Secondary"
        variant="secondary"
      />,
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders danger variant', () => {
    const { getByText } = render(
      <VariantButton onPress={jest.fn()} label="Danger" variant="danger" />,
    );
    expect(getByText('Danger')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <VariantButton onPress={onPress} label="Press me" />,
    );
    fireEvent.press(getByText('Press me'));
    expect(onPress).toHaveBeenCalled();
  });
});
