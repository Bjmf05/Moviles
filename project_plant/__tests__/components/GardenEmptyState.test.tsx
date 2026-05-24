import React from 'react';
import { render } from '@testing-library/react-native';
import GardenEmptyState from '../../components/GardenEmptyState';

describe('GardenEmptyState', () => {
  it('renders the empty garden title', () => {
    const { getByText } = render(<GardenEmptyState />);
    expect(getByText('Tu jardin esta vacio')).toBeTruthy();
  });

  it('renders the subtitle', () => {
    const { getByText } = render(<GardenEmptyState />);
    expect(
      getByText('Identifica una planta para empezar tu coleccion'),
    ).toBeTruthy();
  });

  it('renders the leaf icon', () => {
    const { getByText } = render(<GardenEmptyState />);
    expect(getByText('🌿')).toBeTruthy();
  });
});
