import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useForm, FormProvider } from 'react-hook-form';
import InputText from '../../components/InputText';

function TestForm({ children, defaultValues = { testField: '' } }: any) {
  const methods = useForm({ defaultValues });
  return React.createElement(FormProvider, { ...methods }, children);
}

describe('InputText', () => {
  it('renders the label', () => {
    const { getByText } = render(
      React.createElement(TestForm, null,
        React.createElement(InputText, {
          control: undefined,
          name: 'testField',
          label: 'Correo',
          placeholder: 'tu@email.com',
        } as any),
      ),
    );
    expect(getByText('Correo')).toBeTruthy();
  });

  it('renders icon with label when provided', () => {
    const { getByText } = render(
      React.createElement(TestForm, null,
        React.createElement(InputText, {
          control: undefined,
          name: 'testField',
          label: 'Usuario',
          icon: '👤',
        } as any),
      ),
    );
    expect(getByText('👤 Usuario')).toBeTruthy();
  });

  it('renders the placeholder', () => {
    const { getByPlaceholderText } = render(
      React.createElement(TestForm, null,
        React.createElement(InputText, {
          control: undefined,
          name: 'testField',
          label: 'Correo',
          placeholder: 'tu@email.com',
        } as any),
      ),
    );
    expect(getByPlaceholderText('tu@email.com')).toBeTruthy();
  });
});
