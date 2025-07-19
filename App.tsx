import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Navigation ref
import { navigationRef } from './src/utils/NavigationService';

// Screens
import DrawerNavigator from './src/screens/navigation/DrawerNavigator';
import Splash from './src/screens/SplashScreen';
import ChooseLanguageScreen from './src/screens/ChooseLanguageScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignUpScreen';
import AllCategoriesScreen from './src/screens/AllCategoriesScreen'; // renamed from SearchScreen
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

const Stack = createStackNavigator();

const App = () => {
  return (
    <LanguageProvider>
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
    </LanguageProvider>
  );
};

export default App;
