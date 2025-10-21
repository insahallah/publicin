import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  PermissionsAndroid,
  Linking,
  Animated,
  Dimensions
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import { showMessage } from "react-native-flash-message";

import { generateDescription } from './services/geminiApi';
import { BASE_URL } from './BaseUrl';
import { DOMAIN_URL } from './BaseUrl';

const { width, height } = Dimensions.get('window');

// API URLs
const CATEGORY_API_URL = `${BASE_URL}/api/category_list.php`;
const DISTRICT_API_URL = `${BASE_URL}/api/district_list.php`;
const BLOCK_API_URL = `${BASE_URL}/api/get_blocks.php`;
const POST_DATA_URL = `${BASE_URL}/api/business_submissions.php`;
const IMAGE_UPLOAD_URL = `${BASE_URL}/api/upload_business_images.php`;

// ✅ Function to request location permission
const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to post jobs.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  // iOS automatically asks permission when using Geolocation
  return true;
};

const JobDetailsScreen = ({ navigation, route }) => {
  const { mobile = 'Unknown' } = route?.params || {};
  const [lang, setLang] = useState('en');
  const [labels, setLabels] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    child: '',
    businessName: '',
    description: '',
    block: '',
    district: ''
  });

  // ✅ Location state
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);

  // ✅ AI Description state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

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

  console.log('user', user);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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
      maxImages: 'Maximum 5 images allowed',
      locationRequired: 'Location permission required',
      getLocation: 'Get Current Location',
      locationFetching: 'Fetching location...',
      locationSuccess: 'Location fetched successfully!',
      permissionDenied: 'Location permission denied',
      redirectingSettings: 'Redirecting to settings...',
      redirectingLogin: 'Redirecting to login...',
      locationAutoFetch: 'Automatically fetching your location...',
      // ✅ AI Description Labels
      generateDescription: 'Generate Description with AI',
      generatingDescription: 'Generating Description...',
      descriptionGenerated: 'Description Generated Successfully!',
      descriptionError: 'Failed to generate description',
      aiDescriptionHint: 'Let AI create an engaging description for your business'
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
      maxImages: 'अधिकतम 5 छवियाँ अनुमत हैं',
      locationRequired: 'लोकेशन परमिशन आवश्यक',
      getLocation: 'वर्तमान लोकेशन प्राप्त करें',
      locationFetching: 'लोकेशन प्राप्त कर रहे हैं...',
      locationSuccess: 'लोकेशन सफलतापूर्वक प्राप्त हुआ!',
      permissionDenied: 'लोकेशन परमिशन अस्वीकृत',
      redirectingSettings: 'सेटिंग्स पर रीडायरेक्ट हो रहा है...',
      redirectingLogin: 'लॉगिन पर रीडायरेक्ट हो रहा है...',
      locationAutoFetch: 'आपकी लोकेशन स्वचालित रूप से प्राप्त की जा रही है...',
      // ✅ AI Description Labels in Hindi
      generateDescription: 'Generate Description with AI',
      generatingDescription: 'Generating Description...',
      descriptionGenerated: 'Description Generated Successfully!',
      descriptionError: 'Failed to generate description',
      aiDescriptionHint: 'Let AI create an engaging description for your business'
    }
  };

  // Animation effects
  useEffect(() => {
    if (aiGenerated) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        }, 4000);
      });
    }
  }, [aiGenerated]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // ✅ Check location permission on component mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // ✅ Load language and user data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const langStored = await AsyncStorage.getItem('appLanguage') || 'en';
        setLang(langStored);
        setLabels(languageData[langStored]);

        const [userMobile, userId, userData] = await Promise.all([
          AsyncStorage.getItem('user_mobile'),
          AsyncStorage.getItem('id'),
          AsyncStorage.getItem('user')
        ]);

        setUserId(userId || '');
        setUser(userData ? JSON.parse(userData) : null);
      } catch (error) {
        console.error('Initialization error:', error);
        showMessage({
          message: "Error loading data",
          description: "Please restart the app",
          type: "danger",
        });
      }
    };

    loadInitialData();
  }, []);

  const generateAIDescription = async () => {
    if (!formData.businessName || !formData.category) {
      showMessage({
        message: "Information Required",
        description: "Please enter business name and select category first",
        type: "warning",
      });
      return;
    }

    setAiLoading(true);
    setAiGenerated(false);

    try {
      const selectedCategory = categoryOptions?.find(c => c.value === categoryValue);
      const selectedDistrict = districtOptions?.find(d => d.value === districtValue);
      const categoryName = selectedCategory?.label?.replace(/[^\w\s]/g, '').trim() || '';
      const districtName = selectedDistrict?.label?.replace(/[^\w\s]/g, '').trim() || '';
      const language = lang === 'hi' ? 'Hindi' : 'English';

      const prompt = `
Generate a professional, engaging, and natural-sounding business description in ${language} for:

Business Name: ${formData.businessName}
Category: ${categoryName}
${user.block ? `Location: ${user.village}` : ''}

- Highlight services, quality, and customer focus.
- Keep it clear and persuasive for potential customers.
- Use complete sentences and a friendly tone.
- Ensure the description is between 100 and 150 words.
- Do not include emojis or special symbols.

Write in plain ${language}.
    `.trim();

      console.log("AI Prompt:", prompt);

      const aiDescription = await generateDescription(prompt);
      const cleanDescription = aiDescription.replace(/\s+/g, ' ').trim();
      const words = cleanDescription.split(' ');
      const trimmedDescription = words.length > 150 ? words.slice(0, 150).join(' ') : cleanDescription;

      if (trimmedDescription) {
        setFormData(prev => ({ ...prev, description: trimmedDescription }));
        setAiGenerated(true);

        showMessage({
          message: labels.descriptionGenerated || "Description Generated Successfully!",
          type: "success",
        });
      } else {
        setFormData(prev => ({
          ...prev,
          description: "AI could not generate a description. Please enter manually."
        }));
        showMessage({
          message: labels.descriptionError || "Failed to generate description",
          description: "AI returned empty text. Please write manually.",
          type: "danger",
        });
      }
    } catch (error) {
      console.error("AI Description Error:", error);
      setFormData(prev => ({
        ...prev,
        description: "AI could not generate a description. Please enter manually."
      }));
      showMessage({
        message: labels.descriptionError || "Failed to generate description",
        description: error?.message || "Please try again or write manually",
        type: "danger",
      });
    } finally {
      setAiLoading(false);
    }
  };

  // ✅ Check location permission and handle flow
  const checkLocationPermission = async () => {
    const hasPermission = await requestLocationPermission();
    setPermissionChecked(true);

    if (hasPermission) {
      setHasLocationPermission(true);
      getCurrentLocation();
    } else {
      setHasLocationPermission(false);
      showMessage({
        message: labels.locationRequired || "Location permission required",
        description: labels.redirectingSettings || "Redirecting to settings...",
        type: "warning",
        duration: 4000,
      });

      setTimeout(() => {
        Linking.openSettings().then(() => {
          setTimeout(() => {
            checkPermissionAfterSettings();
          }, 1000);
        });
      }, 4000);
    }
  };

  // ✅ Check permission after user returns from settings
  const checkPermissionAfterSettings = async () => {
    const hasPermission = await requestLocationPermission();

    if (hasPermission) {
      setHasLocationPermission(true);
      getCurrentLocation();
      showMessage({
        message: "Permission granted!",
        description: "Automatically fetching your location...",
        type: "success",
      });
    } else {
      showMessage({
        message: labels.permissionDenied || "Location permission denied",
        description: labels.redirectingLogin || "Redirecting to login...",
        type: "danger",
        duration: 3000,
      });

      setTimeout(() => {
        navigation.replace('LoginScreen');
      }, 3000);
    }
  };

  // ✅ Function to get current location automatically
  const getCurrentLocation = () => {
    if (!hasLocationPermission) {
      showMessage({
        message: labels.locationRequired || "Location permission required",
        type: "warning",
      });
      return;
    }

    setLocationLoading(true);

    Geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();

        setLatitude(lat);
        setLongitude(lng);
        setLocationLoading(false);
        setLocationFetched(true);

        showMessage({
          message: labels.locationSuccess || "Location fetched successfully!",
          description: `Lat: ${lat.substring(0, 8)}, Lng: ${lng.substring(0, 8)}`,
          type: "success",
        });

        console.log('Location automatically fetched:', { latitude: lat, longitude: lng });
      },
      (error) => {
        console.error('Location Error:', error);
        setLocationLoading(false);
        setLocationFetched(false);

        let errorMessage = "Error fetching location";
        if (error.code === 1) errorMessage = "Location permission denied";
        if (error.code === 2) errorMessage = "Location unavailable";
        if (error.code === 3) errorMessage = "Location request timeout";

        showMessage({
          message: errorMessage,
          description: "Please try again or check your location settings",
          type: "danger",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  };

  // ✅ Manual location refresh function
  const refreshLocation = () => {
    getCurrentLocation();
  };

  // ✅ Fetch categories when permission is granted
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
          }));

          setCategoryOptions(options);
        } else {
          showMessage({
            message: "Server Error",
            description: json.message || 'Failed to load categories',
            type: "danger",
          });
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        showMessage({
          message: "Error",
          description: "Failed to load categories",
          type: "danger",
        });
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    if (hasLocationPermission) {
      fetchCategories();
    }
  }, [hasLocationPermission]);

  // ✅ Fetch subcategories when category changes
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
          showMessage({
            message: "No Subcategories",
            description: json.message || 'Try another category.',
            type: "info",
          });
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        showMessage({
          message: "Error",
          description: "Failed to load subcategories",
          type: "danger",
        });
      } finally {
        setLoading(prev => ({ ...prev, subcategories: false }));
      }
    };

    fetchSubcategories();
  }, [categoryValue]);

  // ✅ Fetch districts
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
          showMessage({
            message: "Server Error",
            description: json.message || 'Failed to load districts',
            type: "danger",
          });
        }
      } catch (error) {
        console.error('District fetch error:', error);
        showMessage({
          message: "Error",
          description: "Failed to load districts",
          type: "danger",
        });
      } finally {
        setLoading(prev => ({ ...prev, districts: false }));
      }
    };

    if (hasLocationPermission) {
      fetchDistricts();
    }
  }, [hasLocationPermission]);

  // ✅ Fetch blocks when district changes
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!districtValue) return;

      try {
        setLoading(prev => ({ ...prev, blocks: true }));

        const response = await fetch(`${BLOCK_API_URL}?district_id=${districtValue}`);
        const json = await response.json();

        if (json.status === 'success') {
          setBlockOptions(json.data.map(block => ({
            label: `   ${block.emoji || ''}    ${block.block_name}`,
            value: block.id
          })));
        } else {
          showMessage({
            message: "Error",
            description: 'Failed to load blocks: ' + json.message,
            type: "danger",
          });
        }
      } catch (error) {
        showMessage({
          message: "Error",
          description: "Unable to load blocks",
          type: "danger",
        });
      } finally {
        setLoading(prev => ({ ...prev, blocks: false }));
      }
    };

    fetchBlocks();
  }, [districtValue]);

  // ✅ Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      if (field === 'subcategory') {
        return {
          ...prev,
          subcategory: value,
          child: '',
        };
      }

      if (field === 'child') {
        return {
          ...prev,
          child: value,
          subcategory: '',
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // ✅ Handle image selection
  const handleImagePick = async () => {
    try {
      const images = await ImagePicker.openPicker({
        multiple: true,
        mediaType: 'photo',
        maxFiles: 5,
        cropping: false
      });

      if (images.length > 5) {
        showMessage({
          message: "Error",
          description: labels.maxImages || "Maximum 5 images allowed",
          type: "warning",
        });
        return;
      }

      const formatted = images.map(img => ({
        uri: img.path,
        name: img.filename || `image-${Date.now()}.jpg`,
        type: img.mime,
      }));

      setSelectedImages(formatted);
      showMessage({
        message: "Images Selected",
        description: `${images.length} image(s) added successfully`,
        type: "success",
      });
    } catch (err) {
      if (err.code !== 'E_PICKER_CANCELLED') {
        console.warn('Image picker error:', err);
        showMessage({
          message: "Error",
          description: "Failed to select images",
          type: "danger",
        });
      }
    }
  };

  // ✅ Remove selected image
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    showMessage({
      message: "Image Removed",
      description: "Image removed successfully",
      type: "info",
    });
  };

  // ✅ Validate form
  const validateForm = () => {
    const errors = {};
    const requiredFields = ['category', 'businessName', 'description', 'block', 'district'];

    // Subcategory/Child check
    if (!formData.subcategory && !formData.child) {
      errors.subcategory = true;
    }

    // Other required fields
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = true;
      }
    });

    // Images check
    if (selectedImages.length === 0) {
      errors.images = labels.minImages;
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showMessage({
        message: labels.fillAll || "Please fill all required fields",
        description: "Check all fields and try again",
        type: "warning",
      });
      return false;
    }

    return true;
  };

  // ✅ Handle form submission
  const handleSubmit = async () => {
    if (!hasLocationPermission) {
      showMessage({
        message: labels.locationRequired || "Location permission required",
        description: "Please enable location to submit job details",
        type: "warning",
      });
      return;
    }

    if (!latitude || !longitude) {
      showMessage({
        message: "Location not available",
        description: "Please wait for location to be fetched",
        type: "warning",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!formData.subcategory && !formData.child) {
      showMessage({
        message: "Selection Required",
        description: "Please select a subcategory or child category",
        type: "warning",
      });
      return;
    }

    if (selectedImages.length === 0) {
      showMessage({
        message: "Images Required",
        description: labels.minImages || "Select at least one image",
        type: "warning",
      });
      return;
    }

    setLoading(prev => ({ ...prev, submitting: true }));

    try {
      const formPayload = new FormData();

      const categoryId = String(formData.category || '').replace(/^cat_/, '');
      const subcategoryId = String(formData.subcategory || '').replace(/^sub_/, '');
      const childId = String(formData.child || '').replace(/^child_/, '');

      formPayload.append('category', categoryId);
      formPayload.append('subcategory', subcategoryId || '');
      formPayload.append('child', childId || '');
      formPayload.append('businessName', formData.businessName || '');
      formPayload.append('description', formData.description || '');
      formPayload.append('block', formData.block || '');
      formPayload.append('district', formData.district || '');
      formPayload.append('block_name', user.block || '');
      formPayload.append('district_name', user.city || '');
      formPayload.append('village', user.village || '');
      formPayload.append('mobile', user.mobile || '');
      formPayload.append('userId', String(userId));
      formPayload.append('latitude', latitude);
      formPayload.append('longitude', longitude);

      console.log('Submitting form with location:', { latitude, longitude });

      const formResponse = await axios.post(POST_DATA_URL, formPayload, {
        headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' },
        timeout: 30000
      });

      if (!formResponse.data.success || !formResponse.data.post_id) {
        throw new Error(formResponse.data.message || 'Form submission failed');
      }

      const postId = formResponse.data.post_id;

      if (selectedImages.length > 0) {
        const imageForm = new FormData();
        imageForm.append('post_id', String(postId));
        imageForm.append('user_id', String(userId));

        selectedImages.forEach((img, index) => {
          let fileUri = img.uri;
          if (!fileUri.startsWith('file://')) fileUri = 'file://' + fileUri;

          imageForm.append('images[]', {
            uri: fileUri,
            type: img.type || 'image/jpeg',
            name: img.name || `business_image_${index}.jpg`
          });
        });

        try {
          const imgResponse = await axios.post(IMAGE_UPLOAD_URL, imageForm, {
            headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' },
            timeout: 60000
          });

          if (!imgResponse.data.success) {
            console.warn('Some images failed to upload:', imgResponse.data.errors);
            showMessage({
              message: "Warning",
              description: "Business saved but some images failed to upload",
              type: "warning",
            });
          }

        } catch (imgErr) {
          console.error('Image upload error:', imgErr);
          showMessage({
            message: "Warning",
            description: "Business saved but image upload failed",
            type: "warning",
          });
        }
      }

      showMessage({
        message: labels.success || "Job details submitted successfully!",
        description: "Your job has been posted successfully",
        type: "success",
      });

      setFormData({ category: '', subcategory: '', child: '', businessName: '', description: '', block: '', district: '' });
      setSelectedImages([]);
      setCategoryValue(null);
      setDistrictValue(null);
      setBlockValue(null);
      setValue(null);
      setAiGenerated(false);

      setTimeout(() => {
        navigation.navigate('MainApp', {
          screen: 'PostJob',
          params: { userId, refresh: true }
        });
      }, 2000);

    } catch (error) {
      console.error('Submission error:', error);
      let errorMessage = labels.submissionFailed || "Submission failed";

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'Network error - please check your connection';
      } else {
        errorMessage = error.message || errorMessage;
      }

      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });

    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  // ✅ If permission not checked yet, show loading
  if (!permissionChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Checking location permission...</Text>
      </View>
    );
  }

  // ✅ If permission denied, show permission required screen
  if (!hasLocationPermission) {
    return (
      <View style={styles.permissionScreen}>
        <StatusBar backgroundColor="#e74c3c" barStyle="light-content" />
        <View style={styles.permissionContainer}>
          <MaterialIcons name="location-off" size={80} color="#e74c3c" />
          <Text style={styles.permissionTitle}>
            Location Permission Required
          </Text>
          <Text style={styles.permissionText}>
            This app needs location access to post jobs and find nearby services.
          </Text>
          <Text style={styles.permissionSubText}>
            Redirecting to settings...
          </Text>
          <ActivityIndicator size="large" color="#e74c3c" style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.screen}>
        <StatusBar backgroundColor="#3498db" barStyle="light-content" />

        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={28} color="#3498db" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{labels.title}</Text>
              <Text style={styles.welcomeText}>
                {labels.welcome}, {user?.name || 'User'}!
              </Text>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.locationSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="my-location" size={22} color="#3498db" />
              <Text style={styles.sectionTitle}>Current Location</Text>
              {locationLoading && (
                <ActivityIndicator size="small" color="#3498db" style={{ marginLeft: 10 }} />
              )}
            </View>

            <View style={styles.coordinateRow}>
              <View style={styles.coordinateInput}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <View style={styles.coordinateDisplay}>
                  <Text style={styles.coordinateText}>{latitude || '--'}</Text>
                </View>
              </View>
              <View style={styles.coordinateInput}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <View style={styles.coordinateDisplay}>
                  <Text style={styles.coordinateText}>{longitude || '--'}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={refreshLocation}
              disabled={locationLoading}
              style={[
                styles.locationButton,
                locationLoading && styles.locationButtonDisabled
              ]}
            >
              <View style={styles.locationButtonContent}>
                {locationLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MaterialIcons name="gps-fixed" size={20} color="#fff" />
                )}
                <Text style={styles.locationButtonText}>
                  {locationLoading ? labels.locationFetching : labels.getLocation}
                </Text>
              </View>
            </TouchableOpacity>

            {locationFetched && (
              <View style={styles.successBadge}>
                <MaterialIcons name="check-circle" size={16} color="#27ae60" />
                <Text style={styles.successText}>Location ready for submission</Text>
              </View>
            )}
          </View>

          {/* Form Sections */}
          <View style={styles.formSection}>
            {/* Business Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{labels.selectCategory}</Text>
              {loading.categories ? (
                <View style={styles.loadingPlaceholder}>
                  <ActivityIndicator size="small" color="#3498db" />
                </View>
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
                  placeholder={labels.chooseCategory || "Select category..."}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  listMode="MODAL"
                  modalProps={{
                    animationType: 'slide',
                  }}
                  modalTitle="Select Category"
                  modalContentContainerStyle={styles.modalContainer}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  zIndex={2000}
                />
              )}
            </View>

            {/* Subcategory */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{labels.selectSubcategory}</Text>
              {loading.subcategories ? (
                <View style={styles.loadingPlaceholder}>
                  <ActivityIndicator size="small" color="#3498db" />
                </View>
              ) : (
                <DropDownPicker
                  items={subcategoryOptions}
                  open={open}
                  setOpen={setOpen}
                  value={value}
                  setValue={setValue}
                  placeholder={labels.chooseSubcategory || "Please select subcategory"}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  listMode="MODAL"
                  modalProps={{ animationType: 'slide' }}
                  modalContentContainerStyle={styles.modalContainer}
                  placeholderStyle={styles.dropdownPlaceholder}
                  onChangeValue={(selected) => {
                    setValue(selected);

                    if (!selected) {
                      handleInputChange('subcategory', '');
                      handleInputChange('child', '');
                      return;
                    }

                    if (selected.startsWith('child_')) {
                      const childId = selected.replace('child_', '');
                      handleInputChange('child', childId);
                    } else if (selected.startsWith('main_')) {
                      const subcategoryId = selected.replace('main_', '');
                      handleInputChange('subcategory', subcategoryId);
                    }
                  }}
                />
              )}
            </View>

            {/* District & Block Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex]}>
                <Text style={styles.inputLabel}>{labels.district}</Text>
                {loading.districts ? (
                  <View style={styles.loadingPlaceholder}>
                    <ActivityIndicator size="small" color="#3498db" />
                  </View>
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
                    modalProps={{ animationType: 'slide' }}
                    modalTitle="Select District"
                    modalContentContainerStyle={styles.modalContainer}
                    textStyle={styles.dropdownText}
                    placeholderStyle={styles.dropdownPlaceholder}
                    zIndex={1500}
                  />
                )}
              </View>

              <View style={[styles.inputGroup, styles.flex, { marginLeft: 10 }]}>
                <Text style={styles.inputLabel}>{labels.block}</Text>
                {loading.blocks ? (
                  <View style={styles.loadingPlaceholder}>
                    <ActivityIndicator size="small" color="#3498db" />
                  </View>
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
                    modalProps={{ animationType: 'slide' }}
                    modalTitle="Select Block"
                    modalContentContainerStyle={styles.modalContainer}
                    textStyle={styles.dropdownText}
                    placeholderStyle={styles.dropdownPlaceholder}
                    zIndex={1000}
                    disabled={!districtValue}
                  />
                )}
              </View>
            </View>

            {/* Business Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{labels.businessName}</Text>
              <TextInput
                style={[
                  styles.input,
                  validationErrors.businessName && styles.errorField
                ]}
                placeholder="Enter your business name"
                value={formData.businessName}
                onChangeText={(text) => handleInputChange('businessName', text)}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{labels.description}</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  validationErrors.description && styles.errorField,
                  aiGenerated && styles.aiGeneratedField
                ]}
                placeholder="Enter business description or use AI to generate one"
                value={formData.description}
                onChangeText={(text) => {
                  handleInputChange('description', text);
                  if (aiGenerated && text !== formData.description) {
                    setAiGenerated(false);
                  }
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* AI Description Button - Below the description box */}
              <TouchableOpacity
                style={[
                  styles.aiButton,
                  aiLoading && styles.aiButtonDisabled,
                  aiGenerated && styles.aiButtonSuccess
                ]}
                onPress={generateAIDescription}
                disabled={aiLoading || !formData.businessName || !categoryValue}
                activeOpacity={0.8}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                )}
                <Text style={styles.aiButtonText}>
                  {aiLoading
                    ? labels.generatingDescription
                    : labels.generateDescription}
                </Text>
              </TouchableOpacity>

              {aiGenerated && (
                <Animated.Text style={[styles.aiGeneratedText, { opacity: fadeAnim }]}>
                  ✅ AI Generated Description (You can edit this)
                </Animated.Text>
              )}
            </View>

            {/* Image Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{labels.selectImage}</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handleImagePick}
              >
                <MaterialIcons name="add-photo-alternate" size={20} color="white" />
                <Text style={styles.imagePickerText}>{labels.selectImage}</Text>
              </TouchableOpacity>
            </View>

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
              style={[
                styles.submitButton,
                (!latitude || !longitude || loading.submitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading.submitting || !latitude || !longitude}
            >
              {loading.submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {labels.submit} {latitude && longitude ? '✓' : ''}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 16,
    paddingTop: 60,
    minHeight: height,
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
  // Permission screen styles
  permissionScreen: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  permissionSubText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 10,
  },
  // Form sections
  formSection: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 8,
  },
  // Location section
  locationSection: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  coordinateInput: {
    width: '48%',
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  coordinateDisplay: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  coordinateText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  locationButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  locationButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  successText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
    marginLeft: 6,
  },
  // Form inputs
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorField: {
    borderColor: '#e74c3c',
    backgroundColor: '#fffafa',
  },
  // Dropdown styles
  dropdown: {
    borderColor: '#e9ecef',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 50,
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    borderColor: '#e9ecef',
    borderRadius: 8,
    borderWidth: 1,
  },
  modalContainer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  dropdownText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  dropdownPlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  loadingPlaceholder: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  // Row layout
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  // AI Description
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8e44ad',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  aiButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  aiButtonSuccess: {
    backgroundColor: '#27ae60',
  },
  aiButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  aiGeneratedField: {
    borderColor: '#27ae60',
    borderWidth: 2,
    backgroundColor: '#f8fff9',
  },
  aiGeneratedText: {
    fontSize: 12,
    color: '#27ae60',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Image picker
  imagePickerButton: {
    backgroundColor: '#3498db',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Submit button
  submitButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});

export default JobDetailsScreen;