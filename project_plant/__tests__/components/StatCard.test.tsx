import React from 'react';
import { render, act } from '@testing-library/react-native';
import StatCard from '../../components/StatCard';

describe('StatCard', () => {
  it('renders the label', () => {
    const { getByText } = render(
      <StatCard value={42} label="Plantas" color="#2d6a4f" delay={0} />,
    );
    expect(getByText('Plantas')).toBeTruthy();
  });

  it('renders the number value after animation', () => {
    const { getByText } = render(
      <StatCard value={42} label="Plantas" color="#2d6a4f" delay={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText('42')).toBeTruthy();
  });

  it('renders zero correctly', () => {
    const { getByText } = render(
      <StatCard value={0} label="Vacío" color="#e63946" delay={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText('0')).toBeTruthy();
  });
});
