import React from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { Header, SideMenu } from '../components';

const ListScreen = () => {
  const listItems = [
    {
      id: '1',
      title: '27 rue des alonziers',
      description: 'Garage A',
    },
    {
      id: '2',
      title: '14 allée des acacias',
      description: 'Porte Airbnb',
    },
    {
      id: '3',
      title: '12 rue des lilas',
      description: 'Appartement B',
    },
  ];

  const renderItem = ({ item }: { item: typeof listItems[0] }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Mes appareils" />
      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <SideMenu />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  item: {
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});

export default ListScreen;
