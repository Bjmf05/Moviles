import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

jest.mock('@/components/FloatingLeavesLayer', () => () => null);
jest.mock('@/components/ForgotPasswordModal', () => () => null);

const mockLogin = jest.fn<Promise<void>, [string, string]>();
const mockSetAuthState = jest.fn<Promise<void>, [any, string]>();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    login: mockLogin,
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
    setAuthState: mockSetAuthState,
  }),
}));

const mockAuthGoogle = jest.fn();
jest.mock('../../hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    authGoogle: mockAuthGoogle,
    request: true,
  }),
}));

import LoginScreen from '../../app/(auth)/login';
import { router } from 'expo-router';

describe('Login Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders app name and welcome text', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Plant')).toBeTruthy();
    expect(getByText('Descubre el mundo vegetal')).toBeTruthy();
    expect(getByText('¡Bienvenido de nuevo!')).toBeTruthy();
  });

  it('renders email and password inputs', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    expect(getByPlaceholderText('correo@ejemplo.com')).toBeTruthy();
    expect(getByPlaceholderText('Tu contraseña')).toBeTruthy();
    expect(getByText('📧 Correo electrónico')).toBeTruthy();
    expect(getByText('🔐 Contraseña')).toBeTruthy();
  });

  it('renders submit button and Google button', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('🌱 Iniciar sesión')).toBeTruthy();
    expect(getByText('Google')).toBeTruthy();
  });

  it('renders register link', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Regístrate')).toBeTruthy();
  });

  it('calls login and navigates on successful submission', async () => {
    mockLogin.mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('correo@ejemplo.com'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Tu contraseña'), 'password123');
    fireEvent.press(getByText('🌱 Iniciar sesión'));

    await act(async () => {});

    expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('shows error toast on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    const { getByPlaceholderText, getByText, queryByText } = render(<LoginScreen />);

    expect(queryByText('Correo o contraseña incorrectos.')).toBeNull();

    fireEvent.changeText(getByPlaceholderText('correo@ejemplo.com'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Tu contraseña'), 'wrong');
    fireEvent.press(getByText('🌱 Iniciar sesión'));

    await act(async () => {});

    expect(getByText('Correo o contraseña incorrectos.')).toBeTruthy();
  });

  it('does not call login when form is invalid (empty fields)', async () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('🌱 Iniciar sesión'));

    await act(async () => {});

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('navigates to register on link press', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Regístrate'));
    expect(router.push).toHaveBeenCalledWith('/(auth)/register');
  });

  it('renders forgot password link', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('¿Olvidaste tu contraseña?')).toBeTruthy();
  });
});
