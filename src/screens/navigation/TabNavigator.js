import React, { useContext,useState,useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '../HomeScreen';
import PostJobScreen from '../PostJobScreen';
import LoginScreen from '../LoginScreen';
import ProfileEditScreen from '../ProfileEditScreen';
import { LanguageContext } from '../../context/AppLanguageContext';

const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={styles.customButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.customButton}>{children}</View>
  </TouchableOpacity>
);

const TabNavigator = () => {
  const { strings } = useContext(LanguageContext);
  const [userId, setUserId] = useState('');


useEffect(() => {
  const loadInitialData = async () => {
    try {
      const Id = await AsyncStorage.getItem('id');
      if (Id !== null) {
        setUserId(Id);
      }
    } catch (error) {
      console.error('Error loading user ID from AsyncStorage:', error);
    }
  };

  loadInitialData(); // कॉल करना न भूलें
}, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Icon
                name="home-outline"
                color={focused ? '#fff' : '#cfd7f3'}
                size={36}
              />
              <Text style={[styles.label, focused && styles.labelFocused]}>
                {strings.homeTab}
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
  name="PostJobTab"
  component={userId ? PostJobScreen : LoginScreen}
  options={{
    tabBarIcon: ({ focused }) => (
      <Icon
        name="plus"
        color="#fff"
        size={28}
      />
    ),
    tabBarButton: (props) => <CustomTabBarButton {...props} />,
  }}
/>
      <Tab.Screen
        name="ProfileTab"
        component={userId ? ProfileEditScreen : LoginScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Icon
                name="account-outline"
                color={focused ? '#fff' : '#cfd7f3'}
                size={36}
              />
              <Text style={[styles.label, focused && styles.labelFocused]}>
                {strings.profileTab}
              </Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#5878dd',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 70,
    paddingHorizontal: 25,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:8
  },
  label: {
    fontSize: 12,
    color: '#cfd7f3',
    marginTop: 2,
  },
  labelFocused: {
    color: '#fff',
    fontWeight: '600',
  },
  customButtonContainer: {
    top: -5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#ff6e40',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
});

export default TabNavigator;
