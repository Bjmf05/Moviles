import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

jest.mock('@/components/FloatingLeavesLayer', () => () => null);
jest.mock('@/components/PlantEditModal', () => () => null);
jest.mock('../../lib/localCache', () => ({
  resolveLocalImageMap: jest.fn().mockResolvedValue({}),
}));

const mockGetUserPlants = jest.fn();
const mockDeletePlant = jest.fn();
const mockUpdatePlantAPI = jest.fn();

jest.mock('../../lib/api', () => ({
  api: {
    auth: { login: jest.fn() },
    plants: {
      update: (...args: unknown[]) => mockUpdatePlantAPI(...args),
    },
  },
}));

jest.mock('../../lib/plants', () => ({
  usePlants: () => ({
    getUserPlants: mockGetUserPlants,
    deletePlant: mockDeletePlant,
    savePlant: jest.fn(),
    uploadImage: jest.fn(),
  }),
  SavedPlant: {},
}));

const mockGardenUser = { uid: 'test-uid', email: 'test@test.com', name: 'Test User' };
const mockGardenToken = 'mock-token-123';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockGardenUser,
    token: mockGardenToken,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
    setAuthState: jest.fn(),
  }),
}));

import GardenScreen from '../../app/(tabs)/garden';
import { router } from 'expo-router';

const mockPlant = {
  id: 'p1',
  userId: 'u1',
  nombreComun: 'Rosa',
  nombreCientifico: 'Rosa gallica',
  descripcion: 'Una hermosa rosa',
  cuidados: { riego: 'Cada 3 días', luz: 'Pleno sol', temperatura: '15-30°C' },
  toxicidad: { esToxica: false, detalle: 'No tóxica' },
  imageUri: 'https://example.com/rosa.jpg',
  savedAt: '2026-05-01T00:00:00.000Z',
  isPublic: false,
  ownerName: 'Test User',
  ownerPhoto: '',
  wateringSchedule: { frequencyDays: 3, nextWateringDate: '2026-05-04', lastWateredDate: null },
  notes: '',
};

describe('Garden Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserPlants.mockResolvedValue({ plants: [], fromCache: false });
  });

  it('renders header', () => {
    const { getByText } = render(<GardenScreen />);
    expect(getByText('Mi Jardin')).toBeTruthy();
    expect(getByText('Tu coleccion de plantas')).toBeTruthy();
  });

  it('shows empty state when no plants', async () => {
    const { findByText } = render(<GardenScreen />);
    expect(await findByText('Tu jardin esta vacio')).toBeTruthy();
  });

  it('renders plant list when plants exist', async () => {
    mockGetUserPlants.mockResolvedValue({ plants: [mockPlant], fromCache: false });
    const { findByText } = render(<GardenScreen />);
    expect(await findByText('Rosa')).toBeTruthy();
    expect(await findByText('Rosa gallica')).toBeTruthy();
  });

  it('renders stat cards', async () => {
    mockGetUserPlants.mockResolvedValue({ plants: [mockPlant], fromCache: false });
    const { findByText } = render(<GardenScreen />);
    expect(await findByText('Plantas')).toBeTruthy();
    expect(await findByText('No toxicas')).toBeTruthy();
    expect(await findByText('Toxicas')).toBeTruthy();
  });

  it('shows offline banner when data is from cache', async () => {
    mockGetUserPlants.mockResolvedValue({ plants: [mockPlant], fromCache: true });
    const { findByText } = render(<GardenScreen />);
    expect(await findByText('Modo offline — mostrando datos guardados')).toBeTruthy();
  });

  it('navigates to calendar on button press', async () => {
    const { findByText } = render(<GardenScreen />);
    fireEvent.press(await findByText('📅'));
    expect(router.push).toHaveBeenCalledWith('/calendar');
  });

  it('shows error toast when plant loading fails', async () => {
    mockGetUserPlants.mockRejectedValue(new Error('Network error'));
    const { findByText } = render(<GardenScreen />);
    expect(
      await findByText('Sin conexión. Revisa tu internet e intenta de nuevo.'),
    ).toBeTruthy();
  });
});
