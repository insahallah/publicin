import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ChooseLanguageScreen = ({ navigation }) => {
  const [selectedLang, setSelectedLang] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleEn = useRef(new Animated.Value(1)).current;
  const buttonScaleHi = useRef(new Animated.Value(1)).current;
  const globeRotate = useRef(new Animated.Value(0)).current;
  const globePulse = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      // Fade in content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Slide up title
      Animated.timing(titleSlide, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      // Globe rotation
      Animated.loop(
        Animated.timing(globeRotate, {
          toValue: 1,
          duration: 24000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      // Globe pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(globePulse, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(globePulse, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      )
    ]).start();
  }, []);

  const handleLanguageSelect = async (lang) => {
    const buttonScale = lang === 'en' ? buttonScaleEn : buttonScaleHi;
    
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      })
    ]).start();

    setSelectedLang(lang);
    
    try {
      await AsyncStorage.setItem('appLanguage', lang);
      navigation.replace('MainApp');
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  // Animation interpolations
  const rotate = globeRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const pulse = globePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02]
  });

  const titleTransform = {
    transform: [{ translateY: titleSlide }]
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0A2463" barStyle="light-content" />
      
      {/* Background with subtle gradient effect */}
      <View style={styles.background}>
        <View style={styles.backgroundTop} />
        <View style={styles.backgroundBottom} />
      </View>
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Globe with animation */}
        <Animated.View style={[styles.globeContainer, {
          transform: [
            { rotate },
            { scale: pulse }
          ]
        }]}>
          <View style={styles.globe}>
            <View style={styles.globeInner}>
              <View style={[styles.globeFeature, styles.globeFeature1]} />
              <View style={[styles.globeFeature, styles.globeFeature2]} />
              <View style={[styles.globeFeature, styles.globeFeature3]} />
            </View>
          </View>
          <View style={styles.globeStand} />
        </Animated.View>
        
        {/* Title with slide animation */}
        <Animated.View style={[styles.titleContainer, titleTransform]}>
          <Text style={styles.title}>Select Language</Text>
          <Text style={styles.subtitle}>Choose your preferred app language</Text>
        </Animated.View>
        
        {/* Language buttons */}
        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: buttonScaleEn }] }}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonEn,
                selectedLang === 'en' && styles.buttonSelected
              ]}
              onPress={() => handleLanguageSelect('en')}
              activeOpacity={0.8}
            >
              <Text style={styles.flag}>🇬🇧</Text>
              <Text style={styles.buttonText}>English</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: buttonScaleHi }] }}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonHi,
                selectedLang === 'hi' && styles.buttonSelected
              ]}
              onPress={() => handleLanguageSelect('hi')}
              activeOpacity={0.8}
            >
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.buttonText}>हिन्दी</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
      
      <Text style={styles.footer}>© {new Date().getFullYear()} App Name</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5878dd',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundTop: {
    flex: 1,
    backgroundColor: '#5878dd',
  },
  backgroundBottom: {
    flex: 1,
    backgroundColor: '#5878dd',
  },
  content: {
    width: width * 0.85,
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  globeContainer: {
    marginBottom: 32,
  },
  globe: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3E92CC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#2A7BB6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  globeInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7FC6F0',
    borderWidth: 2,
    borderColor: '#5AB0E8',
    overflow: 'hidden',
    position: 'relative',
  },
  globeFeature: {
    position: 'absolute',
    backgroundColor: '#2A7BB6',
    borderWidth: 1,
    borderColor: '#1E5F9E',
  },
  globeFeature1: {
    top: '25%',
    left: '30%',
    width: '35%',
    height: '15%',
    borderRadius: 8,
    transform: [{ rotate: '20deg' }],
  },
  globeFeature2: {
    top: '50%',
    left: '15%',
    width: '25%',
    height: '20%',
    borderRadius: 6,
    transform: [{ rotate: '-15deg' }],
  },
  globeFeature3: {
    top: '40%',
    right: '20%',
    width: '30%',
    height: '25%',
    borderRadius: 10,
    transform: [{ rotate: '10deg' }],
  },
  globeStand: {
    width: 24,
    height: 30,
    backgroundColor: '#2A7BB6',
    marginTop: -2,
    alignSelf: 'center',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A2463',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#5A6A85',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginVertical: 8,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonEn: {
    backgroundColor: '#3E92CC',
    borderColor: '#2A7BB6',
  },
  buttonHi: {
    backgroundColor: '#FF6B6B',
    borderColor: '#E05555',
  },
  buttonSelected: {
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  flag: {
    fontSize: 26,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
});

export default ChooseLanguageScreen;