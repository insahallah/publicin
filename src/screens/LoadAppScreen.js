import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LoadAppScreen() {
  return (
    <View style={styles.container}>
      {/* Your logo/image goes here */}
      <View style={styles.poweredBy}>
        <Text style={styles.text}>Powered By PublicIn</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5878DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  poweredBy: {
    position: 'absolute',
    bottom: 40,
  },
  text: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});