import React, { useContext } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // correct import
import HomeScreen from '../HomeScreen';
import PostJobScreen from '../PostJobScreen';
import JobDetailsScreen from '../JobDetailsScreen';

import CustomDrawer from '../components/CustomDrawer';
import { LanguageContext } from '../../context/AppLanguageContext';
import TabNavigator from './TabNavigator';
import PrivacyPolicy from '../users/PrivacyPolicy';


const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const { strings, language } = useContext(LanguageContext);

  return (
    <Drawer.Navigator
      key={language}
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: '#0066cc',
          elevation: 5,
          shadowOpacity: 0.3,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerTitleAlign: 'center',
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        ),
      })}
    >
   <Drawer.Screen
  name="Home"
  component={TabNavigator}
  options={{
    title: strings.homeTitle,
    headerShown: false, // This hides the header
    drawerIcon: ({ color, size }) => (
      <Icon name="home-outline" color={color} size={size} />
    ),
  }}
/><Drawer.Screen 
  name="PostJob"
  component={JobDetailsScreen}
  options={{
    title: strings.postJobTitle,
    headerShown: true, // Show header
    headerStyle: {
      backgroundColor: '#5878dd', // Change to your desired color
    },
    headerTintColor: '#fff', // Optional: color for back button and title
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    drawerIcon: ({ color, size }) => (
      <Icon name="briefcase-outline" color={color} size={size} />
    ),
  }}
/>


<Drawer.Screen
  name="PostJobScreen"
  component={PostJobScreen}
  options={{
    drawerItemStyle: { height: 0 },
    drawerLabel: () => null,
    title: null, // Optional: remove title if used elsewhere
     headerShown: false,
  }}
/>
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;PostJobScreen
