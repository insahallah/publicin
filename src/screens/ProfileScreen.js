import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from "react-native-flash-message";

const ProfileScreen = ({ navigation }) => {
  const [username, setUsername] = useState('Guest User');
  const [email, setEmail] = useState('guest@example.com');

  useEffect(() => {
    const loadProfile = async () => {
      const storedName = await AsyncStorage.getItem('userName');
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (storedName) setUsername(storedName);
      if (storedEmail) setEmail(storedEmail);
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    showMessage({
      message: 'You have been logged out successfully.',
      type: 'success',
      icon: 'success',
    });
    navigation.replace('LoginScreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Image
          source={require('../assets/images/profile.png')} // Use your image
          style={styles.avatar}
        />
        <Text style={styles.name}>{username}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3ff',
    alignItems: 'center',
    paddingTop: 50,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    elevation: 4,
    width: '90%',
    marginBottom: 30,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 15,
    backgroundColor: '#ddd',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0047ab',
  },
  email: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#0047ab',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
