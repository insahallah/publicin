const handleLogout = async () => {
  try {
    // Optional: clear only relevant keys
    await AsyncStorage.multiRemove([
      'user',
      'id',
      'token',
      'pin',
      'user_image',
      'user_name',
      'user_mobile',
      'appLanguage'
    ]);

    // OR: Uncomment below to clear everything (be careful)
    // await AsyncStorage.clear();

    // Navigate to login screen and reset stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });

  } catch (error) {
    console.error('Logout error:', error);
    Alert.alert('Error', 'Something went wrong while logging out.');
  }
};
