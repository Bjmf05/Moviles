import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

jest.mock('@/components/FloatingLeavesLayer', () => () => null);
jest.mock('@/components/QuickStats', () => () => null);

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid', email: 'test@test.com', name: 'Test User' },
    token: 'mock-token-123',
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
    setAuthState: jest.fn(),
  }),
}));

import HomeScreen from '../../app/(tabs)/index';
import { router } from 'expo-router';

describe('Home Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders greeting with user first name', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Hola, Test')).toBeTruthy();
  });

  it('renders subtitle', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Que planta quieres identificar hoy?')).toBeTruthy();
  });

  it('renders identify plant card', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Identificar planta')).toBeTruthy();
    expect(getByText('Toma una foto o elige de tu galeria')).toBeTruthy();
  });

  it('renders garden and explore cards', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Mi Jardin')).toBeTruthy();
    expect(getByText('Explorar')).toBeTruthy();
  });

  it('renders daily tip section', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Tip del dia')).toBeTruthy();
  });

  it('navigates to camera when hero card is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Identificar planta'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/camera');
  });

  it('navigates to garden when Mi Jardin card is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Mi Jardin'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/garden');
  });

  it('navigates to explore when Explorar card is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Explorar'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/explore');
  });


});
