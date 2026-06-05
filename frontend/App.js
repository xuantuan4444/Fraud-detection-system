// ====================================================================
// APP.JS - Main entry point with navigation (React Navigation v6)
// ====================================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TransactionProvider } from './src/context/TransactionContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import TransferScreen from './src/screens/TransferScreen';
import PipelineScreen from './src/screens/PipelineScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { COLORS } from './src/constants/theme';
import CustomTabBar from './src/components/CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={HomeTabs} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="Pipeline" component={PipelineScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <MainStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <TransactionProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </TransactionProvider>
    </AuthProvider>
  );
}
