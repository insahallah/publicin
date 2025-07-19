import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import RNPickerSelect from 'react-native-picker-select';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { BASE_URL } from './BaseUrl';

// API endpoints
const CATEGORY_API_URL = `${BASE_URL}/api/category_list.php`;
const DISTRICT_API_URL = `${BASE_URL}/api/district_list.php`;
const BLOCK_API_URL = `${BASE_URL}/api/get_blocks.php`;
const UPDATE_BUSSINESS_DATA_URL = `${BASE_URL}/api/update_bussiness_data.php`;
const IMAGE_DELETE_URL = `${BASE_URL}/api/delete_image.php`;

// Language configuration
const languageData = {
  hi: {
    title: '📝 एडिट जॉब डिटेल्स',
    welcome: 'स्वागत है',
    selectCategory: '📂 सलेक्ट कैटेगरी करें',
    selectSubcategory: '🧩 उपश्रेणी चुनें',
    district: '🏞️ जिला',
    block: '🏘️ ब्लॉक',
    village: '🏡 गाँव',
    pin: '📍 पिन कोड',
    businessName: '🏢 व्यवसाय का नाम',
    description: '📝 विवरण',
    selectImage: 'छवियाँ चुनें',
    submit: 'अपडेट करें',
    chooseCategory: 'श्रेणी चुनें...',
    chooseSubcategory: 'उपश्रेणी चुनें...',
    chooseDistrict: 'जिला चुनें...',
    chooseBlock: 'ब्लॉक चुनें...',
    fillAll: 'कृपया सभी फ़ील्ड भरें',
    success: 'नौकरी विवरण सफलतापूर्वक जमा हुआ!',
    submissionFailed: 'जमा करना विफल हुआ',
    removeImage: 'छवि हटाएं',
    removeConfirm: 'क्या आप वाकई इस छवि को हटाना चाहते हैं?',
    cancel: 'रद्द करें',
    remove: 'हटाएं',
    deleteError: 'छवि हटाने में विफल',
    imageGalleryTitle: 'व्यवसाय छवियाँ',
  },
  en: {
    title: '📝Edit Bussiness Details',
    welcome: 'Welcome',
    selectCategory: '📂 Select Business Category',
    selectSubcategory: '🧩 Select Subcategory',
    district: '🏞️ District',
    block: '🏘️ Block',
    village: '🏡 Village',
    pin: '📍 Pin Code',
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
  },
};

const JobEdit = ({ navigation, route }) => {
  const { jobData } = route.params || {};
  const isMounted = useRef(true);
  const [lang, setLang] = useState('en');
  const [labels, setLabels] = useState(languageData.en);
  const L = labels;

  // Form state
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [blockOptions, setBlockOptions] = useState([]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [village, setVillage] = useState(''); // Added village state

  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [userId, setUserId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Track pending values for initialization
  const [pendingSubcategory, setPendingSubcategory] = useState(null);
  const [pendingBlock, setPendingBlock] = useState(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize language and data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage') || 'en';
        setLang(storedLang);
        setLabels(languageData[storedLang]);

        // Load categories
        const categoriesRes = await fetch(
          `${CATEGORY_API_URL}?action=categories&lang=${storedLang}`
        );
        const categoriesJson = await categoriesRes.json();
        
        if (categoriesJson.status === 'success' && isMounted.current) {
          setCategoryOptions(
            categoriesJson.data.map(cat => ({
              label: cat.name,
              value: cat.id.toString(),
            }))
          );
        }
        
        // Load districts
        const districtsRes = await fetch(`${DISTRICT_API_URL}?lang=${storedLang}`);
        const districtsJson = await districtsRes.json();
        
        if (districtsJson.status === 'success' && isMounted.current) {
          setDistrictOptions(
            districtsJson.data.map(d => ({
              label: d.district_name,
              value: d.id.toString(),
            }))
          );
        }
        
        // Initialize form with job data
        if (jobData) {
          setCategory(jobData.category || '');
          setDistrict(jobData.district || '');
          setPendingSubcategory(jobData.subcategory || '');
          setPendingBlock(jobData.block || '');
          setVillage(jobData.village?.trim() || '');
          setBusinessName(jobData.businessName?.trim() || '');
          setDescription(jobData.description || '');
          setUserId(jobData.userId || '');
          
          if (Array.isArray(jobData.images) && isMounted.current) {
            setSelectedImages(
              jobData.images.map(img => ({
                uri: `${BASE_URL}/images/${img.path}`,
                id: img.id,
                isFromServer: true,
              }))
            );
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initializeData();
  }, [jobData]);

  // Load subcategories when category changes
useEffect(() => {
  if (!category) {
    // Reset subcategory and options if no category selected
    setSubcategory(null);
    setSubcategoryOptions([]);
    return;
  }

  const loadSubcategories = async () => {
    try {
      const storedLang = await AsyncStorage.getItem('appLanguage') || 'en';
      const res = await fetch(
        `${CATEGORY_API_URL}?action=subcategories&parent_id=${category}&lang=${storedLang}`
      );
      const json = await res.json();

      if (json.status === 'success' && isMounted.current) {
        const newSubcategories = json.data.map(sub => ({
          label: sub.name,
          value: sub.id.toString(),
        }));

        setSubcategoryOptions(newSubcategories);

        // Set subcategory only if pendingSubcategory exists and is valid
        if (pendingSubcategory && newSubcategories.some(opt => opt.value === pendingSubcategory)) {
          setSubcategory(pendingSubcategory);
          setPendingSubcategory(null);
        } else {
          // Reset subcategory if no valid pending
          setSubcategory(null);
        }
      } else if (isMounted.current) {
        setSubcategoryOptions([]);
        setSubcategory(null);
      }
    } catch (error) {
      console.error('Subcategories error:', error);
      if (isMounted.current) {
        setSubcategoryOptions([]);
        setSubcategory(null);
      }
    }
  };

  loadSubcategories();
}, [category, lang]); // removed pendingSubcategory from dependencies as requested

  // Load blocks when district changes
  useEffect(() => {
    if (!district) return;
    
    const loadBlocks = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage') || 'en';
        const res = await fetch(`${BLOCK_API_URL}?district_id=${district}&lang=${storedLang}`);
        const json = await res.json();
        
        if (json.status === 'success' && isMounted.current) {
          const newBlocks = json.data.map(b => ({
            label: b.block_name,
            value: b.id.toString(),
          }));
          
          setBlockOptions(newBlocks);
          
          // Set pending block if available
          if (pendingBlock && newBlocks.some(opt => opt.value === pendingBlock)) {
            setBlock(pendingBlock);
            setPendingBlock(null);
          }
        } else if (isMounted.current) {
          setBlockOptions([]);
        }
      } catch (error) {
        console.error('Blocks error:', error);
        if (isMounted.current) setBlockOptions([]);
      }
    };

    loadBlocks();
  }, [district, lang, pendingBlock]);

  // Handle image selection
  const handleImagePick = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 0,
      },
      (response) => {
        if (response.didCancel || response.errorCode || !response.assets) return;

        const newImages = response.assets.map(img => ({
          uri: img.uri,
          type: img.type,
          name: img.fileName,
        }));

        if (isMounted.current) {
          setSelectedImages(prev => [...prev, ...newImages]);
        }
      }
    );
  };

  // Handle image removal
  const handleRemoveImage = async (index) => {
    const image = selectedImages[index];
    
    if (!image.isFromServer) {
      const newImages = [...selectedImages];
      newImages.splice(index, 1);
      if (isMounted.current) setSelectedImages(newImages);
      return;
    }

    Alert.alert(
      L.removeImage,
      L.removeConfirm,
      [
        { text: L.cancel, style: 'cancel' },
        {
          text: L.remove,
          style: 'destructive',
          onPress: async () => {
            try {
              const formData = new FormData();
              formData.append('image_id', image.id);

              const response = await axios.post(IMAGE_DELETE_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });

              if (response.data.success && isMounted.current) {
                const newImages = [...selectedImages];
                newImages.splice(index, 1);
                setSelectedImages(newImages);
              } else {
                Alert.alert('Error', response.data.message || L.deleteError);
              }
            } catch (error) {
              console.error('Image delete error:', error);
              Alert.alert('Error', L.deleteError);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Submit form data
  const handleUpdate = async () => {
    if (!category || !subcategory || !businessName || !description || !block || !district || !village) {
      Alert.alert('Error', L.fillAll);
      return;
    }

    setIsUpdating(true);
    
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('subcategory', subcategory);
      formData.append('businessName', businessName);
      formData.append('description', description);
      formData.append('block', block);
      formData.append('village', village); // Added village
      formData.append('district', district);
      formData.append('userId', userId);
      formData.append('jobId', jobData.id);

      // Add new images
      selectedImages.forEach((img) => {
        if (!img.isFromServer) {
          formData.append('images[]', {
            uri: img.uri,
            type: img.type || 'image/jpeg',
            name: img.name || `photo_${Date.now()}.jpg`,
          });
        }
      });

      // Handle deleted images
      const originalServerIds = (jobData.images || []).map(img => img.id);
      const currentServerIds = selectedImages
        .filter(i => i.isFromServer)
        .map(i => i.id);
      const deletedServerImageIds = originalServerIds.filter(
        id => !currentServerIds.includes(id)
      );
      
      if (deletedServerImageIds.length > 0) {
        formData.append('removeImageIds', JSON.stringify(deletedServerImageIds));
      }

      const response = await axios.post(UPDATE_BUSSINESS_DATA_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        Alert.alert('Success', L.success);
        navigation.navigate('MainApp', { 
          screen: 'PostJob', 
          params: { userId } 
        });
      } else {
        Alert.alert('Error', response.data.message || L.submissionFailed);
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', L.submissionFailed);
    } finally {
      if (isMounted.current) setIsUpdating(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <Animatable.View
        animation="fadeInUp"
        duration={600}
        style={styles.card}
      >
        <Text style={styles.title}>{L.title}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{L.welcome}</Text>
          
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{L.selectCategory}</Text>
              <RNPickerSelect
                onValueChange={setCategory}
                items={categoryOptions}
                value={category}
                placeholder={{ label: L.chooseCategory, value: null }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
  <Text style={styles.label}>{L.selectSubcategory}</Text>
 <RNPickerSelect
  onValueChange={(val) => setSubcategory(val ? val.toString() : null)}
  items={subcategoryOptions}
  value={subcategory}
  placeholder={{ label: L.chooseSubcategory, value: null }}
  style={pickerSelectStyles}
  useNativeAndroidPickerStyle={false}
  disabled={!category}
/>
</View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{L.district}</Text>
              <RNPickerSelect
                onValueChange={setDistrict}
                items={districtOptions}
                value={district}
                placeholder={{ label: L.chooseDistrict, value: null }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{L.block}</Text>
              <RNPickerSelect
                onValueChange={setBlock}
                items={blockOptions}
                value={block}
                placeholder={{ label: L.chooseBlock, value: null }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                disabled={!district}
              />
            </View>
          </View>

          {/* Added Village Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{L.village}</Text>
            <TextInput
              style={styles.textInput}
              value={village}
              onChangeText={setVillage}
              placeholder="Enter village name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{L.businessName}</Text>
            <TextInput
              style={styles.textInput}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Your business name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{L.description}</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholder="Describe your business..."
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{L.imageGalleryTitle}</Text>
          <Text style={styles.sectionSubtitle}>{L.selectImage}</Text>
          
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={handleImagePick}
          >
            <Text style={styles.imagePickerText}>+ {L.selectImage}</Text>
          </TouchableOpacity>

          {selectedImages.length > 0 && (
            <View style={styles.imageGallery}>
              {selectedImages.map((img, idx) => (
                <View key={`image-${idx}`} style={styles.imageContainer}>
                  <Image
                    source={{ uri: img.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeIcon}
                    onPress={() => handleRemoveImage(idx)}
                  >
                    <Text style={styles.removeIconText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isUpdating && styles.disabledButton]}
          onPress={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>{L.submit}</Text>
          )}
        </TouchableOpacity>
      </Animatable.View>
    </ScrollView>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 5,
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 5,
  },
  placeholder: {
    color: '#999',
  },
});

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 25,
    color: '#2c3e50',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 10,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495e',
  },
  dropdownWrapper: {
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dropdownIcon: {
    position: 'absolute',
    right: 12,
    top: 18,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#7f8c8d',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    marginTop: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '700',
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    justifyContent: 'flex-start',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
    backgroundColor: '#f1f2f6',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#e74c3c',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  removeIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: -2,
  },
  submitButton: {
    backgroundColor: '#27ae60',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});

export default JobEdit;