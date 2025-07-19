import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SvgUri } from 'react-native-svg';

const RemoteSvgIcon = ({ uri, width =30, height = 30 }) => {
  if (!uri) return <Text>Invalid Icon</Text>;

  return (
    <SvgUri
      width={width}
      height={height}
      source={{ uri }}
      onError={(e) => {
        console.log('SVG Load Error:', e.nativeEvent);
      }}
      onLoad={() => {
        console.log('SVG loaded successfully');
      }}
    />
  );
};

export default RemoteSvgIcon;
