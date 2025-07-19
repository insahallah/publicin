import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t, i18n } = useTranslation();

  return (
    <View>
      <Text>Language: {i18n.language}</Text>
      <Text>appName: {t('appName')}</Text>
    </View>
  );
};

export default MyComponent;
