import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSideMenu } from '../context';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.8;

const SideMenu: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isMenuVisible, closeMenu } = useSideMenu();
  const translateX = React.useRef(new Animated.Value(-MENU_WIDTH)).current;

  React.useEffect(() => {
    if (isMenuVisible) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -MENU_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isMenuVisible, translateX]);

  const handleBluetoothDebug = () => {
    closeMenu();
    // Navigate to BLEDevicesScreen
    navigation.navigate('BLEDevices');
  };

  if (!isMenuVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={closeMenu}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.menu,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
        </View>
        <View style={styles.menuItems}>
          <TouchableOpacity style={styles.menuItem} onPress={handleBluetoothDebug}>
            <Text style={styles.menuItemIcon}>📱</Text>
            <Text style={styles.menuItemText}>Bluetooth Debug</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#007AFF',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333333',
  },
});

export default SideMenu;
