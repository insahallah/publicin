import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreenTranslator from './langs/LoginScreenTranslator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { showMessage } from "react-native-flash-message";
import { BASE_URL } from './BaseUrl';

const LoginScreen = ({ navigation }) => {
  const [lang, setLang] = useState('en');
  const [t, setT] = useState(LoginScreenTranslator['en']);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage');
        const selectedLang = storedLang || 'en';
        setLang(selectedLang);
        setT(LoginScreenTranslator[selectedLang]);
      } catch (e) {
        console.warn('Failed to load language', e);
      }
    })();
  }, []);

  const changeLanguage = async (newLang) => {
    setLang(newLang);
    setT(LoginScreenTranslator[newLang]);
    try {
      await AsyncStorage.setItem('appLanguage', newLang);
    } catch (e) {
      console.warn('Failed to save language', e);
    }
  };

  const handleLogin = async () => {
    if (!mobile || !password) {
      showMessage({
        message: t.alertMsg,
        type: 'warning',
        icon: 'warning',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `mobile=${encodeURIComponent(mobile)}&password=${encodeURIComponent(password)}`,
      });

      const text = await response.text();
      console.log('Raw login response:', text);

      const data = JSON.parse(text);
      console.log('Parsed login response:', data);
      setLoading(false);

      if (data.status === 'success') {
        if (!data.name || !data.mobile || !data.id) {
          showMessage({
            message: 'Login Failed: Missing user data in response.',
            type: 'danger',
            icon: 'danger',
          });
          return;
        }

        try {
          await AsyncStorage.setItem('user_image', String(data.profile_image));
          await AsyncStorage.setItem('user_name', String(data.name));
          await AsyncStorage.setItem('user_mobile', String(data.mobile));
          await AsyncStorage.setItem('id', String(data.id));
          await AsyncStorage.setItem('pin', String(data.pin || ''));
          await AsyncStorage.setItem('user', JSON.stringify(data));
        } catch (e) {
          console.warn('Storage error:', e);
          showMessage({
            message: 'Storage Error: Failed to save user data.',
            type: 'danger',
            icon: 'danger',
          });
          return;
        }

        showMessage({
          message: `Welcome ${data.name}`,
          type: 'success',
          icon: 'success',
        });

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });

      } else {
        showMessage({
          message: data.message || 'Invalid credentials',
          type: 'danger',
          icon: 'danger',
        });
      }

    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      showMessage({
        message: 'Something went wrong while logging in.',
        type: 'danger',
        icon: 'danger',
      });
    }
  };

  const handleBack = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  };

  return (
    <LinearGradient colors={['#0047ab', '#00c6ff']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0047ab" />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Icon name="arrow-left" size={30} color="#fff" />
      </TouchableOpacity>

      <Animatable.View animation="fadeInDown" style={styles.header}>
        <Text style={styles.title}>{t.welcome}</Text>
        <Text style={styles.subtitle}>{t.loginToContinue}</Text>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder={t.mobile}
          keyboardType="phone-pad"
          maxLength={10}
          value={mobile}
          onChangeText={setMobile}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder={t.password}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity onPress={handleLogin} disabled={loading}>
          <LinearGradient colors={['#00c6ff', '#0047ab']} style={styles.button}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.login}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
          <Text style={styles.register}>{t.noAccount}</Text>
        </TouchableOpacity>
      </Animatable.View>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 10,
    padding: 10,
    zIndex: 10,
  },
  header: {
    marginTop: 100,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 20,
    color: '#eee',
    marginTop: 5,
  },
  card: {
    marginTop: 40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    flex: 1,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderColor: '#ccd6f6',
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginTop: 15,
  },
  button: {
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  register: {
    marginTop: 15,
    textAlign: 'center',
    color: '#00c6ff',
    fontWeight: '600',
  },
});
