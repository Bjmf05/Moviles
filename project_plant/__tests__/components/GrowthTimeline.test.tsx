import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../lib/dateUtils', () => ({
  formatFullDate: () => '24 de mayo de 2026',
}));

import GrowthTimeline from '../../components/GrowthTimeline';

const mockEntries = [
  {
    id: 'e1',
    plantId: 'p1',
    userId: 'u1',
    imageUrl: 'https://example.com/photo1.jpg',
    caption: 'Primera foto',
    capturedAt: '2026-05-01',
    createdAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'e2',
    plantId: 'p1',
    userId: 'u1',
    imageUrl: 'https://example.com/photo2.jpg',
    caption: 'Segunda foto',
    capturedAt: '2026-05-15',
    createdAt: '2026-05-15T00:00:00.000Z',
  },
];

describe('GrowthTimeline', () => {
  it('shows title when loading', () => {
    const { getByText } = render(
      <GrowthTimeline entries={[]} loading onAddPhoto={jest.fn()} />,
    );
    expect(getByText('📷 Timeline de crecimiento')).toBeTruthy();
  });

  it('renders empty state when no entries', () => {
    const { getByText } = render(
      <GrowthTimeline entries={[]} loading={false} onAddPhoto={jest.fn()} />,
    );
    expect(
      getByText('Aún no hay fotos de progreso. ¡Agrega la primera!'),
    ).toBeTruthy();
  });

  it('renders timeline entries when provided', () => {
    const { getAllByText } = render(
      <GrowthTimeline
        entries={mockEntries}
        loading={false}
        onAddPhoto={jest.fn()}
      />,
    );
    expect(getAllByText('📷 Timeline de crecimiento')).toHaveLength(1);
    expect(getAllByText('24 de mayo de 2026')).toHaveLength(2);
  });

  it('renders captions for entries', () => {
    const { getByText } = render(
      <GrowthTimeline
        entries={mockEntries}
        loading={false}
        onAddPhoto={jest.fn()}
      />,
    );
    expect(getByText('Primera foto')).toBeTruthy();
    expect(getByText('Segunda foto')).toBeTruthy();
  });

  it('renders add photo button', () => {
    const { getByText } = render(
      <GrowthTimeline entries={[]} loading={false} onAddPhoto={jest.fn()} />,
    );
    expect(getByText('+')).toBeTruthy();
  });

  it('calls onAddPhoto when add button pressed', () => {
    const onAddPhoto = jest.fn();
    const { getByText } = render(
      <GrowthTimeline entries={[]} loading={false} onAddPhoto={onAddPhoto} />,
    );
    fireEvent.press(getByText('+'));
    expect(onAddPhoto).toHaveBeenCalled();
  });
});
