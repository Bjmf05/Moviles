import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GardenPlantCard from '../../components/GardenPlantCard';

const mockPlant = {
  id: 'p1',
  userId: 'u1',
  nombreComun: 'Rosa',
  nombreCientifico: 'Rosa gallica',
  descripcion: 'Una hermosa rosa',
  cuidados: {
    riego: 'Cada 3 días',
    luz: 'Pleno sol',
    temperatura: '15-30°C',
  },
  toxicidad: { esToxica: false, detalle: 'No tóxica' },
  imageUri: 'https://example.com/rosa.jpg',
  savedAt: '2026-05-01T00:00:00.000Z',
  isPublic: false,
  ownerName: 'Test User',
  ownerPhoto: '',
  wateringSchedule: {
    frequencyDays: 3,
    nextWateringDate: '2026-05-04',
    lastWateredDate: null,
  },
};

describe('GardenPlantCard', () => {
  it('renders the common name', () => {
    const { getByText } = render(
      <GardenPlantCard
        item={mockPlant}
        index={0}
        onPress={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText('Rosa')).toBeTruthy();
  });

  it('renders the scientific name', () => {
    const { getByText } = render(
      <GardenPlantCard
        item={mockPlant}
        index={0}
        onPress={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText('Rosa gallica')).toBeTruthy();
  });

  it('renders notes when present', () => {
    const plantWithNotes = { ...mockPlant, notes: 'Necesita más sol' };
    const { getByText } = render(
      <GardenPlantCard
        item={plantWithNotes}
        index={0}
        onPress={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText('Necesita más sol')).toBeTruthy();
  });

  it('does not render notes section when notes are absent', () => {
    const { queryByText } = render(
      <GardenPlantCard
        item={mockPlant}
        index={0}
        onPress={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(queryByText('Necesita más sol')).toBeNull();
  });

  it('renders delete button', () => {
    const { getByText } = render(
      <GardenPlantCard
        item={mockPlant}
        index={0}
        onPress={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText('🗑️')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <GardenPlantCard
        item={mockPlant}
        index={0}
        onPress={onPress}
        onDelete={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Rosa'));
    expect(onPress).toHaveBeenCalled();
  });

  it('calls onDelete when delete button pressed', () => {
    const onDelete = jest.fn();
    const { getByText } = render(
      <GardenPlantCard
        item={mockPlant}
        index={0}
        onPress={jest.fn()}
        onDelete={onDelete}
      />,
    );
    fireEvent.press(getByText('🗑️'));
    expect(onDelete).toHaveBeenCalled();
  });
});
