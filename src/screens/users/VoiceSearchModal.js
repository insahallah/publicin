import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  FlatList,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Voice from '@react-native-voice/voice';
import { BASE_URL } from './BaseUrl';
const LISTENING_DURATION = 10; // 10 seconds listening limit

const API_URL = `${BASE_URL}api/users/voice-search.php`;
const VoiceSearchModal = () => {

   
  const [modalVisible, setModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [lastSpokenText, setLastSpokenText] = useState('');
  const [timeLeft, setTimeLeft] = useState(LISTENING_DURATION);
  const [isLoading, setIsLoading] = useState(false);
   const [language, setLanguage] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
const navigation = useNavigation();
  // Timer effect
  useEffect(() => {
    if (isListening) {
      setTimeLeft(LISTENING_DURATION);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            stopListening();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isListening]);

  // Pulsing effect
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isListening]);


   useEffect(() => {
    const voiceLangs = async () => {
          
      try {
        const lang = await AsyncStorage.getItem('appLanguage');
        if (lang) {
          setLanguage(lang);
        }
      } catch (error) {
        console.error('Error loading AsyncStorage data:', error);
      }
    };

    voiceLangs();
  }, []);


 const searchItems = async (query) => {
  if (!query) {
    setSearchResults([]);
    return;
  }

  setIsLoading(true);
  setLastSpokenText(query);

  try {
    const lang = await AsyncStorage.getItem('appLanguage') || 'en';
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        query, 
        language: lang 
      }),
    });

    // First check if response is OK
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get response text first for debugging
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON response from server');
    }

    console.log('Parsed data:', data);

    if (data.status === 'success') {
      setSearchResults(data.results);
      navigation.navigate('VoiceSearchListDisply', { 
        results: data.results,
        searchQuery: query,
        language: lang
      });
    } else {
      Alert.alert('Error', data.message || 'Search failed');
      setSearchResults([]);
    }
  } catch (error) {
    console.error('API error:', error);
    Alert.alert('Error', error.message || 'Network request failed');
    setSearchResults([]);
  } finally {
    setIsLoading(false);
  }
};


  const animateModal = (show) => {
    Animated.timing(slideAnim, {
      toValue: show ? 0 : 300,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const openModal = () => {
    setModalVisible(true);
    animateModal(true);
  };

  const closeModal = () => {
    animateModal(false);
    setTimeout(() => {
      setModalVisible(false);
      setSearchResults([]);
      setTimeLeft(LISTENING_DURATION);
    }, 300);
    stopListening();
  };

  const onSpeechResults = (e) => {
    const spokenText = e.value?.[0] || '';
    setResults(e.value || []);
    searchItems(spokenText);
  };

  const onSpeechError = () => {
    setIsListening(false);
  };

  const startListening = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "App needs access to your microphone",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
 const langCode = language === 'hi' ? 'hi-IN' : 'en-US';
      await Voice.start(langCode);

      setIsListening(true);
      openModal();
    } catch {
      console.warn('Voice start error');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch {
      console.warn('Voice stop error');
    }
  };

  const onMicPress = () => {
    if (isListening) {
      stopListening().then(startListening);
    } else {
      startListening();
    }
  };

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const pulseInterpolation = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3]
  });
  const opacityInterpolation = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0]
  });

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemCategory}>{item.category}</Text>
    </View>
  );

  return (
    <>
      <TouchableOpacity onPress={onMicPress} style={styles.micButton}>
        <Icon 
          name="mic" 
          size={28} 
          color={isListening ? '#FF3B30' : '#5E7CE2'} 
        />
      </TouchableOpacity>

      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <Animated.View 
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.voiceIndicator}>
              <Icon name="mic" size={48} onPress={onMicPress} color={isListening ? '#FF3B30' : '#5E7CE2'} />
              {isListening && (
                <>
                  <Animated.View style={[
                    styles.pulsingCircle,
                    { transform: [{ scale: pulseInterpolation }], opacity: opacityInterpolation }
                  ]} />
                  <Animated.View style={[
                    styles.pulsingCircle,
                    { transform: [{ scale: pulseInterpolation }], opacity: opacityInterpolation }
                  ]} />
                </>
              )}
            </View>

            <Text style={styles.modalTitle}>
              {isListening ? `Listening... ${timeLeft}s` : 'Press mic to use'}
            </Text>

            {lastSpokenText && (
              <Text style={styles.resultsText}>
                {isListening ? 'Processing...' : `Searched for: "${lastSpokenText}"`}
              </Text>
            )}

           
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  micButton: {
    position: 'fixed',
    right:-10,
   
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
   
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  voiceIndicator: {
    position: 'relative',
    marginBottom: 20,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingCircle: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,59,48,0.3)',
    zIndex: -1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  resultsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultsList: {
    width: '100%',
    marginBottom: 20,
    maxHeight: 200,
  },
  listContent: {
    paddingBottom: 10,
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: '#5E7CE2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VoiceSearchModal;