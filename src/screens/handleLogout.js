import React from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dataStorageService from '../services/dataStorage';

/**
 * ✅ Enhanced Logout Handler with Confirmation
 */
const handleLogout = async (showConfirmation = true) => {
  try {
    // ✅ Show confirmation dialog
    if (showConfirmation) {
      return new Promise((resolve) => {
        Alert.alert(
          'Logout',
          'Kya aap sure hain logout karne ke liye? Saari data clear ho jayegi aur next time fresh data load hoga.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false) 
            },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: async () => {
                const success = await performLogout();
                resolve(success);
              }
            }
          ]
        );
      });
    } else {
      // ✅ Direct logout without confirmation
      return await performLogout();
    }
  } catch (error) {
    console.error('❌ Logout error:', error);
    Alert.alert('Error', 'Something went wrong while logging out.');
    return false;
  }
};

/**
 * ✅ Actual logout logic
 */
const performLogout = async () => {
  try {
    console.log('🔄 Starting logout process...');

    // ✅ STEP 1: Clear business data cache (YAHI IMPORTANT HAI)
    await dataStorageService.clearAllData();
    console.log('✅ Business data cache cleared');

    // ✅ STEP 2: Clear user data
    const keysToRemove = [
      'user',
      'id',
      'token', 
      'pin',
      'user_image',
      'user_name',
      'user_mobile',
      'appLanguage',
      'remember_me',
      'login_time',
      'user_settings'
    ];

    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ User data cleared');

    // ✅ STEP 3: Navigate to login
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });

    console.log('✅ Navigation reset to login');
    return true;

  } catch (error) {
    console.error('❌ Logout process failed:', error);
    throw error;
  }
};

export default handleLogout;