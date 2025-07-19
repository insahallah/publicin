import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  PermissionsAndroid, Platform, Modal, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
//import SvgUri from 'react-native-svg-uri';
import { useFocusEffect } from '@react-navigation/native';
import Voice from '@react-native-voice/voice';
import { BASE_URL } from './BaseUrl';
import { DOMAIN_URL } from './BaseUrl';
import VoiceSearchModal from './users/VoiceSearchModal';
const MAIN_SEARCH_URL = `${BASE_URL}api/main-search.php`;

const SearchScreen = ({ route, navigation }) => {
  const { id, categories } = route.params || {};




  const [language, setLanguage] = useState('en');
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [pinCode, setPinCode] = useState(''); // Changed from setPinInput
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [expandedMainCategories, setExpandedMainCategories] = useState({});
  const [expandedSubcategories, setExpandedSubcategories] = useState({});
  const [activeLoadingId, setActiveLoadingId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [loadingCategoryId, setLoadingCategoryId] = useState(null);
  const [CatId, setCatId] = useState(''); // Changed from setPinInput
  const [SearchMainCat, setSearchMainCat] = useState('');

  const numericId = id ? id.replace('cat', '') : '';

  console.log(categoryData);



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
        //       if(!pinCode){
        //       const userPinCode = await AsyncStorage.getItem('pin');
        //       if (pinCode? pinCode: userPinCode) {

        //         setPinCode(userPinCode);
        //       }
        // }
        const lang = await AsyncStorage.getItem('appLanguage');
        if (lang) {
          setLanguage(lang);
        }
      } catch (error) {
        console.error('Error loading AsyncStorage data:', error);
      }
    };

    loadLanguage();
  }, []); // Run only once when component mounts

  // useEffect(() => {
  //   if (language) fetchCategories();
  // }, [language]);

  // Optional: reset logic (if any form state to reset)
  const resetState = () => {
    setCategoryData([]);  // clear existing category data
    setLoading(false);    // reset loading
    // add other resets if needed
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
        console.log(doctorsLabel); // 👉️ Doctors
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
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
              childcategories:
                filteredChildren.length > 0 ? filteredChildren : sub.childcategories,
            };
          }

          return null;
        }).filter((sub) => sub !== null);

        if (matchesMainLabel || filteredSubs.length > 0) {
          return {
            ...cat,
            subcategories:
              filteredSubs.length > 0 ? filteredSubs : cat.subcategories,
          };
        }

        return null;
      })
      .filter((cat) => cat !== null);
  };

  const normalizeText = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, '') // remove special characters
      .replace(/\s+/g, ' ') // collapse multiple spaces
      .trim();

  const searchSuggestions = () => {
    if (filterOpen || searchQuery.trim() === '') return [];

    const query = normalizeText(searchQuery);
    const suggestions = [];

    categoryData.forEach((main) => {
      const mainLabelNorm = normalizeText(main.label || '');

      if (mainLabelNorm.includes(query)) {
        suggestions.push({
          id: `cat${main.id}`,
          label: main.label,
          type: 'main',
        });

      }

      main.subcategories?.forEach((sub) => {
        const subLabelNorm = normalizeText(sub.label || '');

        if (subLabelNorm.includes(query)) {
          suggestions.push({
            id: `${sub.id}`,
            label: sub.label,
            type: 'sub',
            mainId: `cat${main.id}`,
            hasChild: (sub.childcategories || []).length > 0, // ✅ check if child exists
          });
        }

        sub.childcategories?.forEach((child) => {
          const childLabelNorm = normalizeText(child.label || '');

          if (childLabelNorm.includes(query)) {
            suggestions.push({
              id: `${child.id}`,
              label: child.label,
              type: 'child',
              mainId: `cat${main.id}`,
              subId: `sub${sub.id}`,
            });
          }
        });
      });
    });

    return suggestions;
  };

  const onChildCategoryPress = (childId,childCatLable) => {
    console.log(childId);

    navigation.navigate('MainListScreen', {
      ChildId: childId,
   subcategoryLabel: childCatLable
    });

    // do something...
  };



  useFocusEffect(
    useCallback(() => {
      // 1. Collapse everything
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

      // 2. Expand based on route param
      if (route.params?.id) {
        const targetMainId = `cat${route.params.id}`;

        // Delay expansion slightly to avoid race conditions
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
        }, 100); // 100ms delay is a safe default
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
  // import if not already
  const renderCategoryItem = ({ item }) => {
    const hasSubcategories = item.subcategories && item.subcategories.length > 0;
    const isSvg = item.icon?.endsWith('.svg');
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
          {/* <Animated.View style={styles.arrowIcon}>
          <Icon
            name={isExpanded ? 'keyboard-arrow-down' : 'keyboard-arrow-right'}
            size={24}
            color="#6C63FF"
          />
        </Animated.View> */}
          <View style={styles.iconContainer}>
            {item.icon && isSvg ? (
              // <SvgUri
              //   width="25"
              //   height="25"
              //   uri={`${DOMAIN_URL}${item.icon}`} // ✅ use `uri` instead of `source`
              //   onError={(e) => console.warn('SVG load error', e)}
              // />
              <></>
            ) : item.icon ? (
              <Image
                source={{ uri: `${DOMAIN_URL}${item.icon}` }}
                style={styles.categoryIcon}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholderIcon}>

              </View>
            )}
          </View>




          {activeLoadingId === item.id ? (
            <ActivityIndicator size="small" color="#6C63FF" style={{ marginLeft: 10 }} />
          ) : (
            <Text style={styles.categoryLabel}>{item.label}</Text>
          )}

          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{`${item.subcategories?.length || 0}`}</Text>
          </View>
        </TouchableOpacity>

        {/* Subcategories */}
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
                      <Icon
                        name={isSubExpanded ? 'remove' : 'add'}
                        size={18}
                        color="#6C63FF"
                      />
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
                              onChildCategoryPress(child.id,child.label);
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



  // CORRECTED renderSuggestionItem
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        console.log('ITEM:', item);

        const simpleId = item.id?.replace(/^(catcat|sub|child)/, '');
        const cleanId = /^\d+$/.test(simpleId) ? simpleId : '';

        console.log('cleanId:', cleanId);

        let params = {
          pinCode: pinCode !== '' ? pinCode : undefined,
          mainCategoryLabel: `All ${item.label} List`,
        };

        if (item.type === 'main') {
          params.mainCategoryId = cleanId;
        } else if (item.type === 'sub') {
          params.mainCategoryId = item.mainId?.replace(/^cat/, '') || '';
          params.subCategoryId = cleanId;

          if (item.hasChild) return; // Don't navigate if it has children
        } else if (item.type === 'child') {
          params.mainCategoryId = item.mainId?.replace(/^cat/, '') || '';
          params.subCategoryId = item.Id?.replace(/^sub/, '') || '';
          params.childCategoryId = item.id?.replace(/^child/, '') || '';
        }


        console.log('Navigating with:', params);

        if (item.type === 'main') {
          //setMainId(cleanId);

          const mainIdCat = `cat${cleanId}`;

          navigation.navigate('All Categories', { id: mainIdCat });
        } else {
          navigation.navigate('MainListScreen', params);
        }

        setSearchQuery('');
        setShowSuggestions(false);
        Keyboard.dismiss();
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="search" size={16} color="#666" style={{ marginRight: 8 }} />
        <Text style={{ color: '#333' }}>
          {item.label}
        </Text>
      </View>
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#5878DD"
        barStyle="light-content"
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 25, marginLeft: 15 }}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { marginTop: 25 }]}>
          Search Services
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>

          <TouchableOpacity
            onPress={() => {
              if (CatId) navigation.navigate('All Categories');
            }}
            activeOpacity={CatId ? 0.7 : 1}
            disabled={!CatId}
          >
            <Icon
              name={CatId ? 'arrow-back' : 'search'}
              size={20}
              color="#5E7CE2"
              style={styles.searchIcon}
            />
          </TouchableOpacity>


          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${SearchMainCat ? SearchMainCat : 'categories...'}`}
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setSelectedCategory('');
              setSelectedCategoryId(null);
              setShowSuggestions(!filterOpen);
            }}
            onFocus={() => !filterOpen && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          />
          <TouchableOpacity
            onPress={() => {
              setShowSuggestions(false);
              setFilterOpen((prev) => !prev);
              Keyboard.dismiss();
            }}
            style={[
              styles.filterButton,
              filterOpen && styles.filterButtonActive
            ]}
          >
            <Icon
              name="filter-list"
              size={24}
              color={filterOpen ? "#fff" : "#5E7CE2"}
            />
            {filterOpen && <View style={styles.filterIndicator} />}
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <VoiceSearchModal />
          </View>
        </View>

        <Animated.View
          style={[
            styles.filterContainer,
            {
              height: filterHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 60],
              }),
              marginTop: filterHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 12],
              }),
              opacity: filterHeight,
            },
          ]}
        >
          <View style={styles.filterInner}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={20}
                color="#5E7CE2"
                style={styles.locationIcon}
              />
              <TextInput
                style={styles.filterInput}
                placeholder="Enter Pin code or Block name"
                placeholderTextColor="#aaa"
                value={pinCode} // Fixed: was setPinInput
                onChangeText={setPinCode} // Fixed: was setPinInput
                keyboardType="number-pad"
              />
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={onSearchPress}
            >
              <Text style={styles.searchButtonText}>Go</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
      {showSuggestions && searchSuggestions().length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={searchSuggestions()}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={renderSuggestionItem}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
      {selectedCategory ? (
        <View style={styles.selectedCategoryContainer}>
          <Text style={styles.selectedCategoryText}>
            <Text style={{ fontWeight: '500' }}>Filter:</Text> {selectedCategory}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory('');
              setSelectedCategoryId(null);
              setSearchQuery('');
            }}
          >
            <Text style={styles.clearText}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>
          All Categories
        </Text>
        <Text style={styles.resultsCount}>
          {filteredCategories().length} results
        </Text>
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
          extraData={expandedSubcategories} // ✅ Add this line
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search-off" size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>
                No categories found
              </Text>
              <Text style={styles.emptySubtext}>
                Try different search terms
              </Text>
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
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#5878DD',
    paddingVertical: 16,
    paddingHorizontal: 20,

    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4ff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#5E7CE2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  filterButton: {
    padding: 6,
    borderRadius: 20,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#5E7CE2',
    borderRadius: 20,
  },
  filterIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
  },
  filterContainer: {
    overflow: 'hidden',
  },
  filterInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
  },
  locationIcon: {
    marginRight: 10,
  },
  filterInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  searchButton: {
    backgroundColor: '#5E7CE2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    height: 48,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#f5f7ff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 16,
    color: '#4a5568',
    marginLeft: 12,
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedCategoryText: {
    fontSize: 15,
    color: '#4a5568',
    flex: 1,
  },
  clearText: {
    color: '#ef4444',
    fontWeight: '500',
    fontSize: 15,
    marginLeft: 10,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
  },
  resultsCount: {
    fontSize: 14,
    color: '#718096',
  },
  categorySection: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    paddingVertical: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    borderRadius: 8,
  },
  categoryLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
  },
  subcategoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 8,
  },
  subcategoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f4ff',
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 20,
  },
  subcategoryLabel: {
    fontSize: 14,
    color: '#5E7CE2',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#718096',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#a0aec0',
    marginTop: 6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  listContent: {
    paddingBottom: 30,
  }, categorySection: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 24,
    height: 24,
    marginHorizontal: 8,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  subcategoryList: {
    marginTop: 8,
    marginLeft: 30,
  },
  subcategoryItemContainer: {
    marginBottom: 8,
  },
  subcategoryItem: {
    paddingVertical: 4,
  },
  subcategoryLabel: {
    fontSize: 16,
    color: '#2d3748',
  },
  childCategoryItem: {
    paddingLeft: 20,
    paddingVertical: 2,
  },
  childCategoryLabel: {
    fontSize: 14,
    color: '#4a5568',
  }, categorySection: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 24,
    height: 24,
    marginHorizontal: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subcategoryList: {
    paddingLeft: 20,
    marginTop: 5,
  },
  subcategoryItemContainer: {
    marginBottom: 5,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subcategoryLabel: {
    fontSize: 14,
  },
  childCategoryItem: {
    paddingLeft: 20,
    paddingVertical: 2,
  },
  childCategoryLabel: {
    fontSize: 13,
    color: '#444',
  }, categoryContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0FF',
  },
  arrowIcon: {
    marginRight: 8,
    transform: [{ rotate: '0deg' }], // Will be animated on expand
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 8,

    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderIcon: {
    backgroundColor: '#A5A4FF',
  },
  categoryIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#3D3D4E',
  },
  badgeContainer: {
    backgroundColor: '#E9E8FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
  },
  subcategoryList: {
    paddingLeft: 16,
  },
  subcategoryItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
  },
  subcategoryIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  subcategoryLabel: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  childCountBadge: {
    backgroundColor: '#F0F0FF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  childCountText: {
    fontSize: 10,
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  childCategoryContainer: {
    paddingLeft: 32,
    paddingBottom: 8,
  },
  childCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 16,
  },
  childCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A5A4FF',
    marginRight: 12,
  },
  childCategoryLabel: {
    fontSize: 13,
    color: '#666',
  }, modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 25,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 15,
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#5E7CE2',
    borderRadius: 8,
  },
  closeText: {
    color: '#FFF',
  },

});

export default SearchScreen;