// WhatsAppClipboardButton.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

const WhatsAppClipboardButton = ({ message, phoneNumber }) => {
  const handleWhatsAppSend = () => {
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Make sure WhatsApp is installed on your device');
    });
  };

  const handleCopyToClipboard = () => {
    Clipboard.setString(message);
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.whatsappButton}
        onPress={handleWhatsAppSend}
        onLongPress={handleCopyToClipboard}
      >
        <Text style={styles.buttonText}>Send via WhatsApp</Text>
        <Text style={styles.hintText}>(Long press to copy)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366', // WhatsApp green
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hintText: {
    color: '#e0f7e9',
    fontSize: 12,
    marginTop: 4,
  },
});

export default WhatsAppClipboardButton;
