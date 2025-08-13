import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ListRenderItemInfo,
    Platform,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Buffer } from "buffer";
import { BleManager, LogLevel } from 'react-native-ble-plx';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

type ListedDevice = {
    id: string;
    name: string | null;
    rssi: number | null;
};

const BLEDevicesScreen: React.FC = () => {
    const managerRef = useRef<BleManager | null>(null);
    const [scanning, setScanning] = useState(false);
    const [devices, setDevices] = useState<Map<string, ListedDevice>>(new Map());
    const [permissionProblem, setPermissionProblem] = useState<string | null>(null);
    const [helderTestVariable,setHelderTestVariable] = useState(0);

    // Initialize BLE manager once
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

    const sortedDevices = useMemo(() => {
        console.log('Sorting devices:', Array.from(devices.values()));
        return Array.from(devices.values()).sort((a, b) => {
            const ra = a.rssi ?? -9999;
            const rb = b.rssi ?? -9999;
            return rb - ra;
        });
    }, [devices]);

    const upsertDevice = useCallback((d: ListedDevice) => {
        setDevices(prev => {
            // Merge without re-creating if no change
            const existing = prev.get(d.id);
            if (
                existing &&
                existing.name === d.name &&
                existing.rssi === d.rssi
            ) {
                return prev;
            }
            const next = new Map(prev);
            next.set(d.id, d);
            return next;
        });
    }, []);

    const ensurePermissions = useCallback(async (): Promise<boolean> => {
        setPermissionProblem(null);

        try {
            if (Platform.OS === 'ios') {
                // iOS 13+ handles Bluetooth permission via NSBluetooth* usage descriptions.
                // react-native-permissions exposes a bluetooth permission on iOS.
                const res = await request(PERMISSIONS.IOS.BLUETOOTH);
                const ok = res === RESULTS.GRANTED || res === RESULTS.LIMITED;
                if (!ok) setPermissionProblem('Bluetooth permission is required on iOS.');
                return ok;
            } else {
                // ANDROID
                const sdk = Platform.Version as number;

                if (sdk >= 31) {
                    const needed = [
                        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                    ];
                    const statuses = await Promise.all(needed.map(p => check(p)));
                    const needRequest = statuses.some(s => s !== RESULTS.GRANTED);
                    let ok = statuses.every(s => s === RESULTS.GRANTED);
                    if (!ok && needRequest) {
                        const req = await Promise.all(needed.map(p => request(p)));
                        ok = req.every(s => s === RESULTS.GRANTED);
                    }
                    if (!ok) setPermissionProblem('Bluetooth permissions are required on Android 12+.');
                    // Fine location may still be required by OEMs for scan visibility.
                    const loc = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
                    if (loc !== RESULTS.GRANTED) {
                        const locReq = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
                        if (locReq !== RESULTS.GRANTED) {
                            setPermissionProblem('Location permission is needed for BLE scanning.');
                            return false;
                        }
                    }
                    return ok;
                } else {
                    // Android 6–11 require location for BLE scans
                    const loc = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
                    const granted =
                        loc === RESULTS.GRANTED ||
                        (await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)) === RESULTS.GRANTED;
                    if (!granted) setPermissionProblem('Location permission is needed for BLE scanning.');
                    return granted;
                }
            }
        } catch (e) {
            setPermissionProblem('Permission check failed. Please verify app permissions in Settings.');
            return false;
        }
    }, []);

    const startScan = useCallback(async () => {
        if (!managerRef.current) return;

        const ok = await ensurePermissions();
        if (!ok) return;

        // Reset list on each scan start
        setDevices(new Map());
        setScanning(true);

        // Optional: filter with { allowDuplicates: false } and/or UUID filters
        managerRef.current.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
            if (error) {
                setScanning(false);
                setPermissionProblem(error.message);
                return;
            }
            if (device) {
                upsertDevice({
                    id: device.id,
                    name: device.name ?? device.localName ?? null,
                    rssi: device.rssi ?? null,
                });
            }
        });

        // Auto-stop after 12s
        setTimeout(() => {
            stopScan();
        }, 12000);
    }, [ensurePermissions, upsertDevice]);

    const stopScan = useCallback(() => {
        if (!managerRef.current) return;
        managerRef.current.stopDeviceScan();
        setScanning(false);
    }, []);

    // Stop scan on unmount just in case
    useEffect(() => {
        return () => stopScan();
    }, [stopScan]);

    const onRefresh = useCallback(() => {
        // Pull-to-refresh triggers a quick re-scan
        if (scanning) return;
        startScan();
    }, [scanning, startScan]);

  const onPress = useCallback(
    async (deviceId: string) => {
      if (!managerRef.current) return;

        if (scanning) stopScan(); // stop scanning before connect

        const ok = await ensurePermissions();
        if (!ok) {
          console.warn("Permissions not granted");
          return;
        }

        console.log(`🔍 Connecting to device ${deviceId}...`);
        const device = await managerRef.current.connectToDevice(deviceId);
        const discoveredDevice = await device.discoverAllServicesAndCharacteristics();

        const services = await discoveredDevice.services();
        for (const service of services) {
          console.log(`📡 Service: ${service.uuid}`);

          const characteristics = await discoveredDevice.characteristicsForService(service.uuid);
          for (const char of characteristics) {



      console.log(
     `🔹 Characteristic: ${char.uuid} | read: ${char.isReadable} | write: ${char.isWritableWithResponse} | writeNR: ${char.isWritableWithoutResponse} | notify: ${char.isNotifiable} | indicate: ${char.isIndicatable}`
     );
          }
        }

        console.log("✅ UUID discovery complete. Check your Metro logs.");
        await discoveredDevice.cancelConnection();

    },
    [scanning, stopScan, ensurePermissions]
  );

  const onPress2 = useCallback(
      async (deviceId: string) => {
          const sleep = ms => new Promise(r => setTimeout(r, ms));
                  console.log(`🔍 Connecting to device ${deviceId}...`);
                        try {
                  //const device = await managerRef.current.connectToDevice(deviceId);

//await sleep(5000)
const text = "dfgsdfgafgasdf";
const base64Data = Buffer.from(text, 'utf-8').toString('base64');
console.log("Write: " + base64Data);
console.log("Write: " + text);
await managerRef.current.writeCharacteristicWithoutResponseForDevice("50:65:83:77:5B:9B","00001800-0000-1000-8000-00805f9b34fb", "00002a02-0000-1000-8000-00805f9b34fb", base64Data).then((res) => {
                                                                                                                                                      console.log("Write: " + text);
                                                                                                                                                      console.log("res",res)
                                                                                                                                                    })
                                                                                                                                                    .catch((error) => {
                                                                                                                                                      console.log(error.reason);
                                                                                                                                                    });
//await sleep(1000)
//await device.writeCharacteristicWithoutResponseForService("00001800-0000-1000-8000-00805f9b34fb", "00002a03-0000-1000-8000-00805f9b34fb", base64Data).then((res) => {
//  console.log("Write: " + text);
//  console.log("res",res)
//})
//.catch((error) => {
//  console.log(error.reason);
//});
//await sleep(1000)
//await device.writeCharacteristicWithoutResponseForService("0000dfb0-0000-1000-8000-00805f9b34fb", "0000dfb1-0000-1000-8000-00805f9b34fb", base64Data) .then((res) => {
//  console.log("Write: " + text);
//      console.log("res",res)
//})
//.catch((error) => {
//  console.log(JSON.stringify(error));
//});
//await sleep(1000)
//await device.writeCharacteristicWithoutResponseForService("0000dfb0-0000-1000-8000-00805f9b34fb", "0000dfb2-0000-1000-8000-00805f9b34fb", base64Data) .then((res) => {
//                                                                                                                                                                                                                                                                                                                                                                                                                                                      console.log("Write: " + text);
//                                                                                                                                                                                                                                                                                                                                                                                                                                                      console.log("res",res)
//                                                                                                                                                                                                                                                                                                                                                                                                                                                    })
//                                                                                                                                                                                                                                                                                                                                                                                                                                                    .catch((error) => {
//                                                                                                                                                                                                                                                                                                                                                                                                                                                      console.log(error);
//                                                                                                                                                                                                                                                                                                                                                                                                                                                    });
//await device.writeWithResponse(base64Data);

 //await device.cancelConnection();
 console.log(`disconnected`);
            } catch (err: any) {
              console.error("❌ Failed to discover UUIDs:", err?.message || err);
               await discoveredDevice.cancelConnection();
            }
        },
      [scanning, stopScan, ensurePermissions]
    );

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<ListedDevice>) => (
            <View style={styles.row}>
                <View style={styles.rowMain}>
                  <TouchableOpacity style={styles.button} onPress={() => onPress(item.id)}>
                    <Text style={styles.name} numberOfLines={1}>
                        {item.name ?? 'Unknown device'}
                    </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => onPress2(item.id)}>
                    <Text style={styles.id} numberOfLines={1}>
                        {item.id}{helderTestVariable}
                    </Text>
</TouchableOpacity>

                </View>
                <View style={styles.rowAside}>
                    <Text style={styles.rssi}>{item.rssi ?? '—'} dBm</Text>
                </View>
            </View>
        ),
        [helderTestVariable,onPress,onPress2]
    );

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.title}>Scanned BLE Devices</Text>
                <TouchableOpacity
                    onPress={scanning ? stopScan : startScan}
                    style={[styles.cta, scanning && styles.ctaStop]}
                    disabled={!managerRef.current}
                >
                    {scanning ? <Text style={styles.ctaText}>Stop</Text> : <Text style={styles.ctaText}>Scan</Text>}
                </TouchableOpacity>
            </View>

            {permissionProblem ? (
                <TouchableOpacity style={styles.notice} onPress={() => openSettings()}>
                    <Text style={styles.noticeText}>
                        {permissionProblem} Tap to open Settings.
                    </Text>
                </TouchableOpacity>
            ) : null}

            <View style={styles.separator} />

            {scanning && (
                <View style={styles.scanning}>
                    <ActivityIndicator />
                    <Text style={styles.scanningText}>Scanning…</Text>
                </View>
            )}

            <FlatList
                data={sortedDevices}
                keyExtractor={(d) => d.id}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={onRefresh} />
                }
                contentContainerStyle={sortedDevices.length === 0 ? styles.emptyContainer : undefined}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {scanning ? 'Searching for devices…' : 'No devices yet. Tap “Scan”.'}
                    </Text>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    header: {
        paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'space-between',
    },
    title: { fontSize: 20, fontWeight: '700' },
    cta: {
        paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#111',
        borderRadius: 12,
    },
    ctaStop: { backgroundColor: '#b00020' },
    ctaText: { color: '#fff', fontWeight: '600' },
    notice: {
        marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12,
        backgroundColor: '#fff4e5', borderWidth: 1, borderColor: '#ffcc80',
    },
    noticeText: { color: '#8a5a00' },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#eee' },
    scanning: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
    scanningText: { marginLeft: 8 },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee',
    },
    rowMain: { flex: 1, paddingRight: 12 },
    name: { fontSize: 16, fontWeight: '600' },
    id: { fontSize: 12, color: '#666', marginTop: 2 },
    rowAside: { alignItems: 'flex-end' },
    rssi: { fontVariant: ['tabular-nums'], color: '#333' },
    emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#666' },
});

export default BLEDevicesScreen;