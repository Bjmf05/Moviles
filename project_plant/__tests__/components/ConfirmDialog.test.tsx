import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('expo-linear-gradient');
jest.mock('expo-blur');

import ConfirmDialog from '../../components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    visible: true,
    title: '¿Eliminar planta?',
    message: 'Esta acción no se puede deshacer',
    confirmLabel: 'Eliminar',
    cancelLabel: 'Cancelar',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not visible', () => {
    const { queryByText } = render(
      <ConfirmDialog {...defaultProps} visible={false} />,
    );
    expect(queryByText('¿Eliminar planta?')).toBeNull();
  });

  it('renders title when visible', () => {
    const { getByText } = render(<ConfirmDialog {...defaultProps} />);
    expect(getByText('¿Eliminar planta?')).toBeTruthy();
  });

  it('renders message when visible', () => {
    const { getByText } = render(<ConfirmDialog {...defaultProps} />);
    expect(getByText('Esta acción no se puede deshacer')).toBeTruthy();
  });

  it('renders confirm and cancel labels', () => {
    const { getByText } = render(<ConfirmDialog {...defaultProps} />);
    expect(getByText('Eliminar')).toBeTruthy();
    expect(getByText('Cancelar')).toBeTruthy();
  });

  it('calls onConfirm when confirm button pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} />,
    );
    fireEvent.press(getByText('Eliminar'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} onCancel={onCancel} />,
    );
    fireEvent.press(getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders with gradient header when gradientHeader is true', () => {
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} gradientHeader />,
    );
    expect(getByText('¿Eliminar planta?')).toBeTruthy();
  });

  it('renders danger confirm button when confirmDanger is true', () => {
    const { getByText } = render(
      <ConfirmDialog {...defaultProps} confirmDanger />,
    );
    expect(getByText('Eliminar')).toBeTruthy();
  });
});
