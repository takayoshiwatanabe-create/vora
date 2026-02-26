import "@testing-library/react-native/extend-expect";

// Mock `console.error` to prevent it from failing tests when expected errors occur
// For example, when testing error boundaries or error states.
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  // Suppress specific warnings or errors that are known/expected in tests
  if (
    typeof message === 'string' &&
    (message.includes('Warning: `useNativeDriver` was not specified') ||
     message.includes('Warning: An update to %s inside a test was not wrapped in act') ||
     message.includes('Failed to start recording') ||
     message.includes('Failed to stop recording') ||
     message.includes('Edge Function error') ||
     message.includes('AI service unavailable') ||
     message.includes('AI did not return a card suggestion') ||
     message.includes('You must be logged in') ||
     message.includes('Microphone permission is required') ||
     message.includes('Updates.reloadAsync is not available in development'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock expo-router's useRouter and Link for any component that uses them
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  Link: ({ children, href, asChild, ...props }) => {
    // If asChild is true, it means the child component itself is the clickable element.
    // We just pass through the children and props.
    // Otherwise, we wrap children in a mock TouchableOpacity for testing.
    if (asChild) {
      return <mock-link-as-child href={href} {...props}>{children}</mock-link-as-child>;
    }
    return (
      <mock-link href={href} testID={typeof href === 'string' ? href : 'link'} {...props}>
        {children}
      </mock-link>
    );
  },
  Stack: {
    Screen: ({ options }) => <mock-stack-screen options={options} />,
  },
  SplashScreen: {
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'http://mock-supabase-url.com',
      supabaseAnonKey: 'mock-supabase-anon-key',
    },
  },
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Mock expo-font
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]), // Always return fonts loaded
}));

// Mock expo-updates
jest.mock('expo-updates', () => ({
  isEmbedded: true, // Simulate embedded updates for testing reloadAsync
  reloadAsync: jest.fn(() => Promise.resolve()),
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(),
    useMutation: jest.fn(),
    QueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
    })),
    QueryClientProvider: ({ children }) => children,
  };
});

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: jest.fn(() => ({ isConnected: true })),
}));
