import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native'; // ✅ useRoute added
import Icon from 'react-native-vector-icons/Ionicons';

const ViewJobScreen = () => {
  const navigation = useNavigation();
  const route = useRoute(); // ✅ Get route object
  const { data } = route.params || {}; // ✅ Get passed data

  return (
    <View style={{ flex: 1 }}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop:25,marginLeft:15}}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
      </View>

      {/* Content */}
      <View style={styles.container}>
        <Text style={styles.text}>Business Name: {data?.businessName}</Text>
        <Text style={styles.text}>Description: {data?.description}</Text>
        <Text style={styles.text}>Location: {data?.village}, {data?.block}, {data?.district}</Text>
        <Text style={styles.text}>Posted By: {data?.user?.name}</Text>
      </View>
    </View>
  );
};

export default ViewJobScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 6,
  },
});
