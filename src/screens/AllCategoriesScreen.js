import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL, PROFILE_IMAGE_URL } from './BaseUrl';
import VoiceSearchModal from './users/VoiceSearchModal';

// Import data storage service
import dataStorageService from './services/dataStorage';

const MAIN_SEARCH_URL = `${BASE_URL}api/main-search.php`;

const SearchScreen = ({ route, navigation }) => {
  const { id, categories } = route.params || {};
  const [language, setLanguage] = useState('en');
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [expandedMainCategories, setExpandedMainCategories] = useState({});
  const [expandedSubcategories, setExpandedSubcategories] = useState({});
  const [activeLoadingId, setActiveLoadingId] = useState(null);

  // Data states
  const [businesses, setBusinesses] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [CatId, setCatId] = useState('');
  const [SearchMainCat, setSearchMainCat] = useState('');

  const numericId = id ? id.replace('cat', '') : '';

  // Load data on mount
  useEffect(() => {
    loadStoredData();
    fetchCategories();
  }, []);

  // Load data from AsyncStorage
  const loadStoredData = async () => {
    try {
      setDataLoading(true);
      const [storedBusinesses, storedCategories] = await Promise.all([
        dataStorageService.getAllBusinesses(),
        dataStorageService.getAllCategories(),
      ]);

      setBusinesses(storedBusinesses);
      setAllCategories(storedCategories);
    } catch (error) {
      console.error('Failed to load cached data:', error.message);
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch fresh data and update storage
  const fetchBusinessData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const freshData = await dataStorageService.getData(forceRefresh);

      if (freshData?.data) {
        setBusinesses(freshData.data.businesses || []);
        setAllCategories(freshData.data.categories || []);
      } else {
        await loadStoredData();
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
      await loadStoredData();
    } finally {
      setLoading(false);
    }
  };

  // Search for matching businesses
  const findMatchingBusinesses = (searchText) => {
    if (!searchText.trim() || businesses.length === 0) return [];

    const query = searchText.toLowerCase().trim();
    return businesses
      .filter((business) => {
        const fields = [
          business.business_name,
          business.businessName,
          business.village,
          business.city,
          business.block,
          business.description,
          business.category_name,
          business.subcategory_name,
        ].map((f) => (f || '').toLowerCase());
        return fields.some((f) => f.includes(query));
      })
      .slice(0, 10);
  };

  // Search for matching categories
  const findMatchingCategories = (searchText) => {
    if (!searchText.trim() || allCategories.length === 0) return [];

    const query = searchText.toLowerCase().trim();
    return allCategories
      .filter((category) => {
        const name = (category.name || '').toLowerCase();
        const hiName = (category.hi_name || '').toLowerCase();
        return name.includes(query) || hiName.includes(query);
      })
      .slice(0, 10);
  };

  // Generate search suggestions
  const searchSuggestions = () => {
    if (filterOpen || !searchQuery.trim()) return [];

    const businessMatches = findMatchingBusinesses(searchQuery);
    const categoryMatches = findMatchingCategories(searchQuery);

    const businessSuggestions = businessMatches.map((business) => ({
      id: `business_${business.id}`,
      label: business.business_name || business.businessName,
      type: 'business',
      ...business,
      matchType: 'business',
    }));

    const formattedCategoryMatches = categoryMatches.map((category) => ({
      id: `${category.type || 'main'}_${category.id}`,
      label: category.name,
      hi_name: category.hi_name,
      type: category.type || 'main',
      parent_id: category.parent_id,
      emoji: category.emoji,
      matchType:
        category.type === 'main'
          ? 'category'
          : category.type === 'sub'
          ? 'subcategory'
          : 'childcategory',
    }));

    return [...businessSuggestions, ...formattedCategoryMatches].slice(0, 15);
  };

  const suggestions = useMemo(() => searchSuggestions(), [
    searchQuery,
    filterOpen,
    businesses,
    allCategories,
  ]);

  const renderSuggestionItem = ({ item }) => {
    const isBusiness = item.type === 'business';

    // Handle images array correctly
    const firstImage =
      item.images && Array.isArray(item.images) && item.images.length > 0
        ? item.images[0]?.path || item.images[0]
        : item.images && typeof item.images === 'string'
        ? item.images.split(',')[0]
        : null;

    const imageUrl = firstImage ? `${PROFILE_IMAGE_URL}${firstImage}` : null;
    const businessName = item.businessName || item.business_name || item.label || 'Unnamed Business';
    const location = item.village || item.city || 'Location not available';

    const onPressItem = () => {
  if (isBusiness) {
    // ✅ Convert images to array of {id, path}
    let imageArray = [];
    if (Array.isArray(item.images)) {
      // If already array, check if it contains objects or strings
      imageArray = item.images.map((img, index) =>
        typeof img === 'object'
          ? { id: img.id || index + 1, path: img.path || img }
          : { id: index + 1, path: img }
      );
    } else if (typeof item.images === 'string' && item.images.trim() !== '') {
      // If string, split by comma
      const imageList = item.images.split(',').map(img => img.trim());
      imageArray = imageList.map((img, index) => ({
        id: index + 1,
        path: img,
      }));
    }

    console.log('🖼️ Processed image array:', imageArray);

    navigation.navigate('ViewJobScreen', {
      data: {
        id: item.id,
        businessName,
        category: item.category || item.category_id,
        subcategory: item.subcategory || item.subcategory_id,
        childcategory: item.childcategory || item.childcategory_id,
        pinCode: item.pinCode || item.pin || '',
        images: imageArray, // ✅ Always array format
        latitude: item.latitude,
        longitude: item.longitude,
        description: item.description,
        user_block: item.block || item.user_block,
        district: item.district,
        user_village: item.village || item.user_village,
      },
    });
  } else {
    // ✅ Handle category navigation
    const cleanId = item.id?.toString().replace(/\D/g, ''); // only digits
    if (item.type === 'main') {
      navigation.navigate('All Categories', { id: `cat${cleanId}`, title: item.label });
    } else {
      navigation.navigate('MainListScreen', {
        mainCategoryLabel: item.label,
        [item.type === 'sub' ? 'subCategoryId' : 'childCategoryId']: cleanId,
      });
    }
  }

  // ✅ Reset search
  setSearchQuery('');
  setShowSuggestions(false);
  Keyboard.dismiss();
};

    return (
      <TouchableOpacity
        style={[styles.suggestionItem, isBusiness && styles.businessSuggestionItem]}
        onPress={onPressItem}
      >
        {isBusiness ? (
          <View style={styles.businessSuggestionContent}>
            <View style={styles.businessImageContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.businessImageLarge} resizeMode="cover" />
              ) : (
                <View style={[styles.businessImageLarge, styles.placeholderBusinessImage]}>
                  <Icon name="store" size={22} color="#999" />
                </View>
              )}
            </View>

            <View style={styles.businessInfoContainer}>
              <Text style={styles.businessName} numberOfLines={1}>
                {businessName}
              </Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={12} color="#666" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location}
                </Text>
              </View>
              {item.block && <Text style={styles.blockText}>{item.block}</Text>}
              <Text style={styles.matchTypeText}>
                {item.category_name ? `Category: ${item.category_name}` : 'Business'}
              </Text>
            </View>

            <View style={styles.arrowContainer}>
              <Icon name="chevron-right" size={20} color="#ccc" />
            </View>
          </View>
        ) : (
          <View style={styles.categorySuggestionContent}>
            <View style={styles.suggestionLeft}>
              <Ionicons
                name={item.type === 'main' ? 'apps' : item.type === 'sub' ? 'layers' : 'list'}
                size={16}
                color="#666"
                style={{ marginRight: 8 }}
              />
              <View style={styles.categoryTextContainer}>
                <Text style={styles.suggestionLabel} numberOfLines={1}>
                  {item.label || item.name || 'Unnamed'}
                </Text>
                {item.hi_name && <Text style={styles.hindiName}>{item.hi_name}</Text>}
                <Text style={styles.categoryMatchType}>
                  {item.matchType === 'category'
                    ? 'Main Category'
                    : item.matchType === 'subcategory'
                    ? 'Sub Category'
                    : 'Child Category'}
                </Text>
              </View>
            </View>
            <View style={styles.suggestionRight}>
              <Text style={styles.emojiText}>{item.emoji || '📌'}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Define placeholders based on language
  const placeholders = language === 'hi' 
    ? ['गांव के नाम से खोजें', 'श्रेणी से खोजें', 'शहर के नाम से खोजें', 'नाम से खोजें', 'ब्लॉक से खोजें']
    : ['Search by Village', 'Search by Category', 'Search by City Town', 'Search by Name', 'Search by Block'];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState(placeholders[0]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      if (searchQuery.length > 0) return;

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        const nextIndex = (placeholderIndex + 1) % placeholders.length;
        setAnimatedPlaceholder(placeholders[nextIndex]);
        setPlaceholderIndex(nextIndex);
        slideAnim.setValue(30);
        fadeAnim.setValue(0);
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholderIndex, slideAnim, fadeAnim, searchQuery, language]);

  const filterHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(filterHeight, {
      toValue: filterOpen ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false
    }).start();
  }, [filterOpen]);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const lang = await AsyncStorage.getItem('appLanguage');
        if (lang) {
          setLanguage(lang);
        }
      } catch (error) {
        console.error('Error loading AsyncStorage data:', error);
      }
    };
    loadLanguage();
  }, []);

  const resetState = () => {
    setCategoryData([]);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      setCatId(numericId);
    }, [numericId])
  );

  useEffect(() => {
    if (!categoryData?.length || !numericId) return;
    const mainCategoryId = `cat${numericId}`;
    const mainCat = categoryData.find(cat => cat.id === mainCategoryId);
    if (!mainCat) return;
    setTimeout(() => {
      setExpandedMainCategories(prev => ({
        ...prev,
        [mainCategoryId]: true,
      }));
    }, 100);
  }, [categoryData, numericId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const hi = await AsyncStorage.getItem('appLanguage');
      const response = await axios.get(
        `${MAIN_SEARCH_URL}?lang=${hi}&main_cat_id=${numericId}`
      );
      if (response.data?.status === 'success') {
        setCategoryData(response.data.data.categories);
        const doctorsLabel = response.data.data.categories[0].label;
        setSearchMainCat(doctorsLabel);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Search input handler with better logging
  const handleSearchChange = (text) => {
    console.log('⌨️ Search input changed:', text);
    setSearchQuery(text);
    setSelectedCategory('');
    setSelectedCategoryId(null);
    
    const shouldShowSuggestions = text.length > 0 && !filterOpen;
    console.log('🔍 Should show suggestions:', shouldShowSuggestions);
    setShowSuggestions(shouldShowSuggestions);
  };

  const onSearchPress = async () => {
    Keyboard.dismiss();
    const lang = await AsyncStorage.getItem('appLanguage');
    const isHindi = lang === 'hi';
    const keyword = searchQuery.trim();
    const pin = pinCode ? pinCode.trim() : '';

    if (keyword === '' && !selectedCategoryId) {
      alert(
        isHindi 
          ? 'कृपया नीचे लिस्ट से कोई एक को सिलेक्ट करें या बॉक्स में कुछ लिखें जो खोज रहे हैं।'
          : 'Please select a category from the list or enter a search keyword.'
      );
      return;
    }

    if (filterOpen && pin === '') {
      alert(
        isHindi 
          ? 'कृपया पिन कोड या ब्लॉक नाम दर्ज करें।'
          : 'Please enter a Pin code or Block name.'
      );
      return;
    }

    if (pin === '') {
      alert(
        isHindi 
          ? 'कृपया पिन कोड दर्ज करें।'
          : 'Please enter a Pin code.'
      );
      return;
    }

    navigation.navigate('MainListScreen', {
      searchQuery: keyword,
      pinCode: pin,
      mainCategoryId: selectedCategoryId || null,
    });
  };

  const onCategoryPress = (category) => {
    if (filterOpen) {
      setSelectedCategory(category.label);
      setSelectedCategoryId(category.id);
      setSearchQuery(category.label);
    } else {
      const simpleId = category.id.replace(/^cat/, '');
      const cleanId = parseInt(simpleId, 10).toString();
      navigation.navigate('MainListScreen', {
        mainCategoryId: cleanId,
        mainCategoryLabel: `All ${category.label} List`
      });
    }
  };

  const onSubcategoryPress = (subcategory) => {
    if (filterOpen) {
      setSearchQuery(subcategory.label);
      setSelectedCategory(subcategory.label);
      setSelectedCategoryId(subcategory.id);
      setShowSuggestions(false);
    } else {
      navigation.navigate('MainListScreen', {
        subcategoryId: subcategory.id,
        subcategoryLabel: subcategory.label,
      });
    }
  };

  const filteredCategories = () => {
    return categoryData
      .map((cat) => {
        const matchesMainLabel = cat.label
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const filteredSubs = (cat.subcategories || []).map((sub) => {
          const matchesSubLabel = sub.label
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          const filteredChildren = (sub.childcategories || []).filter((child) => 
            child.label.toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (matchesSubLabel || filteredChildren.length > 0) {
            return {
              ...sub,
              childcategories: filteredChildren.length > 0 ? filteredChildren : sub.childcategories,
            };
          }
          return null;
        }).filter((sub) => sub !== null);

        if (matchesMainLabel || filteredSubs.length > 0) {
          return {
            ...cat,
            subcategories: filteredSubs.length > 0 ? filteredSubs : cat.subcategories,
          };
        }
        return null;
      })
      .filter((cat) => cat !== null);
  };

  const normalizeText = (text) => text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const onChildCategoryPress = (childId, childCatLable) => {
    console.log(childId);
    navigation.navigate('MainListScreen', {
      ChildId: childId,
      subcategoryLabel: childCatLable
    });
  };

  useFocusEffect(
    useCallback(() => {
      const mainCollapse = {};
      const subCollapse = {};
      categoryData.forEach((cat) => {
        mainCollapse[cat.id] = false;
        cat.subcategories?.forEach((sub) => {
          subCollapse[sub.id] = false;
        });
      });
      setExpandedMainCategories(mainCollapse);
      setExpandedSubcategories(subCollapse);

      if (route.params?.id) {
        const targetMainId = `cat${route.params.id}`;
        setTimeout(() => {
          setExpandedMainCategories((prev) => ({
            ...prev,
            [targetMainId]: true,
          }));
          const mainCat = categoryData.find(cat => cat.id === targetMainId);
          if (mainCat?.subcategories?.length > 0) {
            const firstSub = mainCat.subcategories[0]?.id;
            setExpandedSubcategories((prev) => ({
              ...prev,
              [firstSub]: true,
            }));
          }
        }, 100);
      }
    }, [categoryData, route.params?.id])
  );

  const toggleMainCategory = (mainId) => {
    setExpandedMainCategories((prev) => ({
      ...prev,
      [mainId]: !prev[mainId],
    }));
  };

  const toggleSubcategory = (subId) => {
    setExpandedSubcategories((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const renderCategoryItem = ({ item }) => {
    const hasSubcategories = item.subcategories && item.subcategories.length > 0;
    const isExpanded = expandedMainCategories[item.id];

    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity 
          style={styles.categoryHeader} 
          activeOpacity={0.7}
          onPress={async () => {
            if (hasSubcategories) {
              toggleMainCategory(item.id);
            } else {
              setActiveLoadingId(item.id);
              try {
                navigation.navigate('MainListScreen', {
                  mainCategoryId: item.id.replace(/^cat/, ''),
                  pinCode: pinCode !== '' ? pinCode : undefined,
                  mainCategoryLabel: `All ${item.label} List`,
                });
              } finally {
                setActiveLoadingId(null);
              }
            }
          }}
        >
          {activeLoadingId === item.id ? (
            <ActivityIndicator size="small" color="#6C63FF" style={{ marginLeft: 10 }} />
          ) : (
            <Text style={styles.categoryLabel}>{item.label}</Text>
          )}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{`${item.subcategories?.length || 0}`}</Text>
          </View>
        </TouchableOpacity>

        {hasSubcategories && isExpanded && (
          <Animated.View style={styles.subcategoryList}>
            {item.subcategories.map((sub) => {
              const hasChildren = sub.childcategories?.length > 0;
              const isSubExpanded = expandedSubcategories[sub.id];
              return (
                <View key={sub.id} style={styles.subcategoryItemContainer}>
                  <TouchableOpacity 
                    style={styles.subcategoryItem} 
                    activeOpacity={0.8}
                    onPress={() => {
                      if (hasChildren) {
                        toggleSubcategory(sub.id);
                      } else {
                        setActiveLoadingId(sub.id);
                        setTimeout(() => {
                          navigation.navigate('MainListScreen', {
                            mainCategoryId: item.id.replace(/^cat/, ''),
                            subCategoryId: sub.id.replace(/^sub/, ''),
                            pinCode: pinCode !== '' ? pinCode : undefined,
                            mainCategoryLabel: `All ${sub.label} List`,
                          });
                          setActiveLoadingId(null);
                        }, 300);
                      }
                    }}
                  >
                    <Animated.View style={styles.subcategoryIcon}>
                      <Icon name={isSubExpanded ? 'remove' : 'add'} size={18} color="#6C63FF" />
                    </Animated.View>
                    <Text style={styles.subcategoryLabel}>
                      {activeLoadingId === sub.id ? 'Loading...' : sub.label}
                    </Text>
                    {hasChildren && (
                      <View style={styles.childCountBadge}>
                        <Text style={styles.childCountText}>
                          {`${sub.childcategories.length}`}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {hasChildren && isSubExpanded && (
                    <Animated.View style={styles.childCategoryContainer}>
                      {sub.childcategories.map((child) => (
                        <TouchableOpacity 
                          key={child.id} 
                          style={styles.childCategoryItem}
                          onPress={() => {
                            setActiveLoadingId(child.id);
                            setTimeout(() => {
                              onChildCategoryPress(child.id, child.label);
                              setActiveLoadingId(null);
                            }, 300);
                          }}
                          activeOpacity={0.9}
                        >
                          <View style={styles.childCategoryDot} />
                          <Text style={styles.childCategoryLabel}>
                            {activeLoadingId === child.id ? 'Loading...' : child.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </Animated.View>
                  )}
                </View>
              );
            })}
          </Animated.View>
        )}
      </View>
    );
  };

  // Refresh data function
  const handleRefreshData = async () => {
    try {
      await fetchBusinessData(true); // Force refresh
      alert('Data refreshed successfully!');
    } catch (error) {
      alert('Failed to refresh data: ' + error.message);
    }
  };

  // DEBUG: Add test button to check current state
  const debugCurrentState = () => {
    console.log('🐛 DEBUG - Current State:', {
      searchQuery,
      searchQueryLength: searchQuery.length,
      showSuggestions,
      filterOpen,
      businessesCount: businesses.length,
      categoriesCount: allCategories.length,
      dataLoading,
      suggestions: searchSuggestions().length
    });
    
    // Test search with sample query
    const testQuery = 'pan';
    console.log('🧪 Testing search with query:', testQuery);
    const testResults = searchSuggestions();
    console.log('🧪 Test results:', testResults);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5878DD" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 25, marginLeft: 15 }}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { marginTop: 25 }]}>Search Services</Text>
        
        {/* Refresh Button */}
        <TouchableOpacity 
          onPress={handleRefreshData}
          style={{ marginTop: 25, marginRight: 15, padding: 5 }}
        >
          <Icon name="refresh" size={20} color="#fff" />
        </TouchableOpacity>

        {/* DEBUG Button */}
        <TouchableOpacity 
          onPress={debugCurrentState}
          style={{ marginTop: 25, marginRight: 5, padding: 5 }}
        >
          <Icon name="bug-report" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View
  style={[
    styles.searchBox,
    {
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
      borderRadius: 10,
      backgroundColor: '#fff',
    },
  ]}
>
  {/* 🔙 Back / Search Icon */}
  <TouchableOpacity
    onPress={() => {
      if (CatId) navigation.navigate('All Categories');
    }}
    activeOpacity={CatId ? 0.7 : 1}
    disabled={!CatId}
    style={{ padding: 10 }}
  >
    <Animated.View
      style={{
        transform: [{ scale: searchQuery.length > 0 ? 1.1 : 1 }],
      }}
    >
      <Icon
        name={CatId ? 'arrow-back' : 'search'}
        size={20}
        color={searchQuery.length > 0 ? '#4B6EF6' : '#5E7CE2'}
      />
    </Animated.View>
  </TouchableOpacity>

  {/* 🔍 Search Input */}
  <View style={{ flex: 1, position: 'relative' }}>
    <TextInput
      style={[styles.searchInput, { paddingVertical: 12, paddingHorizontal: 10 }]}
      placeholder=""
      value={searchQuery}
      onChangeText={handleSearchChange}
      onFocus={() => {
        console.log('🔍 Search input focused');
        const shouldShow = searchQuery.length > 0;
        setShowSuggestions(shouldShow);
      }}
      onBlur={() => {
        console.log('🔍 Search input blurred');
        setTimeout(() => setShowSuggestions(false), 200);
      }}
    />

    {/* 🌀 Animated Placeholder */}
    {!searchQuery.length && (
      <Animated.Text
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: [
            { translateY: Animated.add(slideAnim, new Animated.Value(-10)) },
            {
              scale: slideAnim.interpolate({
                inputRange: [-30, 0, 30],
                outputRange: [0.8, 1, 0.8],
              }),
            },
          ],
          opacity: fadeAnim,
          color: '#aaa',
        }}
        pointerEvents="none"
      >
        {animatedPlaceholder}
      </Animated.Text>
    )}
  </View>

  {/* 🔁 Reset Button */}
  {searchQuery.length > 0 && (
    <TouchableOpacity
      onPress={() => {
        console.log('🔁 Reset pressed');
        setSearchQuery('');
        setShowSuggestions(false);
        Keyboard.dismiss();
      }}
      style={{
        padding: 8,
        marginRight: 8,
        backgroundColor: '#EEF3FF',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Icon name="refresh" size={20} color="#4B6EF6" />
      <Text style={{ marginLeft: 5, color: '#4B6EF6', fontWeight: '600' }}>Reset</Text>
    </TouchableOpacity>
  )}

  {/* 🎤 Voice Search */}
  <VoiceSearchModal />
</View>


      {/* Data Status Indicator */}
      {dataLoading && (
        <View style={styles.dataStatus}>
          <ActivityIndicator size="small" color="#5878DD" />
          <Text style={styles.dataStatusText}>Loading data...</Text>
        </View>
      )}

      {/* Enhanced Suggestions with smart matching */}
      {showSuggestions && searchSuggestions().length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>
            {language === 'hi' ? 'खोज परिणाम' : 'Search Results'} ({searchSuggestions().length})
          </Text>
          <Text style={styles.dataSourceText}>
            Data: {businesses.length} businesses, {allCategories.length} categories
          </Text>
          <FlatList 
            data={searchSuggestions()}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={renderSuggestionItem}
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionsList}
          />
        </View>
      )}

      {/* DEBUG: Show when suggestions should be visible but aren't */}
      {showSuggestions && searchSuggestions().length === 0 && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            💡 No suggestions found for: "{searchQuery}"
          </Text>
          <Text style={styles.debugSubtext}>
            Businesses: {businesses.length}, Categories: {allCategories.length}
          </Text>
        </View>
      )}

      {selectedCategory ? (
        <View style={styles.selectedCategoryContainer}>
          <Text style={styles.selectedCategoryText}>
            <Text style={{ fontWeight: '500' }}>Filter:</Text> {selectedCategory}
          </Text>
          <TouchableOpacity onPress={() => {
            setSelectedCategory('');
            setSelectedCategoryId(null);
            setSearchQuery('');
          }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>All Categories</Text>
        <Text style={styles.resultsCount}>{filteredCategories().length} results</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#5E7CE2" />
        </View>
      ) : (
        <FlatList 
          data={filteredCategories()}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderCategoryItem}
          extraData={expandedSubcategories}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search-off" size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>No categories found</Text>
              <Text style={styles.emptySubtext}>Try different search terms</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#5878DD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#5E7CE2',
  },
  filterIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff4757',
  },
  dataStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#f1f5f9',
  },
  dataStatusText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
  },
  dataSourceText: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 450,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5878DD',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  suggestionsList: {
    paddingVertical: 5,
  },
  suggestionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  businessSuggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  categorySuggestionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  businessSuggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessImageContainer: {
    marginRight: 12,
  },
  businessImageLarge: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  placeholderBusinessImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  businessInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
    flex: 1,
  },
  blockText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  matchTypeText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
  },
  categoryMatchType: {
    fontSize: 11,
    color: '#8b5cf6',
    marginTop: 2,
  },
  hindiName: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  categoryTextContainer: {
    flex: 1,
  },
  suggestionLabel: {
    color: '#333',
    fontSize: 14,
  },
  suggestionRight: {
    alignItems: 'flex-end',
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    marginHorizontal: 15,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedCategoryText: {
    color: '#1976d2',
    fontSize: 14,
  },
  clearText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  resultsCount: {
    fontSize: 12,
    color: '#64748b',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    width: 25,
    height: 25,
  },
  placeholderIcon: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#e2e8f0',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  badgeContainer: {
    backgroundColor: '#5878DD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  subcategoryList: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  subcategoryItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  subcategoryIcon: {
    marginRight: 12,
  },
  subcategoryLabel: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  childCountBadge: {
    backgroundColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  childCountText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  childCategoryContainer: {
    backgroundColor: '#f1f5f9',
    paddingLeft: 45,
  },
  childCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  childCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
    marginRight: 12,
  },
  childCategoryLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  // Debug styles
  debugContainer: {
    backgroundColor: '#fff3cd',
    marginHorizontal: 15,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  debugText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
  },
  debugSubtext: {
    color: '#856404',
    fontSize: 12,
    marginTop: 4,
  },
});

export default SearchScreen;