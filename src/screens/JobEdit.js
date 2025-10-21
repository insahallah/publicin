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
  PermissionsAndroid,
  Linking,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import { launchImageLibrary } from 'react-native-image-picker'; 
import DropDownPicker from 'react-native-dropdown-picker';
import { showMessage } from "react-native-flash-message";
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import { BASE_URL } from './BaseUrl';

// ===================== API URLs =====================
const CATEGORY_API_URL = `${BASE_URL}/api/category_list.php`;
const DISTRICT_API_URL = `${BASE_URL}/api/district_list.php`;
const BLOCK_API_URL = `${BASE_URL}/api/get_blocks.php`;
const UPDATE_BUSSINESS_DATA_URL = `${BASE_URL}/api/update_bussiness_data.php`;
const IMAGE_DELETE_URL = `${BASE_URL}/api/delete_image.php`;

// ===================== Language Data =====================
const languageData = {
  hi: {
    title: '📝 एडिट जॉब डिटेल्स',
    selectCategory: '📂 सलेक्ट कैटेगरी करें',
    selectSubcategory: '🧩 उपश्रेणी चुनें',
    district: '🏞️ जिला',
    block: '🏘️ ब्लॉक',
    village: '🏡 गाँव',
    businessName: '🏢 व्यवसाय का नाम',
    description: '📝 विवरण',
    selectImage: 'छवियाँ चुनें',
    submit: 'अपडेट करें',
    chooseCategory: 'श्रेणी चुनें...',
    chooseSubcategory: 'उपश्रेणी चुनें...',
    chooseDistrict: 'जिला चुनें...',
    chooseBlock: 'ब्लॉक चुनें...',
    fillAll: 'कृपया सभी फ़ील्ड भरें',
    success: 'जॉब विवरण सफलतापूर्वक जमा हुआ!',
    submissionFailed: 'जमा करना विफल हुआ',
    removeImage: 'छवि हटाएं',
    removeConfirm: 'क्या आप वाकई इस छवि को हटाना चाहते हैं?',
    cancel: 'रद्द करें',
    remove: 'हटाएं',
    deleteError: 'छवि हटाने में विफल',
    imageGalleryTitle: 'व्यवसाय छवियाँ',
    back: 'वापस',
    locationRequired: 'लोकेशन परमिशन आवश्यक',
    getLocation: 'वर्तमान लोकेशन प्राप्त करें',
    locationFetching: 'लोकेशन प्राप्त कर रहे हैं...',
    locationSuccess: 'लोकेशन सफलतापूर्वक प्राप्त हुआ!',
    permissionDenied: 'लोकेशन परमिशन अस्वीकृत',
    redirectingSettings: 'सेटिंग्स पर रीडायरेक्ट हो रहा है...',
    redirectingLogin: 'लॉगिन पर रीडायरेक्ट हो रहा है...',
    useCurrentLocation: 'वर्तमान लोकेशन उपयोग करें',
    useDatabaseLocation: 'डेटाबेस लोकेशन उपयोग करें',
    locationFromDatabase: 'डेटाबेस से लोकेशन',
    locationFromGPS: 'GPS से लोकेशन',
  },
  en: {
    title: '📝 Edit Business Details',
    selectCategory: '📂 Select Business Category',
    selectSubcategory: '🧩 Select Subcategory',
    district: '🏞️ District',
    block: '🏘️ Block',
    village: '🏡 Village',
    businessName: '🏢 Business Name',
    description: '📝 Description',
    selectImage: 'Select Images',
    submit: 'Update',
    chooseCategory: 'Choose a category...',
    chooseSubcategory: 'Choose a subcategory...',
    chooseDistrict: 'Choose district...',
    chooseBlock: 'Choose block...',
    fillAll: 'Please fill all fields',
    success: 'Job details submitted successfully!',
    submissionFailed: 'Submission failed',
    removeImage: 'Remove Image',
    removeConfirm: 'Are you sure you want to remove this image?',
    cancel: 'Cancel',
    remove: 'Remove',
    deleteError: 'Failed to delete image',
    imageGalleryTitle: 'Business Images',
    back: 'Back',
    locationRequired: 'Location permission required',
    getLocation: 'Get Current Location',
    locationFetching: 'Fetching location...',
    locationSuccess: 'Location fetched successfully!',
    permissionDenied: 'Location permission denied',
    redirectingSettings: 'Redirecting to settings...',
    redirectingLogin: 'Redirecting to login...',
    useCurrentLocation: 'Use Current Location',
    useDatabaseLocation: 'Use Database Location',
    locationFromDatabase: 'Location from Database',
    locationFromGPS: 'Location from GPS',
  },
};

// ✅ Function to request location permission
const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to update business details.',
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

// ===================== Main Component =====================
const JobEdit = ({ navigation, route }) => {
  const { jobData } = route.params || {};
  const isMounted = useRef(true);

  // ===================== Language & Labels =====================
  const [lang, setLang] = useState('en');
  const [labels, setLabels] = useState(null);
  const L = labels || languageData.en;

  // ===================== Location State =====================
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);
  const [locationSource, setLocationSource] = useState(''); // 'database' or 'gps'

  // ===================== Dropdown Options =====================
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [blockOptions, setBlockOptions] = useState([]);

  // ===================== Selected Values =====================
  const [category, setCategory] = useState('');
  const [categoryValue, setCategoryValue] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [childcategory, setChildcategory] = useState('');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [village, setVillage] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [userId, setUserId] = useState('');

  // ===================== Dropdown Open States =====================
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  // ===================== Loading States =====================
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingSubcategory, setPendingSubcategory] = useState(null);
  const [pendingBlock, setPendingBlock] = useState(null);

  // ===================== Component Lifecycle =====================
  useEffect(() => { return () => { isMounted.current = false; }; }, []);

  // ===================== Check Location Permission =====================
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // ✅ Load database location when component mounts
  useEffect(() => {
    if (jobData?.latitude && jobData?.longitude) {
      setLatitude(jobData.latitude.toString());
      setLongitude(jobData.longitude.toString());
      setLocationSource('database');
      setLocationFetched(true);
    }
  }, [jobData]);

  // ✅ Check location permission and handle flow
  const checkLocationPermission = async () => {
    const hasPermission = await requestLocationPermission();
    setPermissionChecked(true);
    
    if (hasPermission) {
      setHasLocationPermission(true);
    } else {
      setHasLocationPermission(false);
      showMessage({
        message: L.locationRequired || "Location permission required",
        description: L.redirectingSettings || "Redirecting to settings...",
        type: "warning",
        duration: 4000,
      });

      // Redirect to settings after 4 seconds
      setTimeout(() => {
        Linking.openSettings().then(() => {
          // Check permission again when user returns from settings
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
      showMessage({
        message: "Permission granted!",
        description: "You can now fetch your current location",
        type: "success",
      });
    } else {
      showMessage({
        message: L.permissionDenied || "Location permission denied",
        description: L.redirectingLogin || "Redirecting to login...",
        type: "danger",
        duration: 3000,
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigation.replace('LoginScreen');
      }, 3000);
    }
  };

  // ✅ Function to get current location from GPS
  const getCurrentLocation = () => {
    if (!hasLocationPermission) {
      showMessage({
        message: L.locationRequired || "Location permission required",
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
        setLocationSource('gps');
        
        showMessage({
          message: L.locationSuccess || "Location fetched successfully!",
          description: `Lat: ${lat.substring(0, 8)}, Lng: ${lng.substring(0, 8)}`,
          type: "success",
        });
        
        console.log('Location fetched from GPS:', { latitude: lat, longitude: lng });
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

  // ✅ Function to use database location
  const useDatabaseLocation = () => {
    if (jobData?.latitude && jobData?.longitude) {
      setLatitude(jobData.latitude.toString());
      setLongitude(jobData.longitude.toString());
      setLocationSource('database');
      setLocationFetched(true);
      
      showMessage({
        message: "Database Location Loaded",
        description: "Using location from database records",
        type: "info",
      });
    } else {
      showMessage({
        message: "No Database Location",
        description: "No location found in database records",
        type: "warning",
      });
    }
  };

  // ✅ Manual location refresh function
  const refreshLocation = () => {
    getCurrentLocation();
  };

  // ===================== Initialization =====================
  useEffect(() => {
    const initializeData = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage') || 'en';
        setLang(storedLang);
        setLabels(languageData[storedLang]);

        // Fetch Categories
        const categoriesRes = await fetch(`${CATEGORY_API_URL}?action=categories&lang=${storedLang}`);
        const categoriesJson = await categoriesRes.json();
        if (categoriesJson.status === 'success' && isMounted.current) {
          const options = categoriesJson.data.map(cat => ({
            label: cat.name,
            value: cat.id.toString(),
          }));
          setCategoryOptions(options);

          if (jobData?.category_id) {
            const catId = jobData.category_id.toString();
            setCategoryValue(catId);
            setCategory(catId);
            setPendingSubcategory(jobData.subcategory_id?.toString() || '');
          }
        }

        // Fetch Districts
        const districtsRes = await fetch(`${DISTRICT_API_URL}?lang=${storedLang}`);
        const districtsJson = await districtsRes.json();
        if (districtsJson.status === 'success' && isMounted.current) {
          setDistrictOptions(districtsJson.data.map(d => ({
            label: d.district_name,
            value: d.id.toString(),
          })));
        }

        // Pre-fill job data
        if (jobData && isMounted.current) {
          setPendingBlock(jobData.block || '');
          setVillage(jobData.user.village?.trim() || '');
          setBusinessName(jobData.businessName?.trim() || '');
          setDescription(jobData.description || '');
          setChildcategory(jobData.childcategory_id?.toString() || '');
          setUserId(jobData.userId || '');
          setDistrict(jobData.district?.toString() || '');
          
          // Set location from database if available
          if (jobData.latitude && jobData.longitude) {
            setLatitude(jobData.latitude.toString());
            setLongitude(jobData.longitude.toString());
            setLocationSource('database');
            setLocationFetched(true);
          }
          
          if (Array.isArray(jobData.images)) {
            setSelectedImages(jobData.images.map(img => ({
              uri: `${BASE_URL}/images/${img.path}`,
              id: img.id,
              isFromServer: true,
            })));
          }
        }

      } catch (error) {
        console.error('Initialization error:', error);
        showMessage({
          message: "Error",
          description: "Failed to load initial data",
          type: "danger",
        });
      }
    };
    initializeData();
  }, [jobData]);

  // ===================== Load Subcategories =====================
  useEffect(() => {
    if (!category) { setSubcategoryOptions([]); setSubcategory(''); setChildcategory(''); return; }

    const loadSubcategories = async () => {
      try {
        setLoadingSubcategories(true);
        const langStored = (await AsyncStorage.getItem('appLanguage')) || 'en';
        const res = await fetch(`${CATEGORY_API_URL}?action=subcategories&parent_id=${category}&lang=${langStored}`);
        const json = await res.json();

        if (json.status === 'success' && isMounted.current) {
          const options = [];
          let preselectedSubcategory = '';
          let preselectedChildcategory = '';

          json.data.forEach((sub) => {
            if (sub.children?.length > 0) {
              options.push({ label: sub.name, value: `parent_${sub.id}`, disabled: true, type: 'subcategory' });
              sub.children.forEach((child) => {
                options.push({
                  label: `   └ ${child.name}`,
                  value: `child_${child.id}`,
                  disabled: false,
                  type: 'child',
                  parent_id: sub.id.toString(),
                  child_id: child.id.toString()
                });
                if (child.id.toString() === jobData?.childcategory_id?.toString() && category === jobData?.category_id?.toString()) {
                  preselectedSubcategory = sub.id.toString();
                  preselectedChildcategory = child.id.toString();
                }
              });
            } else {
              options.push({ label: sub.name, value: `sub_${sub.id}`, disabled: false, type: 'subcategory', sub_id: sub.id.toString() });
              if (sub.id.toString() === jobData?.subcategory_id?.toString() && category === jobData?.category_id?.toString()) {
                preselectedSubcategory = sub.id.toString();
              }
            }
          });

          setSubcategoryOptions(options);
          if (category === jobData?.category_id?.toString()) {
            setSubcategory(preselectedSubcategory);
            setChildcategory(preselectedChildcategory);
          } else {
            setSubcategory(''); setChildcategory('');
          }
        } else {
          setSubcategoryOptions([]); setSubcategory(''); setChildcategory('');
        }
      } catch (e) {
        console.error('Subcategories error:', e);
        setSubcategoryOptions([]); setSubcategory(''); setChildcategory('');
      } finally { if (isMounted.current) setLoadingSubcategories(false); }
    };

    loadSubcategories();
  }, [category]);

  // ===================== Load Blocks =====================
  useEffect(() => {
    if (!district) { setBlockOptions([]); setBlock(''); return; }

    const loadBlocks = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage') || 'en';
        const res = await fetch(`${BLOCK_API_URL}?district_id=${district}&lang=${storedLang}`);
        const json = await res.json();

        if (json.status === 'success' && isMounted.current) {
          const options = json.data.map(b => ({ label: b.block_name, value: b.id.toString() }));
          setBlockOptions(options);

          if (pendingBlock && options.some(o => o.value === pendingBlock)) { setBlock(pendingBlock); }
          else { if (!options.some(o => o.value === block)) setBlock(''); }

          setPendingBlock(null);
        } else { setBlockOptions([]); setBlock(''); }
      } catch (error) { console.error('Blocks error:', error); setBlockOptions([]); setBlock(''); }
    };

    loadBlocks();
  }, [district, pendingBlock]);

  // ===================== Handlers =====================
  const handleCategoryChange = (value) => { setCategoryValue(value); setCategory(value); setSubcategory(''); setChildcategory(''); setSubcategoryOptions([]); };

  const handleSubcategoryChange = (value) => {
    const selectedOption = subcategoryOptions.find(opt => opt.value === value);
    if (!selectedOption || selectedOption.disabled) return;
    if (selectedOption.type === 'child') { setSubcategory(selectedOption.parent_id); setChildcategory(selectedOption.child_id); }
    else { setSubcategory(selectedOption.sub_id); setChildcategory(''); }
  };

  const handleImagePick = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 1, selectionLimit: 0 }, (response) => {
      if (response.didCancel || response.errorCode || !response.assets) return;
      const newImages = response.assets.map(img => ({ uri: img.uri, type: img.type, name: img.fileName }));
      if (isMounted.current) setSelectedImages(prev => [...prev, ...newImages]);
      
      showMessage({
        message: "Images Added",
        description: `${response.assets.length} image(s) added successfully`,
        type: "success",
      });
    });
  };

  const handleRemoveImage = async (index) => {
    const image = selectedImages[index];
    if (!image.isFromServer) {
      const newImages = [...selectedImages];
      newImages.splice(index, 1);
      setSelectedImages(newImages);
      showMessage({
        message: "Image Removed",
        description: "Image removed successfully",
        type: "info",
      });
      return;
    }

    // Show confirmation for server images
    showMessage({
      message: L.removeImage,
      description: L.removeConfirm,
      type: "warning",
      duration: 5000,
      onPress: () => {
        // User pressed the message - proceed with deletion
        deleteServerImage(image, index);
      }
    });
  };

  const deleteServerImage = async (image, index) => {
    try {
      const formData = new FormData();
      formData.append('image_id', image.id);
      const response = await axios.post(IMAGE_DELETE_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success && isMounted.current) {
        const newImages = [...selectedImages];
        newImages.splice(index, 1);
        setSelectedImages(newImages);

        showMessage({
          message: "Success!",
          description: "Image removed successfully.",
          type: "success",
        });
      } else {
        showMessage({
          message: "Oops!",
          description: response.data.message || L.deleteError,
          type: "danger",
        });
      }
    } catch (error) {
      console.error('Image delete error:', error);
      showMessage({
        message: "Oops!",
        description: L.deleteError,
        type: "danger",
      });
    }
  };

  const handleUpdate = async () => {
    // Check location permission before submission
    if (!hasLocationPermission) {
      showMessage({
        message: L.locationRequired || "Location permission required",
        description: "Please enable location to update business details",
        type: "warning",
      });
      return;
    }

    // Check if location is available
    if (!latitude || !longitude) {
      showMessage({
        message: "Location not available",
        description: "Please select location source (Database or GPS)",
        type: "warning",
      });
      return;
    }

    // Fix validation: subcategory = 0 is allowed if childcategory exists
    if (
      !category ||
      ((!subcategory && subcategory !== 0) && !(childcategory && childcategory !== '0')) ||
      !businessName ||
      !description ||
      !block ||
      !district ||
      !village
    ) {
      showMessage({
        message: "Oops!",
        description: L.fillAll,
        type: "danger",
      });
      return;
    }

    // Determine final subcategory and childcategory values
    let finalSubcategory = subcategory; // default
    let finalChildcategory = childcategory || 0; // if empty, set 0

    // If childcategory has an ID, subcategory should be 0
    if (childcategory && childcategory !== '0') {
      finalSubcategory = 0;
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('category', category);
    formData.append('subcategory', finalSubcategory);
    formData.append('childcategory', finalChildcategory);
    formData.append('businessName', businessName);
    formData.append('description', description);
    formData.append('block', block);
    formData.append('village', village || '');
    formData.append('district', district);
    formData.append('userId', userId);
    formData.append('jobId', jobData.id);
    // ✅ Add location to form data automatically
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);

    console.log('Updating business with location:', { 
      latitude, 
      longitude, 
      source: locationSource 
    });

    // Append new images
    selectedImages.forEach(img => {
      if (!img.isFromServer) {
        formData.append('images[]', {
          uri: img.uri,
          type: img.type || 'image/jpeg',
          name: img.name || `photo_${Date.now()}.jpg`,
        });
      }
    });

    // Handle deleted server images
    const originalServerIds = (jobData.images || []).map(img => img.id);
    const currentServerIds = selectedImages.filter(i => i.isFromServer).map(i => i.id);
    const deletedServerIds = originalServerIds.filter(id => !currentServerIds.includes(id));
    if (deletedServerIds.length > 0) {
      formData.append('removeImageIds', JSON.stringify(deletedServerIds));
    }

    try {
      setIsUpdating(true);
      const response = await axios.post(UPDATE_BUSSINESS_DATA_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        showMessage({
          message: "Success!",
          description: L.success,
          type: "success",
        });
        navigation.navigate('MainApp', { screen: 'PostJob', params: { userId } });
      } else {
        showMessage({
          message: "Oops!",
          description: response.data.message || L.submissionFailed,
          type: "danger",
        });
      }
    } catch (err) {
      console.error(err);
      showMessage({
        message: "Error",
        description: L.submissionFailed,
        type: "danger",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBack = () => { navigation.goBack(); };

  // ===================== Loader =====================
  if (!permissionChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Checking location permission...</Text>
      </View>
    );
  }

  if (!hasLocationPermission) {
    return (
      <View style={styles.permissionScreen}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📍</Text>
          <Text style={styles.permissionTitle}>
            Location Permission Required
          </Text>
          <Text style={styles.permissionText}>
            This app needs location access to update business details.
          </Text>
          <Text style={styles.permissionSubText}>
            Redirecting to settings...
          </Text>
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  if (!labels) {
    return <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.screen} 
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animatable.View 
        animation="fadeInUp" 
        duration={800} 
        style={styles.card}
      >
        {/* Header Section with Back Button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonIcon}>←</Text>
            <Text style={styles.backButtonText}>{L.back}</Text>
          </TouchableOpacity>
          <View style={styles.header}>
            <Text style={styles.title}>{L.title}</Text>
            <View style={styles.titleUnderline} />
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Location Coordinates</Text>
            <Text style={styles.sectionIcon}>📍</Text>
          </View>
          
          <View style={styles.locationSection}>
            {/* Location Source Indicator */}
            {locationSource && (
              <View style={[
                styles.locationSourceBadge,
                locationSource === 'database' ? styles.databaseBadge : styles.gpsBadge
              ]}>
                <Text style={styles.locationSourceText}>
                  {locationSource === 'database' ? L.locationFromDatabase : L.locationFromGPS}
                </Text>
              </View>
            )}
            
            <View style={styles.coordinateRow}>
              <View style={styles.coordinateInput}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Latitude"
                  value={latitude}
                  onChangeText={setLatitude}
                  editable={true}
                />
              </View>
              <View style={styles.coordinateInput}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Longitude"
                  value={longitude}
                  onChangeText={setLongitude}
                  editable={true}
                />
              </View>
            </View>
            
            {/* Location Action Buttons */}
            <View style={styles.locationButtonsContainer}>
              <TouchableOpacity 
                onPress={useDatabaseLocation} 
                style={[styles.locationButton, styles.databaseButton]}
                disabled={!jobData?.latitude || !jobData?.longitude}
              >
                <View style={styles.locationButtonContent}>
                  <Text style={styles.locationButtonIcon}>💾</Text>
                  <Text style={styles.locationButtonText}>
                    {L.useDatabaseLocation}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={refreshLocation} 
                disabled={locationLoading}
                style={[styles.locationButton, styles.gpsButton]}
              >
                <View style={styles.locationButtonContent}>
                  {locationLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.locationButtonIcon}>📍</Text>
                  )}
                  <Text style={styles.locationButtonText}>
                    {locationLoading ? L.locationFetching : L.useCurrentLocation}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {locationFetched && (
              <Text style={styles.locationStatus}>
                ✅ Location ready for update ({locationSource === 'database' ? 'From Database' : 'From GPS'})
              </Text>
            )}
          </View>
        </View>

        {/* Rest of your existing components remain the same */}
        {/* Category & Subcategory Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Category</Text>
            <Text style={styles.sectionIcon}>🏷️</Text>
          </View>
          
          <View style={styles.dropdownRow}>
            <View style={styles.dropdownColumn}>
              <Text style={styles.label}>{L.selectCategory}</Text>
              <DropDownPicker
                open={categoryOpen}
                setOpen={setCategoryOpen}
                value={categoryValue}
                setValue={handleCategoryChange}
                items={categoryOptions}
                placeholder="Choose Category"
                style={[styles.dropdown, categoryOpen && styles.dropdownFocused]}
                dropDownContainerStyle={styles.dropdownContainer}
                listMode="MODAL"
                modalProps={{ animationType: 'slide' }}
                modalTitle="Select Category"
                modalContentContainerStyle={styles.modalContainer}
                textStyle={styles.dropdownText}
                placeholderStyle={styles.placeholderStyle}
                zIndex={3000}
              />
            </View>

            <View style={styles.dropdownColumn}>
              <Text style={styles.label}>{L.selectSubcategory}</Text>
              {loadingSubcategories ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : (
              <DropDownPicker
                open={subcategoryOpen}
                setOpen={setSubcategoryOpen}
                value={
                  childcategory
                    ? `child_${childcategory}`
                    : subcategory
                    ? `sub_${subcategory}`
                    : null
                }
                setValue={(callback) => {
                  const val = callback();
                  if (!val) {
                    setSubcategory('');
                    setChildcategory('');
                    return;
                  }
                  const selectedOption = subcategoryOptions.find(opt => opt.value === val);
                  if (!selectedOption || selectedOption.disabled) return;

                  if (selectedOption.type === 'child') {
                    setSubcategory(selectedOption.parent_id);
                    setChildcategory(selectedOption.child_id);
                  } else {
                    setSubcategory(selectedOption.sub_id);
                    setChildcategory('');
                  }
                }}
                items={subcategoryOptions}
                placeholder="Choose Subcategory"
                style={[
                  styles.dropdown,
                  subcategoryOpen && styles.dropdownFocused,
                  !categoryValue && styles.dropdownDisabled
                ]}
                dropDownContainerStyle={styles.dropdownContainer}
                listMode="MODAL"
                modalProps={{ animationType: 'slide' }}
                modalTitle="Select Subcategory"
                modalContentContainerStyle={styles.modalContainer}
                textStyle={styles.dropdownText}
                placeholderStyle={styles.placeholderStyle}
                zIndex={2500}
                disabled={!categoryValue}
              />
              )}
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Location</Text>
            <Text style={styles.sectionIcon}>📍</Text>
          </View>

          <View style={styles.locationGrid}>
            <View style={styles.locationColumn}>
              <Text style={styles.label}>{L.district}</Text>
              <DropDownPicker
                open={districtOpen}
                setOpen={setDistrictOpen}
                value={district}
                setValue={(value) => {
                  setDistrict(value);
                  if (value !== district) {
                    setBlock('');
                  }
                }}
                items={districtOptions}
                placeholder="Choose District"
                style={[styles.dropdown, districtOpen && styles.dropdownFocused]}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
                placeholderStyle={styles.placeholderStyle}
                listItemLabelStyle={styles.listItemLabelStyle}
                listMode="MODAL"
                modalProps={{ animationType: 'slide' }}
                modalTitle="Select District"
                modalContentContainerStyle={styles.modalContainer}
                zIndex={2000}
              />
            </View>

            <View style={styles.locationColumn}>
              <Text style={styles.label}>{L.block}</Text>
              <DropDownPicker
                open={blockOpen}
                setOpen={setBlockOpen}
                value={block}
                setValue={setBlock}
                items={blockOptions}
                placeholder="Choose Block"
                style={[
                  styles.dropdown,
                  blockOpen && styles.dropdownFocused,
                  !district && styles.dropdownDisabled
                ]}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
                placeholderStyle={styles.placeholderStyle}
                listItemLabelStyle={styles.listItemLabelStyle}
                listMode="MODAL"
                modalProps={{ animationType: 'slide' }}
                modalTitle="Select Block"
                modalContentContainerStyle={styles.modalContainer}
                zIndex={1500}
                disabled={!district}
              />
            </View>
          </View>

          <View style={styles.villageContainer}>
            <Text style={styles.label}>{L.village}</Text>
            <TextInput 
              style={styles.textInput} 
              value={village} 
              onChangeText={setVillage} 
              placeholder="Enter village name" 
              placeholderTextColor="#999" 
            />
          </View>
        </View>

        {/* Business Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Details</Text>
            <Text style={styles.sectionIcon}>💼</Text>
          </View>

          <View style={styles.businessInfo}>
            <Text style={styles.label}>{L.businessName}</Text>
            <TextInput 
              style={styles.textInput} 
              value={businessName} 
              onChangeText={setBusinessName} 
              placeholder="Your business name" 
              placeholderTextColor="#999" 
            />

            <Text style={styles.label}>{L.description}</Text>
            <TextInput 
              style={[styles.textInput, styles.multilineInput]} 
              value={description} 
              onChangeText={setDescription} 
              multiline 
              numberOfLines={4} 
              placeholder="Describe your business..." 
              placeholderTextColor="#999" 
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Image Gallery Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{L.imageGalleryTitle}</Text>
            <Text style={styles.sectionIcon}>🖼️</Text>
          </View>

          <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePick}>
            <View style={styles.imagePickerContent}>
              <Text style={styles.imagePickerIcon}>+</Text>
              <Text style={styles.imagePickerText}>{L.selectImage}</Text>
            </View>
          </TouchableOpacity>

          {selectedImages.length > 0 && (
            <View style={styles.imageGallery}>
              <Text style={styles.imageCount}>
                {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imageScrollView}
              >
                {selectedImages.map((img, idx) => (
                  <View key={`image-${idx}`} style={styles.imageContainer}>
                    <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeIcon} onPress={() => handleRemoveImage(idx)}>
                      <Text style={styles.removeIconText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, (isUpdating || !latitude || !longitude) && styles.disabledButton]} 
          onPress={handleUpdate} 
          disabled={isUpdating || !latitude || !longitude}
        >
          {isUpdating ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitButtonText}>Updating...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              {L.submit} {latitude && longitude ? '✓' : ''}
            </Text>
          )}
        </TouchableOpacity>
      </Animatable.View>
    </ScrollView>
  );
};

// ===================== Styles =====================
const styles = StyleSheet.create({
  screen: { 
    flexGrow: 1, 
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 24, 
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContainer: {
    marginBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  backButtonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  header: {
    alignItems: 'center',
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  section: { 
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#334155',
  },
  sectionIcon: {
    fontSize: 20,
  },
  // Location Section Styles
  locationSection: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  locationSourceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  databaseBadge: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1,
  },
  gpsBadge: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  locationSourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  coordinateInput: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  locationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  databaseButton: {
    backgroundColor: '#2196f3',
  },
  gpsButton: {
    backgroundColor: '#4caf50',
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  locationButtonIcon: {
    fontSize: 16,
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  locationStatus: {
    fontSize: 14,
    color: '#27ae60',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Loading and Permission Screens
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    alignItems: 'center',
    padding: 40,
  },
  permissionIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'center',
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
  // Existing Styles
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownColumn: {
    flex: 1,
  },
  locationGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  locationColumn: {
    flex: 1,
  },
  villageContainer: {
    marginTop: 8,
  },
  businessInfo: {
    gap: 16,
  },
  label: { 
    fontSize: 16, 
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdown: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  dropdownFocused: {
    borderColor: '#007AFF',
    backgroundColor: '#f8faff',
  },
  dropdownDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  dropdownContainer: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  placeholderStyle: {
    color: '#94a3b8',
    fontSize: 16,
  },
  listItemLabelStyle: {
    fontSize: 16,
    color: '#1e293b',
  },
  modalContainer: {
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
  },
  textInput: { 
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1e293b',
    fontWeight: '500',
  },
  multilineInput: { 
    minHeight: 120,
    paddingTop: 16,
  },
  imagePickerButton: { 
    backgroundColor: '#f1f5f9', 
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  imagePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerIcon: { 
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  imagePickerText: { 
    color: '#007AFF', 
    fontWeight: '600',
    fontSize: 16,
  },
  imageGallery: { 
    marginTop: 16,
  },
  imageCount: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '500',
  },
  imageScrollView: {
    marginHorizontal: -4,
  },
  imageContainer: { 
    position: 'relative', 
    margin: 4,
  },
  imagePreview: { 
    width: 100, 
    height: 100, 
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  removeIcon: { 
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: '#ef4444', 
    borderRadius: 12, 
    width: 24, 
    height: 24, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  removeIconText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold',
    lineHeight: 20,
  },
  submitButton: { 
    backgroundColor: '#007AFF', 
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 18,
    textAlign: 'center',
  },
  disabledButton: { 
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default JobEdit;