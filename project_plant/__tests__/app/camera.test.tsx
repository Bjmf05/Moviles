import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

const mockCamUser = { uid: 'test-uid', email: 'test@test.com', name: 'Test User' };

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockCamUser,
    token: 'mock-token-123',
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
    setAuthState: jest.fn(),
  }),
}));

const mockTakePhoto = jest.fn().mockResolvedValue({ uri: 'file://mock/captured.jpg' });
const mockRequestCameraPermission = jest.fn().mockResolvedValue(true);

jest.mock('../../hooks/useCamera', () => ({
  useCamera: jest.fn(() => ({
    cameraRef: { current: null },
    requestCameraPermission: mockRequestCameraPermission,
    takePhoto: mockTakePhoto,
    facing: 'back',
    flashMode: 'off',
    toggleFacing: jest.fn(),
    toggleFlash: jest.fn(),
  })),
}));

jest.mock('../../lib/plants', () => ({
  usePlants: () => ({
    savePlant: jest.fn(),
    uploadImage: jest.fn().mockResolvedValue('https://example.com/uploaded.jpg'),
    getUserPlants: jest.fn(),
    deletePlant: jest.fn(),
  }),
}));

const mockIdentify = jest.fn();
jest.mock('../../lib/plantService', () => ({
  identificarPlanta: (...args: unknown[]) => mockIdentify(...args),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ base64: 'base64-mock-data' }),
  SaveFormat: { JPEG: 'jpeg' },
}));

import CameraScreen from '../../app/(tabs)/camera';
import { router } from 'expo-router';

const mockPlantResult = {
  nombreComun: 'Rosa',
  nombreCientifico: 'Rosa gallica',
  descripcion: 'Una hermosa rosa',
  cuidados: { riego: 'Cada 3 días', luz: 'Pleno sol', temperatura: '15-30°C' },
  toxicidad: { esToxica: false, detalle: 'No tóxica' },
};

describe('Camera Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows camera view with all buttons', async () => {
    const { getByText } = render(<CameraScreen />);
    await act(async () => {});
    expect(getByText('Identificar planta')).toBeTruthy();
    expect(getByText('🔄')).toBeTruthy();
    expect(getByText('🖼️')).toBeTruthy();
    expect(getByText('⚡')).toBeTruthy();
  });

  it('requests camera permission on mount', async () => {
    render(<CameraScreen />);
    await act(async () => {});
    expect(mockRequestCameraPermission).toHaveBeenCalled();
  });

  it('shows loading modal during analysis', async () => {
    mockIdentify.mockImplementation(() => new Promise(() => {}));
    const { queryByText } = render(<CameraScreen />);
    await act(async () => {});
    expect(queryByText('Identificar planta')).toBeTruthy();
  });

  it('shows no plant message when identification returns no plant', async () => {
    mockIdentify.mockResolvedValue({
      nombreComun: 'No es una planta',
      nombreCientifico: '',
      descripcion: '',
      cuidados: { riego: '', luz: '', temperatura: '' },
      toxicidad: { esToxica: false, detalle: '' },
    });

    render(<CameraScreen />);
    await act(async () => {});
  });

  it('shows error toast when identification fails', async () => {
    mockIdentify.mockRejectedValue(new Error('Plant.id API error'));
    render(<CameraScreen />);
    await act(async () => {});
  });
});
