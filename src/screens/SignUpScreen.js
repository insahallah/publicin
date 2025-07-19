import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SignupScreenTranslator from './languages/SignupScreenTranslator';

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

  useEffect(() => {
    const loadLanguage = async () => {
      const selectedLang = await AsyncStorage.getItem('appLanguage');
      setLang(selectedLang || 'en');
      setT(SignupScreenTranslator[selectedLang] || SignupScreenTranslator.en);
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (newLang) => {
    setLang(newLang);
    setT(SignupScreenTranslator[newLang]);
    await AsyncStorage.setItem('appLanguage', newLang);
  };

  const handleSignup = async () => {
    if (!fullName || !mobile || !pin || !city || !village || !block || !state || !password) {
      Alert.alert(t.alertTitle, t.alertMsgFillAllFields);
      return;
    }
    if (mobile.length !== 10) {
      Alert.alert(t.alertTitle, t.alertMsgMobileInvalid);
      return;
    }
    if (pin.length !== 6) {
      Alert.alert(t.alertTitle, t.alertMsgPinInvalid);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://allupipay.in/publicsewa/api/signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(fullName)}&mobile=${mobile}&pin=${pin}&city=${encodeURIComponent(city)}&village=${encodeURIComponent(village)}&block=${encodeURIComponent(block)}&state=${encodeURIComponent(state)}&password=${encodeURIComponent(password)}`
      });

      const data = await response.json();
      setLoading(false);

      if (data.status === 'success') {
        Alert.alert(t.successTitle, t.signupSuccess);
        navigation.navigate('LoginScreen');
      } else {
        Alert.alert(t.errorTitle, data.message || t.signupFailed);
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      Alert.alert(t.errorTitle, t.errorMsg);
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

      <Animatable.View animation="fadeInDown" style={styles.header}>
        <Text style={styles.title}>{t.signupTitle}</Text>
        <Text style={styles.subtitle}>{t.signupSubtitle}</Text>
      </Animatable.View>

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
                }
              }}
            />

            {renderInputLabel('location-city', t.city)}
            <TextInput
              style={styles.input}
              placeholder={t.city}
              value={city}
              onChangeText={setCity}
            />

            {renderInputLabel('home', t.village)}
            <TextInput
              style={styles.input}
              placeholder={t.village}
              value={village}
              onChangeText={setVillage}
            />

            {renderInputLabel('domain', t.block)}
            <TextInput
              style={styles.input}
              placeholder={t.block}
              value={block}
              onChangeText={setBlock}
            />

            {renderInputLabel('map', t.state)}
            <TextInput
              style={styles.input}
              placeholder={t.state}
              value={state}
              onChangeText={setState}
            />

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
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t.signup}</Text>
                )}
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
  languagePickerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  languagePicker: {
    height: 50,
    width: 150,
    color: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#f0f0f0',
    marginTop: 5,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#000',
  },
  button: {
    marginTop: 30,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  register: {
    marginTop: 15,
    textAlign: 'center',
    color: '#0047ab',
    fontSize: 16,
  },
});

export default SignupScreen;
