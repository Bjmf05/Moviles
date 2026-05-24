import React from 'react';
import { render } from '@testing-library/react-native';
import PulsingLogo from '../../components/PulsingLogo';

describe('PulsingLogo', () => {
  it('renders the plant emoji', () => {
    const { getByText } = render(<PulsingLogo />);
    expect(getByText('🌿')).toBeTruthy();
  });
});
