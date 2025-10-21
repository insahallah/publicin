import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
  PermissionsAndroid, Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SignupScreenTranslator from './languages/SignupScreenTranslator';
import Geolocation from 'react-native-geolocation-service';
import { showMessage } from "react-native-flash-message";

// ✅ Function to request location permission
const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  // iOS automatically asks permission when using Geolocation
  return true;
};

// ✅ Fetch city/state/block from pincode
const fetchCityStateFromPin = async (pin, setCity, setState, setBlock) => {
  if (pin.length !== 6) return;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    if (
      data[0].Status === 'Success' &&
      data[0].PostOffice &&
      data[0].PostOffice.length > 0
    ) {
      const postOffice = data[0].PostOffice[0];
      setCity(postOffice.District || '');
      setState(postOffice.State || '');
      setBlock(postOffice.Block || '');
    } else {
      setCity('');
      setState('');
      setBlock('');
    }
  } catch (err) {
    console.error('Error fetching city/state:', err);
    setCity('');
    setState('');
    setBlock('');
  }
};

const SignupScreen = ({ navigation }) => {
  const [lang, setLang] = useState('en');
  const [t, setT] = useState(SignupScreenTranslator['en']);

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [village, setVillage] = useState('');
  const [block, setBlock] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Location state
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

 useEffect(() => {
  const loadLanguage = async () => {
    const selectedLang = await AsyncStorage.getItem('appLanguage');
    setLang(selectedLang || 'en');
    setT(SignupScreenTranslator[selectedLang] || SignupScreenTranslator.en);
  };
  loadLanguage();

  // ✅ Request location permission and get location
  (async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
        },
        (error) => {
          console.error('Location Error:', error);
          showMessage({
            message: "Error fetching location",
            description: error.message,
            type: "danger",
          });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      // ⚠️ Permission denied or canceled
      showMessage({
        message: "Location permission denied",
        description: "You need to enable location to continue.",
        type: "warning",
        duration: 5000,
      });

      // ⏳ Wait 10 seconds then redirect user
      setTimeout(() => {
        Linking.openSettings(); // Open Android app settings
        navigation.replace('LoginScreen'); // Redirect to login screen
      }, 10000);
    }
  })();
}, []);
  const changeLanguage = async (newLang) => {
    setLang(newLang);
    setT(SignupScreenTranslator[newLang]);
    await AsyncStorage.setItem('appLanguage', newLang);
  };

  const handleSignup = async () => {
    if (!fullName || !mobile || !pin || !city || !village || !block || !state || !password) {
      showMessage({ message: t.alertMsgFillAllFields, type: 'warning' });
      return;
    }
    if (mobile.length !== 10) {
      showMessage({ message: t.alertMsgMobileInvalid, type: 'warning' });
      return;
    }
    if (pin.length !== 6) {
      showMessage({ message: t.alertMsgPinInvalid, type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://allupipay.in/publicsewa/api/signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:
          `name=${encodeURIComponent(fullName)}` +
          `&mobile=${mobile}` +
          `&pin=${pin}` +
          `&city=${encodeURIComponent(city)}` +
          `&village=${encodeURIComponent(village)}` +
          `&block=${encodeURIComponent(block)}` +
          `&state=${encodeURIComponent(state)}` +
          `&password=${encodeURIComponent(password)}` +
          `&latitude=${encodeURIComponent(latitude)}` +
          `&longitude=${encodeURIComponent(longitude)}`
      });

      const data = await response.json();
      setLoading(false);

      if (data.status === 'success') {
        showMessage({ message: t.signupSuccess, type: 'success' });
        navigation.navigate('LoginScreen');
      } else {
        showMessage({ message: data.message || t.signupFailed, type: 'danger' });
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      showMessage({ message: t.errorMsg, type: 'danger' });
    }
  };

  const renderInputLabel = (iconName, label) => (
    <View style={styles.labelWrapper}>
      <MaterialIcons name={iconName} size={20} color="#333" style={{ marginRight: 8 }} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#0047ab', '#00c6ff']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0047ab" />

      {/* Language Picker */}
      <View style={styles.languagePickerWrapper}>
        <Picker
          selectedValue={lang}
          onValueChange={changeLanguage}
          style={styles.languagePicker}
          dropdownIconColor="#fff"
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="हिंदी" value="hi" />
        </Picker>
      </View>

      {/* Header */}
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t.signupTitle}</Text>
        <Text style={styles.subtitle}>{t.signupSubtitle}</Text>
      </Animatable.View>

      {/* Form Card */}
      <Animatable.View animation="fadeInUp" style={styles.card}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
            showsVerticalScrollIndicator={true}
          >
            {renderInputLabel('person', t.fullName)}
            <TextInput
              style={styles.input}
              placeholder={t.fullName}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            {renderInputLabel('phone', t.mobile)}
            <TextInput
              style={styles.input}
              placeholder={t.mobile}
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
            />

            {renderInputLabel('location-pin', t.pin)}
            <TextInput
              style={styles.input}
              placeholder={t.pin}
              keyboardType="numeric"
              maxLength={6}
              value={pin}
              onChangeText={(text) => {
                setPin(text);
                if (text.length === 6) {
                  fetchCityStateFromPin(text, setCity, setState, setBlock);
                } else {
                  setCity('');
                  setState('');
                  setBlock('');
                }
              }}
            />

            {renderInputLabel('location-city', t.city)}
            <TextInput style={styles.input} placeholder={t.city} value={city} onChangeText={setCity} />

            {renderInputLabel('home', t.village)}
            <TextInput style={styles.input} placeholder={t.village} value={village} onChangeText={setVillage} />

            {renderInputLabel('domain', t.block)}
            <TextInput style={styles.input} placeholder={t.block} value={block} onChangeText={setBlock} />

            {renderInputLabel('map', t.state)}
            <TextInput style={styles.input} placeholder={t.state} value={state} onChangeText={setState} />

            {renderInputLabel('lock', t.password)}
            <TextInput
              style={styles.input}
              placeholder={t.password}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={handleSignup} disabled={loading}>
              <LinearGradient colors={['#00c6ff', '#0047ab']} style={styles.button}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t.signup}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
              <Text style={styles.register}>{t.haveAccount}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animatable.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  languagePickerWrapper: { paddingHorizontal: 20, paddingTop: 10, alignItems: 'flex-end' },
  languagePicker: { height: 50, width: 150, color: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  backButton: { position: 'absolute', left: 10, top: 10, padding: 5, zIndex: 10 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#fff', fontSize: 16, marginTop: 4, textAlign: 'center' },
  card: { flex: 1, backgroundColor: '#fff', marginTop: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  labelWrapper: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  label: { fontSize: 16, color: '#333' },
  input: { backgroundColor: '#f0f0f0', marginTop: 5, padding: 12, borderRadius: 10, fontSize: 16, color: '#000' },
  button: { marginTop: 30, paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  register: { marginTop: 15, textAlign: 'center', color: '#0047ab', fontSize: 16 },
});

export default SignupScreen;
