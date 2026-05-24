export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
});

export const useFocusEffect = jest.fn();

export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

export const Stack = {
  Screen: ({ children }: any) => null,
};

export const Tabs = ({ children }: any) => null;

export const Redirect = ({ href }: any) => null;

export const Link = ({ children, href }: any) => null;

export const Slot = ({ children }: any) => null;

export const Navigator = ({ children }: any) => null;

export const useSegments = () => [];

export const useRootNavigationState = () => ({ key: 'test' });

export const useLocalSearchParams = () => ({});

export default { useRouter, useFocusEffect, router, Stack, Tabs };
