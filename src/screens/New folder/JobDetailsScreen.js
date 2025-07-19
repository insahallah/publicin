import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import RNPickerSelect from 'react-native-picker-select';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { BASE_URL } from './BaseUrl';

// API URLs
const CATEGORY_API_URL = `${BASE_URL}/api/category_list.php`;
const DISTRICT_API_URL = `${BASE_URL}/api/district_list.php`;
const BLOCK_API_URL = `${BASE_URL}/api/get_blocks.php`;
const POST_DATA_URL = `${BASE_URL}/api/business_submissions.php`;
const IMAGE_UPLOAD_URL = `${BASE_URL}/api/upload_business_images.php`;

const JobDetailsScreen = ({ navigation, route }) => {
  const { mobile = 'Unknown' } = route?.params || {};
  const [lang, setLang] = useState('en');
  const [labels, setLabels] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    businessName: '',

    description: '',
    block: '',
    district: ''
  });
  
  // Options state
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [blockOptions, setBlockOptions] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    categories: true,
    districts: true,
    subcategory: false,
    blocks: false,
    submitting: false
  });
  
  // Other state
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Language configuration
  const languageData = {
    en: {
      title: 'Job Details',
      welcome: 'Welcome',
      selectCategory: 'Business Category',
      selectSubcategory: 'Subcategory',
      district: 'District',
      block: 'Block',
      pin: 'PIN Code',
      businessName: 'Business Name',
      address: 'Address',
      mobileNumber: 'Mobile Number',
      description: 'Description',
      selectImage: 'Select Images',
      submit: 'Submit',
      chooseCategory: 'Select category...',
      chooseSubcategory: 'Select subcategory...',
      chooseDistrict: 'Select district...',
      chooseBlock: 'Select block...',
      fillAll: 'Please fill all required fields',
      success: 'Job details submitted successfully!',
      submissionFailed: 'Submission failed',
      minImages: 'Select at least one image',
      maxImages: 'Maximum 5 images allowed'
    },
    hi: {
      title: 'नौकरी विवरण',
      welcome: 'स्वागत है',
      selectCategory: 'व्यवसाय श्रेणी',
      selectSubcategory: 'उपश्रेणी',
      district: 'जिला',
      block: 'प्रखंड',
      pin: 'पिन कोड',
      businessName: 'व्यवसाय का नाम',
      address: 'पता',
      mobileNumber: 'मोबाइल नंबर',
      description: 'विवरण',
      selectImage: 'छवियाँ चुनें',
      submit: 'जमा करें',
      chooseCategory: 'श्रेणी चुनें...',
      chooseSubcategory: 'उपश्रेणी चुनें...',
      chooseDistrict: 'जिला चुनें...',
      chooseBlock: 'प्रखंड चुनें...',
      fillAll: 'कृपया सभी आवश्यक फ़ील्ड भरें',
      success: 'विवरण सफलतापूर्वक सबमिट हुआ!',
      submissionFailed: 'सबमिशन असफल',
      minImages: 'कम से कम एक छवि चुनें',
      maxImages: 'अधिकतम 5 छवियाँ अनुमत हैं'
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const langStored = await AsyncStorage.getItem('appLanguage') || 'en';
        setLang(langStored);
        setLabels(languageData[langStored]);

        const [pinData, userMobile, userId, userData] = await Promise.all([
          AsyncStorage.getItem('pin'),
          AsyncStorage.getItem('user_mobile'),
          AsyncStorage.getItem('id'),
          AsyncStorage.getItem('user')
        ]);

        setFormData(prev => ({
          ...prev,
          pinCode: pinData || '',
          mobileNumber: userMobile || ''
        }));
        setUserId(userId || '');
        setUser(userData ? JSON.parse(userData) : null);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    loadInitialData();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${CATEGORY_API_URL}?action=categories`);
        const json = await response.json();
        
        if (json.status === 'success') {
          setCategoryOptions(json.data.map(cat => ({
            label: cat.name,
            value: cat.id
          })));
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load categories');
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!formData.category) {
        setSubcategoryOptions([]);
        return;
      }

      try {
        setLoading(prev => ({ ...prev, subcategory: true }));
        const response = await fetch(
          `${CATEGORY_API_URL}?action=subcategories&parent_id=${formData.category}`
        );
        const json = await response.json();
        
        if (json.status === 'success') {
          setSubcategoryOptions(json.data.map(sub => ({
            label: sub.name,
            value: sub.id
          })));
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load subcategories');
      } finally {
        setLoading(prev => ({ ...prev, subcategory: false }));
      }
    };

    fetchSubcategories();
  }, [formData.category]);

  // Fetch districts
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await fetch(DISTRICT_API_URL);
        const json = await response.json();
        
        if (json.status === 'success') {
          setDistrictOptions(json.data.map(d => ({
            label: d.district_name,
            value: d.id
          })));
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load districts');
      } finally {
        setLoading(prev => ({ ...prev, districts: false }));
      }
    };

    fetchDistricts();
  }, []);

  // Fetch blocks when district changes
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!formData.district) {
        setBlockOptions([]);
        return;
      }

      try {
        setLoading(prev => ({ ...prev, blocks: true }));
        const response = await fetch(
          `${BLOCK_API_URL}?district_id=${formData.district}`
        );
        const json = await response.json();
        
        if (json.status === 'success') {
          setBlockOptions(json.data.map(b => ({
            label: b.block_name,
            value: b.id
          })));
        } else {
          Alert.alert('Error', 'No blocks found');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load blocks');
      } finally {
        setLoading(prev => ({ ...prev, blocks: false }));
      }
    };

    fetchBlocks();
  }, [formData.district]);

  // Handle form input changes
  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle image selection
  const handleImagePick = async () => {
    try {
      const images = await ImagePicker.openPicker({
        multiple: true,
        mediaType: 'photo',
        maxFiles: 5,
        cropping: false
      });

      if (images.length > 5) {
        Alert.alert('Error', labels.maxImages);
        return;
      }

      const formatted = images.map(img => ({
        uri: img.path,
        name: img.filename || `image-${Date.now()}.jpg`,
        type: img.mime,
      }));

      setSelectedImages(formatted);
    } catch (err) {
      if (err.code !== 'E_PICKER_CANCELLED') {
        console.warn('Image picker error:', err);
      }
    }
  };

  // Remove selected image
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      'category', 'subcategory', 'businessName', 

      'description', 'block', 'district'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = true;
      }
    });

    if (selectedImages.length === 0) {
      errors.images = labels.minImages;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', labels.fillAll);
      return;
    }

    setLoading(prev => ({ ...prev, submitting: true }));

    try {
      // Submit business details
      const formPayload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formPayload.append(key, value);
      });
      formPayload.append('userId', userId);

      const formRes = await axios.post(POST_DATA_URL, formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { success, post_id } = formRes.data;

      if (!success || !post_id) {
        throw new Error('Form submission failed');
      }

      // Submit images
      if (selectedImages.length > 0) {
        const imageForm = new FormData();
        imageForm.append('post_id', post_id);
        imageForm.append('user_id', userId);

        selectedImages.forEach(img => {
          imageForm.append('images[]', {
            uri: img.uri,
            type: img.type,
            name: img.name,
          });
        });

        await axios.post(IMAGE_UPLOAD_URL, imageForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      Alert.alert('Success', labels.success);
      navigation.navigate('MainApp', { screen: 'PostJob', params: { userId } });
    } catch (err) {
      console.error('Submission error:', err);
      Alert.alert('Error', labels.submissionFailed);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  // Render form fields
  const renderPicker = (items, value, onChange, placeholder, loadingState) => (
    <View style={[
      styles.pickerContainer, 
      validationErrors[placeholder] && styles.errorField
    ]}>
      {loading[loadingState] ? (
        <ActivityIndicator style={styles.pickerLoader} />
      ) : (
        <RNPickerSelect
          onValueChange={onChange}
          items={items}
          value={value}
          placeholder={{ label: placeholder, value: null }}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false}
        />
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.screen}>
        <Animatable.View 
          animation="fadeInDown" 
          duration={700} 
          style={styles.card}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{labels.title}</Text>
            <Text style={styles.welcomeText}>
              {labels.welcome}, {user?.name || 'User'}!
            </Text>
          </View>

          {/* Category Picker */}
          <Text style={styles.label}>{labels.selectCategory}</Text>
          {renderPicker(
            categoryOptions,
            formData.category,
            (value) => handleInputChange('category', value),
            labels.chooseCategory,
            'categories'
          )}

          {/* Subcategory Picker */}
          <Text style={styles.label}>{labels.selectSubcategory}</Text>
          {renderPicker(
            subcategoryOptions,
            formData.subcategory,
            (value) => handleInputChange('subcategory', value),
            labels.chooseSubcategory,
            'subcategory'
          )}

          {/* District Picker */}
          <Text style={styles.label}>{labels.district}</Text>
          {renderPicker(
            districtOptions,
            formData.district,
            (value) => handleInputChange('district', value),
            labels.chooseDistrict,
            'districts'
          )}

          {/* Block Picker */}
          <Text style={styles.label}>{labels.block}</Text>
          {renderPicker(
            blockOptions,
            formData.block,
            (value) => handleInputChange('block', value),
            labels.chooseBlock,
            'blocks'
          )}

          {/* Business Name */}
          <Text style={styles.label}>{labels.businessName}</Text>
          <TextInput
            style={[
              styles.input, 
              validationErrors.businessName && styles.errorField
            ]}
            placeholder={labels.businessName}
            value={formData.businessName}
            onChangeText={(text) => handleInputChange('businessName', text)}
          />

          
          {/* Description */}
          <Text style={styles.label}>{labels.description}</Text>
          <TextInput
            style={[
              styles.input, 
              styles.multilineInput,
              validationErrors.description && styles.errorField
            ]}
            placeholder={labels.description}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
          />

          {/* Image Picker */}
          <TouchableOpacity 
            style={styles.imagePickerButton} 
            onPress={handleImagePick}
          >
            <MaterialIcons name="add-photo-alternate" size={20} color="white" />
            <Text style={styles.imagePickerText}>{labels.selectImage}</Text>
          </TouchableOpacity>

          {/* Selected Images Preview */}
          {selectedImages.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.imageCountText}>
                {selectedImages.length} {selectedImages.length === 1 ? 'image' : 'images'} selected
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <MaterialIcons name="close" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading.submitting}
          >
            {loading.submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{labels.submit}</Text>
            )}
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 15,
    backgroundColor: '#f0f4f8',
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ed',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  label: {
    marginTop: 15,
    marginBottom: 8,
    fontWeight: '600',
    color: '#34495e',
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dce0e6',
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerLoader: {
    padding: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dce0e6',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#2c3e50',
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    backgroundColor: '#3498db',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  imagePickerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  imagePreviewContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  imageCountText: {
    color: '#7f8c8d',
    marginBottom: 8,
    fontSize: 14,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 25,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  errorField: {
    borderColor: '#e74c3c',
    backgroundColor: '#fef5f5',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: '#2c3e50',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#2c3e50',
    paddingRight: 30,
  },
  placeholder: {
    color: '#95a5a6',
  },
});

export default JobDetailsScreen;