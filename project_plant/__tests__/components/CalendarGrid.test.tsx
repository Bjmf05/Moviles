import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CalendarGrid, assignPlantColors } from '../../components/CalendarGrid';

describe('assignPlantColors', () => {
  it('returns a color map for each plant', () => {
    const plants = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
    const map = assignPlantColors(plants);
    expect(Object.keys(map)).toEqual(['p1', 'p2', 'p3']);
    expect(map.p1).toBeDefined();
    expect(map.p2).toBeDefined();
  });
});

describe('CalendarGrid', () => {
  const defaultProps = {
    year: 2026,
    month: 4,
    dayWaterings: {},
    onDayPress: jest.fn(),
    plantColorMap: {},
  };

  it('renders weekday headers', () => {
    const { getByText } = render(<CalendarGrid {...defaultProps} />);
    expect(getByText('D')).toBeTruthy();
    expect(getByText('L')).toBeTruthy();
    expect(getByText('S')).toBeTruthy();
  });

  it('renders day numbers', () => {
    const { getByText } = render(<CalendarGrid {...defaultProps} />);
    expect(getByText('1')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
  });

  it('calls onDayPress when a day is pressed', () => {
    const onDayPress = jest.fn();
    const { getByText } = render(
      <CalendarGrid {...defaultProps} onDayPress={onDayPress} />,
    );
    fireEvent.press(getByText('1'));
    expect(onDayPress).toHaveBeenCalledWith(1);
  });

  it('shows check mark when all waterings are completed', () => {
    const dayWaterings = {
      15: [{ plantId: 'p1', nombreComun: 'Rosa', completed: true }],
    };
    const { getByText } = render(
      <CalendarGrid
        {...defaultProps}
        dayWaterings={dayWaterings}
        plantColorMap={{ p1: '#2d6a4f' }}
      />,
    );
    expect(getByText('✓')).toBeTruthy();
  });
});
