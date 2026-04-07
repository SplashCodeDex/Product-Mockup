import React from 'react';
import { View, Text, StatusBar } from './components/ReactNative';
import { NavigationContainer, createNativeStackNavigator } from './components/Navigation';
import { Info } from 'lucide-react';

import { AppProvider } from './providers/AppProvider';
import { useAuth } from './providers/AuthProvider';
import { useData } from './providers/DataProvider';

import { DashboardScreen } from './screens/DashboardScreen';
import { AssetsScreen } from './screens/AssetsScreen';
import { StudioScreen } from './screens/StudioScreen';
import { ResultScreen } from './screens/ResultScreen';
import { GalleryScreen } from './screens/GalleryScreen';
import { TryOnScreen } from './screens/TryOnScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { StoreScreen } from './screens/StoreScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SplashScreen } from './screens/SplashScreen';

import { Button } from './components/ui/SharedUI';

const Stack = createNativeStackNavigator();

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayError = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) displayError = parsed.error;
      } catch (e) {
        displayError = this.state.error.message || displayError;
      }

      return (
        <View className="flex-1 bg-black items-center justify-center p-8">
          <View className="w-16 h-16 bg-red-900/20 rounded-full items-center justify-center mb-6">
            <Info size={32} className="text-red-500" />
          </View>
          <Text className="text-2xl font-black text-white mb-2 text-center">Something went wrong</Text>
          <Text className="text-zinc-400 text-center mb-8 leading-6">{displayError}</Text>
          <Button onPress={() => window.location.reload()} className="bg-indigo-600 px-8">
            Reload Application
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const AppNavigator = () => {
  const { user, isAuthReady } = useAuth();
  const { isDataReady } = useData();

  if (!isAuthReady || (user && !isDataReady)) {
    return <SplashScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Assets" component={AssetsScreen} />
        <Stack.Screen name="Studio" component={StudioScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Gallery" component={GalleryScreen} />
        <Stack.Screen name="TryOn" component={TryOnScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Store" component={StoreScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <StatusBar barStyle="light-content" />
        <AppNavigator />
      </AppProvider>
    </ErrorBoundary>
  );
}
