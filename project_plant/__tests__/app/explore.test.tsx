import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

jest.mock('../../components/PlantDetailModal', () => () => null);

const mockExplore = jest.fn();
jest.mock('../../lib/api', () => ({
  api: {
    plants: {
      explore: (...args: unknown[]) => mockExplore(...args),
    },
  },
  Plant: {},
}));

import ExploreScreen from '../../app/(tabs)/explore';

const mockPlants = [
  {
    id: 'p1',
    nombreComun: 'Rosa',
    nombreCientifico: 'Rosa gallica',
    imageUri: 'https://example.com/rosa.jpg',
    ownerName: 'Alice',
    ownerPhoto: '',
  },
  {
    id: 'p2',
    nombreComun: 'Girasol',
    nombreCientifico: 'Helianthus annuus',
    imageUri: '',
    ownerName: '',
  },
];

describe('Explore Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header', () => {
    mockExplore.mockResolvedValue({ plants: [], hasMore: false, nextCursor: null });
    const { getByText } = render(<ExploreScreen />);
    expect(getByText('Explorar')).toBeTruthy();
    expect(getByText('Descubre plantas de la comunidad')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    mockExplore.mockImplementation(() => new Promise(() => {}));
    const { getByText } = render(<ExploreScreen />);
    expect(getByText('Cargando plantas...')).toBeTruthy();
  });

  it('shows error state when fetch fails', async () => {
    mockExplore.mockRejectedValue(new Error('Network error'));
    const { getByText, queryByText } = render(<ExploreScreen />);

    await act(async () => {});

    expect(queryByText('Cargando plantas...')).toBeNull();
    expect(getByText('Network error')).toBeTruthy();
    expect(getByText('Intentar de nuevo')).toBeTruthy();
  });

  it('renders plants when fetch succeeds', async () => {
    mockExplore.mockResolvedValue({ plants: mockPlants, hasMore: false, nextCursor: null });
    const { getByText } = render(<ExploreScreen />);

    await act(async () => {});

    expect(getByText('Rosa')).toBeTruthy();
    expect(getByText('Rosa gallica')).toBeTruthy();
    expect(getByText('Girasol')).toBeTruthy();
    expect(getByText('Helianthus annuus')).toBeTruthy();
  });

  it('shows empty state when no plants returned', async () => {
    mockExplore.mockResolvedValue({ plants: [], hasMore: false, nextCursor: null });
    const { getByText } = render(<ExploreScreen />);

    await act(async () => {});

    expect(getByText('No se encontraron plantas públicas')).toBeTruthy();
  });

  it('renders filter chips', async () => {
    mockExplore.mockResolvedValue({ plants: mockPlants, hasMore: false, nextCursor: null });
    const { getByText } = render(<ExploreScreen />);

    await act(async () => {});

    expect(getByText('Pleno sol')).toBeTruthy();
    expect(getByText('Riego moderado')).toBeTruthy();
    expect(getByText('Tóxica')).toBeTruthy();
  });

  it('renders search bar', async () => {
    mockExplore.mockResolvedValue({ plants: mockPlants, hasMore: false, nextCursor: null });
    const { getByPlaceholderText } = render(<ExploreScreen />);

    await act(async () => {});

    expect(getByPlaceholderText('Buscar plantas por nombre...')).toBeTruthy();
  });

  it('retries fetch on retry button press', async () => {
    mockExplore.mockRejectedValueOnce(new Error('Fail'));
    mockExplore.mockResolvedValueOnce({ plants: mockPlants, hasMore: false, nextCursor: null });
    const { getByText, findByText } = render(<ExploreScreen />);

    await act(async () => {});

    fireEvent.press(getByText('Intentar de nuevo'));

    await act(async () => {});

    expect(await findByText('Rosa')).toBeTruthy();
    expect(mockExplore).toHaveBeenCalledTimes(2);
  });

  it('re-fetches when search text changes', async () => {
    mockExplore.mockResolvedValue({ plants: [], hasMore: false, nextCursor: null });
    const { getByPlaceholderText } = render(<ExploreScreen />);

    await act(async () => {});

    mockExplore.mockResolvedValue({
      plants: [mockPlants[0]],
      hasMore: false,
      nextCursor: null,
    });

    fireEvent.changeText(getByPlaceholderText('Buscar plantas por nombre...'), 'Rosa');

    await act(async () => {});

    expect(mockExplore).toHaveBeenLastCalledWith({ limit: 20, search: 'Rosa' });
  });
});
