import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import stringsEn from '../../src/screens/languages/en';
import stringsHi from '../../src/screens/languages/hi';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [strings, setStrings] = useState(stringsEn);

  useEffect(() => {
    AsyncStorage.getItem('appLanguage').then((lang) => {
      if (lang) {
        setLanguage(lang);
        setStrings(lang === 'hi' ? stringsHi : stringsEn);
      }
    });
  }, []);

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    setStrings(lang === 'hi' ? stringsHi : stringsEn);
    await AsyncStorage.setItem('appLanguage', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, strings, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
