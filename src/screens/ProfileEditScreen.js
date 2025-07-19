import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './users/BaseUrl';

const ProfileEditScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        const id = await AsyncStorage.getItem('id');
        if (!id) {
          Alert.alert('Error', 'User ID not found in storage.');
          return;
        }
        setUserId(id);

        const response = await fetch(`${BASE_URL}api/users/fetch_profile.php?user_id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const json = await response.json();
        if (!json.success) {
          throw new Error(json.message || 'Failed to load profile data');
        }

        const data = json.data;
        await AsyncStorage.setItem('user_image', data.profile_image_url || '');

        setName(data.name || '');
        setMobile(data.mobile || '');
        setEmail(data.email || '');
        setProfileImage(data.profile_image_url || null);
      } catch (error) {
        Alert.alert('Error', 'Failed to load profile: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleChooseImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Image Error', response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setProfileImage(response.assets[0].uri);
      }
    });
  };

  const handleSave = async () => {
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();
    const trimmedOld = oldPassword.trim();

    if (trimmedPassword || trimmedConfirm || trimmedOld) {
      if (!trimmedPassword || !trimmedConfirm) {
        Alert.alert('Error', 'Please fill in both new and confirm password fields.');
        return;
      }

      if (trimmedPassword !== trimmedConfirm) {
        Alert.alert('Error', 'New password and confirm password do not match.');
        return;
      }

      if (!trimmedOld) {
        Alert.alert('Error', 'Please enter your old password to change it.');
        return;
      }
    }

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('name', name);
    formData.append('mobile', mobile);
    formData.append('email', email);

    if (trimmedPassword) {
      formData.append('old_password', trimmedOld);
      formData.append('password', trimmedPassword);
    }

    if (profileImage && profileImage.startsWith('file://')) {
      const fileName = profileImage.split('/').pop();
      const fileType = 'image/jpeg';
      formData.append('profile_image', {
        uri: profileImage,
        name: fileName,
        type: fileType,
      });
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${BASE_URL}api/users/update_profile.php`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        Alert.alert('Success', 'Profile Updated!');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', flex: 1 }]}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableOpacity onPress={handleChooseImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <View style={styles.avatarInner}>
              <Icon name="camera" size={28} color="#888" style={{ marginBottom: 6 }} />
              <Text style={{ color: '#888', textAlign: 'center', fontSize: 12 }}>
                Select{'\n'}Profile Image
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        placeholder="Mobile Number"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        placeholderTextColor="#888"
        editable={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholderTextColor="#888"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Old Password"
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry
        placeholderTextColor="#888"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor="#888"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eaeaea',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileEditScreen;
