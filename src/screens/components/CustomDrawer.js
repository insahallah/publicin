import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { LanguageContext } from '../../context/AppLanguageContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { BASE_URL } from '../BaseUrl';

const CustomDrawer = (props) => {
  const { language, changeLanguage } = useContext(LanguageContext);
  const [userName, setUserName] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [userImage, setUserImage] = useState(null);
  const navigation = useNavigation();

  const rotation = useState(new Animated.Value(0))[0];
  const rotateInterpolation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '0deg'],
  });

  useEffect(() => {
    const fetchData = async () => {
      const lang = await AsyncStorage.getItem('appLanguage');
      if (lang) changeLanguage(lang);
      await loadUserData();
      animateProfile();
    };
    fetchData();
  }, []);

  const animateProfile = () => {
    rotation.setValue(0);
    Animated.timing(rotation, {
      toValue: 1,
      duration: 800,
      easing: Easing.elastic(1.2),
      useNativeDriver: true,
    }).start();
  };

  const loadUserData = async () => {
    try {
      const id = await AsyncStorage.getItem('id');
      if (id) {
        const response = await fetch(`${BASE_URL}api/users/fetch_profile.php?user_id=${id}`);
        const json = await response.json();
        if (json.success && json.data?.profile_image_url) {
          setUserImage(json.data.profile_image_url);
        }
      }

      const name = await AsyncStorage.getItem('user_name');
      const mobile = await AsyncStorage.getItem('user_mobile');
      if (name) setUserName(name);
      if (mobile) setUserMobile(mobile);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'token', 'user_name', 'user_mobile', 'user_image', 'id']);
      navigation.replace('LoginScreen');
    } catch (error) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  const toggleDrawer = () => {
    props.navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const handleWhatsAppShare = () => {
    const message = language === 'hi'
      ? 'इस शानदार ऐप को देखें: https://yourapp.link'
      : 'Check out this awesome app: https://yourapp.link';
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open WhatsApp'));
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton} activeOpacity={0.7}>
            <Icon name="menu" size={28} color="#333" />
          </TouchableOpacity>

          <Animated.View style={[styles.avatarWrapper, { transform: [{ rotate: rotateInterpolation }] }]}>
            <TouchableOpacity onPress={() => navigation.navigate(userMobile ? 'ProfileEditScreen' : 'LoginScreen')} activeOpacity={0.8}>
              <View style={styles.avatarContainerSmall}>
                <Image
                  source={userImage ? { uri: userImage } : require('../../assets/images/profile.png')}
                  style={styles.avatarSmall}
                />
                <View style={styles.editIconSmall}>
                  <Icon name="pencil" size={14} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.name}>
            {language === 'en' ? 'Welcome, ' : 'स्वागत है, '}
            <Text style={styles.userName}>{userName || 'Guest'}</Text>
          </Text>

          {userMobile ? (
            <View style={styles.phoneContainer}>
              <Icon name="phone" size={16} color="#555" />
              <Text style={styles.phoneText}>{userMobile}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.drawerItems}>
          <DrawerItemList
            {...props}
            labelStyle={styles.drawerLabel}
            activeTintColor="#4364f7"
            inactiveTintColor="#555"
            activeBackgroundColor="rgba(67, 100, 247, 0.1)"
          />

          <TouchableOpacity
            style={styles.listBusinessItem}
            onPress={() => {
              props.navigation.closeDrawer();
              navigation.navigate(userMobile ? 'PostJobScreen' : 'LoginScreen');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.listBusinessContent}>
              <Icon name="briefcase-plus" size={24} color="#555" />
              <Text style={styles.listBusinessText}>
                {language === 'en' ? 'List Your Business' : 'अपना व्यवसाय जोड़ें'}
              </Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.languageWrapper}>
          <View style={styles.languageCard}>
            <View style={styles.languageHeader}>
              <View style={styles.languageIcon}>
                <Icon name="earth" size={20} color="#fff" />
              </View>
              <Text style={styles.languageLabel}>
                {language === 'en' ? 'Change Language' : 'भाषा बदलें'}
              </Text>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={language}
                onValueChange={(value) => {
                  changeLanguage(value);
                  props.navigation.closeDrawer();
                }}
                style={styles.picker}
                dropdownIconColor="#4364f7"
                mode="dropdown"
              >
                <Picker.Item label="English" value="en" />
                <Picker.Item label="हिंदी" value="hi" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.whatsappButton]} onPress={handleWhatsAppShare} activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Icon name="whatsapp" size={24} color="#25D366" />
              <Text style={[styles.footerText, { color: '#25D366' }]}> {language === 'en' ? 'Share via WhatsApp' : 'व्हाट्सएप से शेयर करें'} </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.footerButton, styles.logoutButton]} onPress={userName ? handleLogout : () => navigation.replace('LoginScreen')} activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Icon name={userName ? 'logout' : 'login'} size={24} color="#e74c3c" />
              <Text style={[styles.footerText, { color: '#e74c3c' }]}>
                {userName ? (language === 'en' ? 'Logout' : 'लॉग आउट') : (language === 'en' ? 'Login' : 'लॉग इन')}
              </Text>
            </View>
          </TouchableOpacity>

<TouchableOpacity
  style={[styles.footerButton, styles.logoutButton]}
  onPress={() => navigation.navigate('PrivacyPolicy')}
  activeOpacity={0.7}
>
  <View style={styles.buttonContent}>
    <Text>Privacy Policy</Text>
  </View>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.footerButton, styles.logoutButton]}
  onPress={() => navigation.navigate('TermsOfService')}
  activeOpacity={0.7}
>
  <View style={styles.buttonContent}>
    <Text>Terms of Use</Text>
  </View>
</TouchableOpacity>

        </View>
      </DrawerContentScrollView>

      <Text style={styles.versionText}>v2.4.1</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, paddingTop: 50, alignItems: 'center', backgroundColor: '#f8f9ff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  menuButton: { position: 'absolute', top: 20, left: 15, zIndex: 10 },
  avatarContainerSmall: { position: 'relative', borderRadius: 40, padding: 3, borderWidth: 1, borderColor: '#e2e8f0' },
  avatarSmall: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f1f5f9' },
  editIconSmall: { position: 'absolute', bottom: 5, right: 5, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4364f7' },
  name: { color: '#4a5568', fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  userName: { fontWeight: '700', fontSize: 18, color: '#2d3748' },
  phoneContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#edf2f7' },
  phoneText: { color: '#4a5568', marginLeft: 8, fontSize: 13 },
  drawerItems: { flex: 1, paddingTop: 10, marginHorizontal: 15 },
  drawerLabel: { fontSize: 16, fontWeight: '500', marginLeft: -15 },
  listBusinessItem: { paddingVertical: 15, paddingHorizontal: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  listBusinessContent: { flexDirection: 'row', alignItems: 'center' },
  listBusinessText: { fontSize: 16, fontWeight: '500', marginLeft: 15, color: '#555', flex: 1 },
  newBadge: { backgroundColor: '#e53e3e', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 10 },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  languageWrapper: { marginHorizontal: 15, marginTop: 15 },
  languageCard: { borderRadius: 12, padding: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  languageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  languageIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#4364f7' },
  languageLabel: { fontSize: 16, color: '#2d3748', fontWeight: '600' },
  pickerWrapper: { borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', overflow: 'hidden' },
  picker: { height: 50, color: '#4a5568' },
  footer: { padding: 20, paddingTop: 5 },
  footerButton: { borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginTop: 10 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  footerText: { marginLeft: 15, fontSize: 15, fontWeight: '600', flex: 1 },
  versionText: { textAlign: 'center', color: '#a0aec0', fontSize: 12, marginBottom: 10 },
  whatsappButton: { borderLeftWidth: 4, borderLeftColor: '#25D366' },
  logoutButton: { borderLeftWidth: 4, borderLeftColor: '#e74c3c' },
});

export default CustomDrawer;
