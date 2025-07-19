import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';


const Splash = ({ navigation }) => {



  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('ChooseLanguage'); // Replace with your main screen name
    }, 3000); // 3 seconds

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <LinearGradient colors={['#00c6ff', '#0072ff']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0072ff" />
      <Animatable.Text
        animation="fadeInDown"
        duration={1500}
        style={styles.logoText}
      >
        PublicIn
      </Animatable.Text>
      <Animatable.Text
        animation="fadeInUp"
        delay={500}
        duration={1500}
        style={styles.tagline}
      >
        सेवा का नया चेहरा
      </Animatable.Text>
    </LinearGradient>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'sans-serif-medium',
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 10,
    fontSize: 18,
    color: '#f0f0f0',
    fontStyle: 'italic',
  },
});
