import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import BLEDevicesScreen from '../BLEDevicesScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={BottomTabNavigator}
        />
        <Stack.Screen
          name="BLEDevices"
          component={BLEDevicesScreen}
          options={{
            headerShown: true,
            title: 'Bluetooth Debug',
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
