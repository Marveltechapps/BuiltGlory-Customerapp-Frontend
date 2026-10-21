import 'react-native';

// Runtime-supported style props missing from the React Native 0.83 TypeScript definitions.
declare module 'react-native' {
  interface ViewStyle {
    experimental_backgroundSize?: string;
    experimental_backgroundRepeat?: string;
  }
}
