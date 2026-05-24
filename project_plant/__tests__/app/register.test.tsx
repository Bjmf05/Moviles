import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

jest.mock('@/components/FloatingLeavesLayer', () => () => null);

jest.mock('../../components/DatePickerField', () => {
  const mockReact = require('react');
  const { Text, Pressable } = require('react-native');
  return {
    DatePickerField: ({ onChange, value }: any) =>
      mockReact.createElement(
        Pressable,
        { onPress: () => onChange?.('1990-01-15'), testID: 'date-picker' },
        mockReact.createElement(Text, null, value || 'Selecciona una fecha'),
      ),
  };
});

const mockRegister = jest.fn<Promise<void>, [string, string, string, string?, string?]>();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    login: jest.fn(),
    register: mockRegister,
    logout: jest.fn(),
    updateProfile: jest.fn(),
    setAuthState: jest.fn(),
  }),
}));

import RegisterScreen from '../../app/(auth)/register';
import { router } from 'expo-router';

describe('Register Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders app name and welcome text', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Plant')).toBeTruthy();
    expect(getByText('Crea tu cuenta')).toBeTruthy();
    expect(getByText('Únete a Plant')).toBeTruthy();
  });

  it('renders all form fields', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('👤 Nombre completo')).toBeTruthy();
    expect(getByText('📧 Correo electrónico')).toBeTruthy();
    expect(getByText('🔐 Contraseña')).toBeTruthy();
    expect(getByText('🔐 Confirmar contraseña')).toBeTruthy();
    expect(getByText('🌎 País')).toBeTruthy();
  });

  it('renders submit button and login link', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Crear cuenta')).toBeTruthy();
    expect(getByText('Inicia sesion')).toBeTruthy();
  });

  it('calls register on successful submission', async () => {
    mockRegister.mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText, getByTestId } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Tu nombre'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('correo@ejemplo.com'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Repite la contraseña'), 'password123');
    fireEvent.press(getByTestId('date-picker'));
    fireEvent.changeText(getByPlaceholderText('Ej. Costa Rica'), 'Costa Rica');
    fireEvent.press(getByText('Crear cuenta'));

    await act(async () => {});

    expect(mockRegister).toHaveBeenCalledWith(
      'test@test.com',
      'password123',
      'Test User',
      '1990-01-15',
      'Costa Rica',
    );
  });

  it('shows error toast on failed registration', async () => {
    mockRegister.mockRejectedValue({ code: 'auth/email-already-in-use' });
    const { getByPlaceholderText, getByText, getByTestId, queryByText } = render(<RegisterScreen />);

    expect(queryByText('Ese correo ya esta registrado. Prueba iniciar sesion.')).toBeNull();

    fireEvent.changeText(getByPlaceholderText('Tu nombre'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('correo@ejemplo.com'), 'existing@test.com');
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Repite la contraseña'), 'password123');
    fireEvent.press(getByTestId('date-picker'));
    fireEvent.changeText(getByPlaceholderText('Ej. Costa Rica'), 'Costa Rica');
    fireEvent.press(getByText('Crear cuenta'));

    await act(async () => {});

    expect(getByText('Ese correo ya esta registrado. Prueba iniciar sesion.')).toBeTruthy();
  });

  it('shows success toast on successful registration', async () => {
    mockRegister.mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText, getByTestId } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Tu nombre'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('correo@ejemplo.com'), 'new@test.com');
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Repite la contraseña'), 'password123');
    fireEvent.press(getByTestId('date-picker'));
    fireEvent.changeText(getByPlaceholderText('Ej. Costa Rica'), 'Costa Rica');
    fireEvent.press(getByText('Crear cuenta'));

    await act(async () => {});

    expect(getByText('Cuenta creada correctamente.')).toBeTruthy();
  });

  it('navigates back on login link press', () => {
    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText('Inicia sesion'));
    expect(router.back).toHaveBeenCalled();
  });
});
