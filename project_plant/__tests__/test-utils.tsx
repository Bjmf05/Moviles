export interface MockAuthUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  birthdate?: string;
  country?: string;
}

export interface MockAuthContextValue {
  user: MockAuthUser | null;
  token: string | null;
  loading: boolean;
  login: jest.Mock;
  register: jest.Mock;
  logout: jest.Mock;
  updateProfile: jest.Mock;
  setAuthState: jest.Mock;
}

export function createMockAuthContextValue(
  overrides?: Partial<MockAuthContextValue>,
): MockAuthContextValue {
  return {
    user: { uid: 'test-uid', email: 'test@test.com', name: 'Test User' },
    token: 'mock-token-123',
    loading: false,
    login: jest.fn<Promise<void>, [string, string]>(),
    register: jest.fn<Promise<void>, [string, string, string, string?, string?]>(),
    logout: jest.fn<Promise<void>, []>(),
    updateProfile: jest.fn<Promise<void>, [Partial<MockAuthUser>]>(),
    setAuthState: jest.fn<Promise<void>, [MockAuthUser, string]>(),
    ...overrides,
  };
}
