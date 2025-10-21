import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppState } from 'react-native';
import FlashMessage from "react-native-flash-message";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Navigation ref
import { navigationRef } from './src/utils/NavigationService';

// Data Storage Service
import dataStorageService from './src/screens/services/dataStorage';

// Screens
import DrawerNavigator from './src/screens/navigation/DrawerNavigator';
import Splash from './src/screens/SplashScreen';
import ChooseLanguageScreen from './src/screens/ChooseLanguageScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignUpScreen';
import AllCategoriesScreen from './src/screens/AllCategoriesScreen'; 
import PostJobScreen from './src/screens/PostJobScreen';
import JobDetailsScreen from './src/screens/JobDetailsScreen';
import JobEdit from './src/screens/JobEdit';
import MainListScreen from './src/screens/users/MainListScreen';
import VoiceSearchListDisply from './src/screens/users/VoiceSearchListDisply';
import PrivacyPolicy from './src/screens/users/PrivacyPolicy';
import TermsOfService from './src/screens/users/TermsOfService';
import ViewJobScreen from './src/screens/ViewJobScreen';
import WriteReviewScreen from './src/screens/users/WriteReviewScreen';

// Context
import { LanguageProvider } from './src/context/AppLanguageContext';

// 👇 Gesture Handler
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Stack = createStackNavigator();

const App = () => {
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(AppState.currentState);

  /**
   * ✅ App State Change Handler - Close/Reopen Detect Karega
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('📱 App State:', appState.current, '→', nextAppState);

      // ✅ App BACKGROUND mein gaya (close/minimize)
      if (appState.current === 'active' && 
          (nextAppState === 'background' || nextAppState === 'inactive')) {
        console.log('🔴 App closed or backgrounded');
        handleAppClose();
      }

      // ✅ App FOREGROUND mein aaya (reopen)
      if ((appState.current === 'background' || appState.current === 'inactive') && 
          nextAppState === 'active') {
        console.log('🟢 App reopened');
        handleAppReopen();
      }

      appState.current = nextAppState;
      setAppStateVisible(nextAppState);
    };

    // ✅ AppState listener add karo (new way)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // ✅ Initialize app data on startup
    initializeAppData();

    // ✅ Cleanup on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * ✅ App Close/Background Hone Par
   */
  const handleAppClose = async () => {
    try {
      console.log('📴 App closing - saving state...');
      
      // Save close time
      await AsyncStorage.setItem('app_last_close_time', Date.now().toString());
      
      console.log('✅ App close time saved');
    } catch (error) {
      console.error('❌ Error saving app close state:', error);
    }
  };

  /**
   * ✅ App Reopen Hone Par
   */
  const handleAppReopen = async () => {
    try {
      console.log('📱 App reopened - checking data freshness...');
      
      // Check kab last close hua tha
      const lastCloseTime = await AsyncStorage.getItem('app_last_close_time');
      const currentTime = Date.now();
      
      if (lastCloseTime) {
        const closeTime = parseInt(lastCloseTime);
        const timeDiff = currentTime - closeTime;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        console.log(`⏰ App was closed for: ${hoursDiff.toFixed(2)} hours`);
        
        // Agar 1 hour se zyada ho gaya toh data refresh karo
        if (hoursDiff > 1) {
          console.log('🔄 App was closed for long, refreshing data...');
          await refreshAppData();
        } else {
          console.log('📦 App was briefly closed, using cached data');
        }
      }
    } catch (error) {
      console.error('❌ Error handling app reopen:', error);
    }
  };

  /**
   * ✅ App Startup Data Initialization
   */
  const initializeAppData = async () => {
    try {
      console.log('🚀 App starting - initializing data...');
      
      // Smart data loading - cache check karega automatically
      await dataStorageService.initializeAppData();
      
      console.log('✅ App data initialization complete');
    } catch (error) {
      console.error('❌ App data initialization failed:', error);
    }
  };

  /**
   * ✅ Data Refresh Function
   */
  const refreshAppData = async () => {
    try {
      console.log('🔄 Refreshing app data...');
      await dataStorageService.getData(true); // Force refresh
      console.log('✅ App data refreshed successfully');
    } catch (error) {
      console.error('❌ Data refresh failed:', error);
    }
  };

  return (
    <LanguageProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            initialRouteName="ChooseLanguage"
            screenOptions={{
              headerShown: false,
              gestureEnabled: false
            }}
          >
            {/* Auth Screens */}
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="ChooseLanguage" component={ChooseLanguageScreen} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="SignupScreen" component={SignupScreen} />

            {/* Main App Screens */}
            <Stack.Screen name="MainApp" component={DrawerNavigator} />

            {/* Job Related Screens */}
            <Stack.Screen name="All Categories" component={AllCategoriesScreen} />
            <Stack.Screen name="PostJobScreen" component={PostJobScreen} />
            <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
            <Stack.Screen name="JobEdit" component={JobEdit} />
            <Stack.Screen name="ViewJobScreen" component={ViewJobScreen} />

            {/* User Screens */}
            <Stack.Screen name="MainListScreen" component={MainListScreen} />
            <Stack.Screen name="VoiceSearchListDisply" component={VoiceSearchListDisply} />
            <Stack.Screen name="WriteReviewScreen" component={WriteReviewScreen} />

            {/* Legal Screens */}
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
            <Stack.Screen name="TermsOfService" component={TermsOfService} />
          </Stack.Navigator>
        </NavigationContainer>

        {/* 👇 Add FlashMessage at the root */}
        <FlashMessage position="top" />
      </GestureHandlerRootView>
    </LanguageProvider>
  );
};

export default App;