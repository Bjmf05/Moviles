import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PhotoPreview from '../../components/PhotoPreview';

describe('PhotoPreview', () => {
  const defaultProps = {
    visible: true,
    uri: 'file:///test/photo.jpg',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not visible', () => {
    const { queryByText } = render(
      <PhotoPreview {...defaultProps} visible={false} />,
    );
    expect(queryByText('Usar foto')).toBeNull();
    expect(queryByText('Cerrar')).toBeNull();
  });

  it('renders confirm mode buttons by default', () => {
    const { getByText } = render(<PhotoPreview {...defaultProps} />);
    expect(getByText('Repetir')).toBeTruthy();
    expect(getByText('Usar foto')).toBeTruthy();
  });

  it('renders view mode with close button', () => {
    const { getByText } = render(
      <PhotoPreview {...defaultProps} mode="view" />,
    );
    expect(getByText('Cerrar')).toBeTruthy();
  });

  it('calls onRetake when retake pressed in confirm mode', () => {
    const onRetake = jest.fn();
    const { getByText } = render(
      <PhotoPreview {...defaultProps} onRetake={onRetake} />,
    );
    fireEvent.press(getByText('Repetir'));
    expect(onRetake).toHaveBeenCalled();
  });

  it('calls onConfirm when use photo pressed in confirm mode', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <PhotoPreview {...defaultProps} onConfirm={onConfirm} />,
    );
    fireEvent.press(getByText('Usar foto'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onClose when close pressed in view mode', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <PhotoPreview {...defaultProps} mode="view" onClose={onClose} />,
    );
    fireEvent.press(getByText('Cerrar'));
    expect(onClose).toHaveBeenCalled();
  });
});
