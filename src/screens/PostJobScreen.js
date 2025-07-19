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
  Platform, StatusBar
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import RNPickerSelect from 'react-native-picker-select';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';
//import SvgUri from 'react-native-svg-uri';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { BASE_URL } from './BaseUrl';
import { DOMAIN_URL } from './BaseUrl';

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
  const [districtOptions, setDistrictOptions] = useState([]);
  const [blockOptions, setBlockOptions] = useState([]);

  // Dropdown states
  const [districtOpen, setDistrictOpen] = useState(false);
  const [districtValue, setDistrictValue] = useState(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockValue, setBlockValue] = useState(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([]);

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
      title: 'Fill Your Job Details',
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

useEffect(() => {
  const fetchCategories = async () => {
    try {
      setLoading(prev => ({ ...prev, categories: true }));

      const lang = await AsyncStorage.getItem('appLanguage') || 'en';
      const response = await fetch(`${CATEGORY_API_URL}?action=categories&lang=${lang}`);
      const text = await response.text();

      console.log("Raw response:", text);

      const json = JSON.parse(text);

      if (json.status === 'success') {
        const options = json.data.map(cat => ({
          label: `${cat.emoji || ''} ${cat.name}`,
          value: `cat_${cat.id}`,
          labelStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#000',
            padding: 10,
          },
          // icon: () => (
          //   <SvgUri
          //     width="35"
          //     height="35"
          //     source={{ uri: DOMAIN_URL + cat.images }}
          //     style={{ marginRight: 10 }}
          //   />
          // )
        }));

        setCategoryOptions(options);
      } else {
        Alert.alert('Error', 'Server error: ' + json.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  fetchCategories();
}, []);

useEffect(() => {
  const fetchSubcategories = async () => {
    const catId = categoryValue?.replace(/^cat_/, '');

    if (!catId) {
      setSubcategoryOptions([]);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, subcategories: true }));

      const lang = await AsyncStorage.getItem('appLanguage') || 'en';
      const response = await fetch(`${CATEGORY_API_URL}?action=subcategories&parent_id=${catId}&lang=${lang}`);
      const text = await response.text();
      const json = JSON.parse(text);

      if (json.status === 'success') {
        const options = [];

        json.data.forEach(sub => {
          const hasChildren = sub.children && sub.children.length > 0;

          options.push({
            label: `${sub.emoji || ''} ${sub.name}${hasChildren ? ' ›' : ''}`,
            value: 'main_' + sub.id,
            disabled: hasChildren,
            labelStyle: {
              fontSize: 16,
              fontWeight: 'bold',
              color: '#000',
            }
          });

          if (hasChildren) {
            sub.children.forEach(child => {
              options.push({
                label: `   ${child.emoji || ''} ${child.name}`,
                value: 'child_' + child.id,
              });
            });
          }
        });

        setSubcategoryOptions(options);
      } else {
        setSubcategoryOptions([]);
        Alert.alert('No Subcategories', json.message || 'Try another category.');
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      Alert.alert('Error', 'Failed to load subcategories');
    } finally {
      setLoading(prev => ({ ...prev, subcategories: false }));
    }
  };

  fetchSubcategories();
}, [categoryValue]);

  // Fetch districts
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setLoading(prev => ({ ...prev, districts: true }));

        const response = await fetch(DISTRICT_API_URL);
        const json = await response.json();

        if (json.status === 'success') {
          const options = json.data.map(d => ({
            label: `   ${d.emoji || ''}    ${d.district_name}`,
            value: d.id
          }));
          setDistrictOptions(options);
        } else {
          Alert.alert('Error', 'Server error: ' + json.message);
        }
      } catch (error) {
        console.error('District fetch error:', error);
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
      if (!districtValue) return;

      try {
        setLoading(prev => ({ ...prev, blocks: true }));

        const response = await fetch(`${BLOCK_API_URL}?district_id=${districtValue}`);
        const json = await response.json();

        if (json.status === 'success') {
          setBlockOptions(json.data.map(block => ({
            label:  `   ${block.emoji || ''}    ${block.block_name}`,
            value: block.id
          })));
        } else {
          Alert.alert('Error', 'Failed to load blocks: ' + json.message);
        }
      } catch (error) {
        Alert.alert('Error', 'Unable to load blocks');
      } finally {
        setLoading(prev => ({ ...prev, blocks: false }));
      }
    };

    fetchBlocks();
  }, [districtValue]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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

  const validateForm = () => {
    const errors = {};
    const requiredFields = ['category', 'businessName', 'description', 'block', 'district'];

    if (subcategoryOptions.length > 0) {
      requiredFields.push('subcategory');
    }

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

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(labels.fillAll);
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert(labels.minImages);
      return;
    }

    setLoading(prev => ({ ...prev, submitting: true }));

    try {
      // Prepare form data
      const formPayload = new FormData();
      
      // Process category and subcategory values
      const categoryId = formData.category.replace(/^cat_/, '');
      const subcategoryId = formData.subcategory.replace(/^main_|^child_/, '');
      
      // Append all form data
      formPayload.append('category', categoryId);
      formPayload.append('subcategory', subcategoryId);
      formPayload.append('businessName', formData.businessName);
      formPayload.append('description', formData.description);
      formPayload.append('block', formData.block);
      formPayload.append('district', formData.district);
      formPayload.append('userId', userId);
      formPayload.append('mobile', mobile);

      // Submit business details
      const formResponse = await axios.post(POST_DATA_URL, formPayload, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      if (!formResponse.data.success || !formResponse.data.post_id) {
        throw new Error(formResponse.data.message || 'Form submission failed');
      }

      const postId = formResponse.data.post_id;

      // Submit images
      if (selectedImages.length > 0) {
        const imageForm = new FormData();
        imageForm.append('post_id', postId);
        imageForm.append('user_id', userId);

        selectedImages.forEach((img, index) => {
          imageForm.append('images[]', {
            uri: img.uri,
            type: img.type || 'image/jpeg',
            name: img.name || `business_image_${index}.jpg`
          });
        });

        await axios.post(IMAGE_UPLOAD_URL, imageForm, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          timeout: 60000
        });
      }

      // Show success and navigate
      Alert.alert(
        labels.success,
        '',
        [{
          text: 'OK',
          onPress: () => navigation.navigate('MainApp', { 
            screen: 'PostJob', 
            params: { userId, refresh: true } 
          })
        }]
      );

      // Reset form
      setFormData({
        category: '',
        subcategory: '',
        businessName: '',
        description: '',
        block: '',
        district: ''
      });
      setSelectedImages([]);
      setCategoryValue(null);
      setDistrictValue(null);
      setBlockValue(null);
      setValue(null);

    } catch (error) {
      console.error('Submission error:', error);
      let errorMessage = labels.submissionFailed;
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'Network error - please check your connection';
      } else {
        errorMessage = error.message || errorMessage;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.screen}>
        <StatusBar backgroundColor="#5878dd" barStyle="light-content" />

        <Animatable.View
          animation="fadeInDown"
          duration={700}
          style={styles.card}
        >
          <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
              <MaterialIcons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>{labels.title}</Text>
            <Text style={styles.welcomeText}>
              {labels.welcome}, {user?.name || 'User'}!
            </Text>
          </View>

          {/* Business Category */}
          <View style={{ marginTop: 30 }}>
            {loading.categories ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <DropDownPicker
                open={categoryOpen}
                setOpen={setCategoryOpen}
                value={categoryValue}
                setValue={(callback) => {
                  const val = callback(categoryValue);
                  setCategoryValue(val);
                  handleInputChange('category', val);
                }}
                items={categoryOptions}
                placeholder="🔽 Choose a category"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                listMode="MODAL"
                modalProps={{
                  animationType: 'slide',
                }}
                modalTitle="Select Category"
                modalContentContainerStyle={{ paddingVertical: 20 }}
                textStyle={{ fontSize: 14 }}
                placeholderStyle={{ color: '#999' }}
                zIndex={2000}
              />
            )}
          </View>

          {/* Subcategory */}
          <View style={{ marginTop: 30 }}>
            {loading.subcategories ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <DropDownPicker
                items={subcategoryOptions}
                open={open}
                setOpen={setOpen}
                value={value ?? ''}
                setValue={setValue}
                placeholder={labels.chooseSubcategory || "Please select subcategory"}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                listMode="MODAL"
                modalProps={{
                  animationType: 'slide',
                }}
                modalContentContainerStyle={{
                  backgroundColor: '#fff',
                  padding: 16,
                }}
                placeholderStyle={{
                  color: '#999',
                }}
                onChangeValue={(selected) => {
                  if (!selected) {
                    handleInputChange('subcategory', '');
                    return;
                  }
                  const selectedItem = subcategoryOptions.find(item => item.value === selected);
                  if (!selectedItem?.disabled) {
                    const cleanValue = selected.replace(/^main_|^child_/, '');
                    handleInputChange('subcategory', cleanValue);
                  }
                }}
              />
            )}
          </View>

          {/* District */}
          <View style={{ marginTop: 30 }}>
            {loading.districts ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <DropDownPicker
                open={districtOpen}
                setOpen={setDistrictOpen}
                value={districtValue}
                setValue={(callback) => {
                  const val = callback(districtValue);
                  setDistrictValue(val);
                  handleInputChange('district', val);
                }}
                items={districtOptions}
                placeholder={labels.chooseDistrict || "Choose District"}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                listMode="MODAL"
                modalProps={{
                  animationType: 'slide',
                }}
                modalTitle="Select District"
                modalContentContainerStyle={{ paddingVertical: 20 }}
                textStyle={{ fontSize: 14 }}
                placeholderStyle={{ color: '#999' }}
                zIndex={1500}
              />
            )}
          </View>

          {/* Block */}
          <View style={{ marginTop: 30 }}>
            {loading.blocks ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <DropDownPicker
                open={blockOpen}
                setOpen={setBlockOpen}
                value={blockValue}
                setValue={(callback) => {
                  const val = callback(blockValue);
                  setBlockValue(val);
                  handleInputChange('block', val);
                }}
                items={blockOptions}
                placeholder={labels.chooseBlock || "Choose Block"}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                listMode="MODAL"
                modalProps={{
                  animationType: 'slide',
                }}
                modalTitle="Select Block"
                modalContentContainerStyle={{ paddingVertical: 20 }}
                textStyle={{ fontSize: 14 }}
                placeholderStyle={{ color: '#999' }}
                zIndex={1000}
                disabled={!districtValue}
              />
            )}
          </View>

          {/* Business Name */}
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
    paddingTop: 60,
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
    marginTop: 10,
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
  formGroup: {
    marginBottom: 20,
    zIndex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 0,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dce0e6',
    borderRadius: 8,
    marginTop:20,
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
    width: '100%',
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
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  container: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  dropdown: {
    borderColor: '#ccc',
    minHeight: 50,
    backgroundColor: '#f9f9f9',
    zIndex: 1000,
  },
  dropdownContainer: {
    borderColor: '#ccc',
    zIndex: 1000,
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
  }, button: {
    backgroundColor: '#007BFF',
    borderRadius: 30,
    padding: 8,
    alignSelf: 'flex-start',
  }, container: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  }, container: {
    zIndex: 999,
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  dropdown: {
    borderColor: '#ccc',
    minHeight: 50,
    backgroundColor: '#f9f9f9'
  },
  dropdownContainer: {
    borderColor: '#ccc'
  }
});

export default JobDetailsScreen;