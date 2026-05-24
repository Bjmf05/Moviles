import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import Toast from '../../components/Toast';

describe('Toast', () => {
  const defaultProps = {
    visible: true,
    message: 'Operación exitosa',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not visible', () => {
    const { queryByText } = render(
      <Toast {...defaultProps} visible={false} />,
    );
    expect(queryByText('Operación exitosa')).toBeNull();
  });

  it('renders the message when visible', () => {
    const { getByText } = render(<Toast {...defaultProps} />);
    expect(getByText('Operación exitosa')).toBeTruthy();
  });

  it('renders the success icon by default', () => {
    const { getByText } = render(<Toast {...defaultProps} />);
    expect(getByText('✅')).toBeTruthy();
  });

  it('renders the close button', () => {
    const { getByText } = render(<Toast {...defaultProps} />);
    expect(getByText('✕')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <Toast {...defaultProps} onClose={onClose} />,
    );
    fireEvent.press(getByText('✕'));
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose after duration expires', () => {
    const onClose = jest.fn();
    render(<Toast {...defaultProps} onClose={onClose} duration={1000} />);
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders error type with error icon', () => {
    const { getByText } = render(
      <Toast {...defaultProps} type="error" />,
    );
    expect(getByText('❌')).toBeTruthy();
  });

  it('renders warning type with warning icon', () => {
    const { getByText } = render(
      <Toast {...defaultProps} type="warning" />,
    );
    expect(getByText('⚠️')).toBeTruthy();
  });
});
