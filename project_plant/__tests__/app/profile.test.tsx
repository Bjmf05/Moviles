jest.mock('@/components/AnimatedAvatar', () => () => null);
jest.mock('@/components/InfoField', () => {
  const r = require('react');
  const { Text } = require('react-native');
  return ({ icon, label, value }: any) =>
    r.createElement(Text, null, `${icon} ${label}: ${value || '—'}`);
});
jest.mock('@/components/VariantButton', () => {
  const r = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ label, onPress }: any) =>
    r.createElement(TouchableOpacity, { onPress }, r.createElement(Text, null, label));
});
jest.mock('@/components/PhotoPreview', () => () => null);
jest.mock('@/components/ConfirmDialog', () => {
  const r = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ visible, onConfirm, onCancel }: any) => {
    if (!visible) return null;
    return r.createElement(r.Fragment, null,
      r.createElement(TouchableOpacity, { onPress: onConfirm, testID: 'confirm-logout' },
        r.createElement(Text, null, 'Salir')),
      r.createElement(TouchableOpacity, { onPress: onCancel, testID: 'cancel-logout' },
        r.createElement(Text, null, 'Cancelar')),
    );
  };
});
jest.mock('../../components/DatePickerField', () => {
  const mr = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    DatePickerField: ({ onChange, value }: any) =>
      mr.createElement(Pressable, { onPress: () => onChange?.('1990-01-15'), testID: 'profile-date-picker' },
        mr.createElement(Text, null, value || 'Selecciona una fecha')),
  };
});
jest.mock('@/hooks/useCamera', () => ({
  useCamera: () => ({
    cameraRef: { current: null },
    requestCameraPermission: jest.fn().mockResolvedValue(true),
    takePhoto: jest.fn().mockResolvedValue({ uri: 'file://mock/photo.jpg' }),
    facing: 'back',
    flashMode: 'off',
    toggleFacing: jest.fn(),
    toggleFlash: jest.fn(),
  }),
}));

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

const mockProfileUser = { uid: 'test-uid', email: 'test@test.com', name: 'Test User' };
const mockProfileToken = 'mock-token-123';
const mockLogout = jest.fn<Promise<void>, []>();
const mockUploadImage = jest.fn<Promise<string>, [string]>().mockResolvedValue('https://example.com/avatar.jpg');

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockProfileUser,
    token: mockProfileToken,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: mockLogout,
    updateProfile: jest.fn(),
    setAuthState: jest.fn(),
  }),
}));

jest.mock('@/lib/plants', () => ({
  usePlants: () => ({
    uploadImage: mockUploadImage,
    savePlant: jest.fn(),
    getUserPlants: jest.fn(),
    deletePlant: jest.fn(),
  }),
}));

const mockGetProfile = jest.fn();
const mockUpdateProfileFn = jest.fn();
jest.mock('../../lib/api', () => ({
  api: {
    auth: {
      getProfile: (...args: unknown[]) => mockGetProfile(...args),
      updateProfile: (...args: unknown[]) => mockUpdateProfileFn(...args),
    },
  },
}));

import ProfileScreen from '../../app/(tabs)/profile';

describe('Profile Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProfile.mockResolvedValue({
      name: 'Test User',
      email: 'test@test.com',
      birthdate: '1990-05-15',
      country: 'Costa Rica',
      photoURL: 'https://example.com/photo.jpg',
    });
    mockUpdateProfileFn.mockResolvedValue({ success: true });
  });

  it('renders header title', async () => {
    const { findByText } = render(<ProfileScreen />);
    expect(await findByText('Mi Perfil')).toBeTruthy();
  });

  it('renders user name and email from profile', async () => {
    const { findByText } = render(<ProfileScreen />);
    expect(await findByText('Test User')).toBeTruthy();
    expect(await findByText('test@test.com')).toBeTruthy();
  });

  it('loads profile data on mount', async () => {
    render(<ProfileScreen />);
    await act(async () => {});
    expect(mockGetProfile).toHaveBeenCalledWith(mockProfileToken);
  });

  it('shows info fields in view mode when profile loads', async () => {
    const { findByText } = render(<ProfileScreen />);
    expect(await findByText('👤 Nombre: Test User')).toBeTruthy();
    expect(await findByText('📧 Correo: test@test.com')).toBeTruthy();
    expect(await findByText('🌍 Pais: Costa Rica')).toBeTruthy();
  });

  it('switches to edit mode on edit button press', async () => {
    const { findByText } = render(<ProfileScreen />);
    fireEvent.press(await findByText('Editar perfil'));
    expect(await findByText('Guardar cambios')).toBeTruthy();
    expect(await findByText('Cancelar')).toBeTruthy();
  });

  it('cancels edit and returns to view mode', async () => {
    const { findByText } = render(<ProfileScreen />);
    fireEvent.press(await findByText('Editar perfil'));
    fireEvent.press(await findByText('Cancelar'));
    await act(async () => {});
    expect(await findByText('Informacion personal')).toBeTruthy();
  });

  it('saves profile changes', async () => {
    const { findByText, getByPlaceholderText } = render(<ProfileScreen />);
    fireEvent.press(await findByText('Editar perfil'));

    fireEvent.changeText(getByPlaceholderText('Ingresa tu nombre'), 'Updated Name');
    fireEvent.press(await findByText('Guardar cambios'));

    await act(async () => {});
    expect(mockUpdateProfileFn).toHaveBeenCalledWith(
      mockProfileToken,
      expect.objectContaining({ name: 'Updated Name' }),
    );
  });

  it('shows logout confirm dialog', async () => {
    const { findByText, queryByText } = render(<ProfileScreen />);
    expect(queryByText('Salir')).toBeNull();
    fireEvent.press(await findByText('Cerrar sesion'));
    expect(await findByText('Salir')).toBeTruthy();
  });

  it('logs out on confirm', async () => {
    const { findByText } = render(<ProfileScreen />);
    fireEvent.press(await findByText('Cerrar sesion'));
    fireEvent.press(await findByText('Salir'));
    await act(async () => {});
    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders version text', async () => {
    const { findByText } = render(<ProfileScreen />);
    expect(await findByText('Plant v1.0.0')).toBeTruthy();
  });
});
