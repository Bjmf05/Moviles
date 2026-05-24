import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AnimatedAvatar from '../../components/AnimatedAvatar';

describe('AnimatedAvatar', () => {
  it('renders initial letter when no photoURL', () => {
    const { getByText } = render(
      <AnimatedAvatar name="John" onPress={jest.fn()} />,
    );
    expect(getByText('J')).toBeTruthy();
  });

  it('renders question mark when name is empty and no photo', () => {
    const { getByText } = render(
      <AnimatedAvatar name="" onPress={jest.fn()} />,
    );
    expect(getByText('?')).toBeTruthy();
  });

  it('renders camera icon', () => {
    const { getByText } = render(<AnimatedAvatar onPress={jest.fn()} />);
    expect(getByText('📷')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedAvatar name="John" onPress={onPress} />,
    );
    fireEvent.press(getByText('J'));
    expect(onPress).toHaveBeenCalled();
  });
});
