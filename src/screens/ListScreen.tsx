import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header, SideMenu } from '../components';
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Buffer } from 'buffer';
import { BleManager, LogLevel } from 'react-native-ble-plx';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

type ListedDevice = {
  id: string;
  name: string | null;
  rssi: number | null;
};

const ListScreen = () => {
  const managerRef = useRef<BleManager | null>(null);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Map<string, ListedDevice>>(new Map());
  const [permissionProblem, setPermissionProblem] = useState<string | null>(null);

  // Initialize BLE manager
  useEffect(() => {
    const manager = new BleManager();
    manager.setLogLevel(LogLevel.Warning);
    managerRef.current = manager;
    return () => {
      manager.stopDeviceScan();
      manager.destroy();
      managerRef.current = null;
    };
  }, []);

  const ensurePermissions = useCallback(async (): Promise<boolean> => {
    setPermissionProblem(null);
    try {
      if (Platform.OS === 'ios') {
        const res = await request(PERMISSIONS.IOS.BLUETOOTH);
        return res === RESULTS.GRANTED || res === RESULTS.LIMITED;
      } else {
        const sdk = Platform.Version as number;
        if (sdk >= 31) {
          const needed = [
            PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
            PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          ];
          const statuses = await Promise.all(needed.map(p => check(p)));
          let ok = statuses.every(s => s === RESULTS.GRANTED);
          if (!ok) {
            const req = await Promise.all(needed.map(p => request(p)));
            ok = req.every(s => s === RESULTS.GRANTED);
          }
          return ok;
        } else {
          const loc = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
          return (
            loc === RESULTS.GRANTED ||
            (await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)) === RESULTS.GRANTED
          );
        }
      }
    } catch {
      setPermissionProblem('Permission check failed');
      return false;
    }
  }, []);

  const stopScan = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.stopDeviceScan();
    setScanning(false);
  }, []);

  const onPress = useCallback(
    async (deviceId: string) => {
      if (!managerRef.current) return;
      if (scanning) stopScan();

      const ok = await ensurePermissions();
      if (!ok) return;

      try {
        console.log(`🔍 Connecting to device ${deviceId}...`);
        const device = await managerRef.current.connectToDevice(deviceId);
        const discoveredDevice = await device.discoverAllServicesAndCharacteristics();

        const services = await discoveredDevice.services();
        for (const service of services) {
          const characteristics = await discoveredDevice.characteristicsForService(service.uuid);
          for (const char of characteristics) {
            console.log(
              `Characteristic: ${char.uuid} | write: ${char.isWritableWithResponse} | writeNR: ${char.isWritableWithoutResponse}`
            );
          }
        }

        await discoveredDevice.cancelConnection();
      } catch (err: any) {
        console.error('❌ Failed to connect:', err?.message || err);
      }
    },
    [scanning, stopScan, ensurePermissions]
  );

  const onPress2 = useCallback(
    async (deviceId: string) => {
      if (!managerRef.current) return;

      try {
        const device = await managerRef.current.connectToDevice(deviceId);
        const discoveredDevice = await device.discoverAllServicesAndCharacteristics();

        const text = '6';
        const base64Data = Buffer.from(text, 'utf-8').toString('base64');
        await discoveredDevice.writeCharacteristicWithResponseForService(
          '00000001-0001-4c7f-9350-d84577f707e1',
          '00000001-0002-4c7f-9350-d84577f707e1',
          base64Data
        );

        console.log('✅ Write complete');
        await discoveredDevice.cancelConnection();
      } catch (err: any) {
        console.error('❌ Write failed:', err?.message || err);
      }
    },
    []
  );

  const listItems = [
    { id: '1', title: '27 rue des alonziers', description: 'Garage A' },
    { id: '2', title: '14 allée des acacias', description: 'Porte Airbnb' },
    { id: '3', title: '12 rue des lilas', description: 'Appartement B' },
  ];

  const renderItem = useCallback(
    ({ item }: { item: typeof listItems[0] }) => (
      <View style={styles.item}>
        <TouchableOpacity onPress={() => onPress2("74:4D:BD:A0:49:A5")}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </TouchableOpacity>
      </View>
    ),
    [onPress2]
  );

  return (
    <View style={styles.container}>
      <Header title="Mes appareils" />
      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <SideMenu />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContainer: { padding: 16 },
  item: {
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  description: { fontSize: 14, color: '#666' },
});

export default ListScreen;
