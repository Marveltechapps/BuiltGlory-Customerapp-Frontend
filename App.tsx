import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppConfigProvider } from './src/context/AppConfigContext';
import { AuthProvider } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { SellFlowProvider } from './src/context/SellFlowContext';
import { ToastProvider } from './src/context/ToastContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <AppConfigProvider>
        <AuthProvider>
          <FavoritesProvider>
            <SellFlowProvider>
              <ToastProvider>
                <RootNavigator />
              </ToastProvider>
            </SellFlowProvider>
          </FavoritesProvider>
        </AuthProvider>
      </AppConfigProvider>
    </SafeAreaProvider>
  );
}
