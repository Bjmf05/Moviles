import React from 'react';
import { render } from '@testing-library/react-native';
import InfoField from '../../components/InfoField';

describe('InfoField', () => {
  const defaultProps = { icon: '💧', label: 'Riego', delay: 0 };

  it('renders the icon', () => {
    const { getByText } = render(<InfoField {...defaultProps} />);
    expect(getByText('💧')).toBeTruthy();
  });

  it('renders the label in lowercase as in the source', () => {
    const { getByText } = render(<InfoField {...defaultProps} />);
    expect(getByText('Riego')).toBeTruthy();
  });

  it('renders the value when provided', () => {
    const { getByText } = render(
      <InfoField {...defaultProps} value="Cada 3 días" />,
    );
    expect(getByText('Cada 3 días')).toBeTruthy();
  });

  it('renders fallback em dash when value is undefined', () => {
    const { getByText } = render(<InfoField {...defaultProps} />);
    expect(getByText('—')).toBeTruthy();
  });
});
