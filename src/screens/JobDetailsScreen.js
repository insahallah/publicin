import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
  Platform,
  FlatList,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JobDetailsScreenTranslator from './langs/JobDetailsScreenTranslator';
import { BASE_URL } from './BaseUrl';

const { width } = Dimensions.get('window');

// Enhanced Image Slider with Indicators
const AutoSlidingImage = ({ images }) => {
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
    
  const fadeAnim = useRef(new Animated.Value(1)).current;





  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      
      // Fade animation for smoother transition
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: false });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, images, fadeAnim]); // Added fadeAnim to dependencies

  return (
    <View style={styles.imageSliderWrapper}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.floor(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(newIndex);
          }}
        >
          {images.map((imgPath, idx) => (
            <Image
              key={idx}
              source={{ uri: `${BASE_URL}/images/${imgPath.path}` }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* Pagination Indicators */}
      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, idx) => (
            <View 
              key={idx} 
              style={[
                styles.paginationDot,
                idx === currentIndex ? styles.activeDot : null
              ]} 
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Skeleton Loader Component
const SkeletonLoader = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeader} />
    <View style={styles.skeletonImage} />
    <View style={styles.skeletonText} />
    <View style={styles.skeletonText} />
    <View style={styles.skeletonButton} />
  </View>
);

const PostJobScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lang, setLang] = useState('en');
  const [t, setT] = useState(JobDetailsScreenTranslator['en']);
 const [MobileUser, setUserMobile] = useState();



  
 useEffect(() => {
    const fetchMobile = async () => {
      const mobile = await AsyncStorage.getItem('user_mobile');
      setUserMobile(mobile); // Will be null if not logged in
    };
    fetchMobile();
  }, []);

useEffect(() => {
    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage');
        const selectedLang = storedLang || 'en';
        setLang(selectedLang);
        setT(JobDetailsScreenTranslator[selectedLang]);
      } catch (e) {
        console.warn('Failed to load language', e);
      }
    })();
  }, []);


  const loadData = async () => {
    try {
      const id = await AsyncStorage.getItem('id');
      setUserId(id);
      await fetchJobs(id);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fetchJobs = async (user_Id) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/get_business_details.php?id=${user_Id}`);
      const json = await response.json();
      
      // Only update state if data actually changed
      const newJobs = Array.isArray(json) ? json : [];
      setJobs(prevJobs => {
        return JSON.stringify(prevJobs) === JSON.stringify(newJobs) ? prevJobs : newJobs;
      });
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Connection Error', 'Failed to fetch jobs. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs(userId);
  };

  const handleCloseProject = async (businessId) => {
  Alert.alert(
    t.alertCloseTitle, // "Confirm Project Closure" का अनुवाद
    t.alertCloseMessage, // "Are you sure..." का अनुवाद
    [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirmClose,
        style: 'destructive',
        onPress: async () => {
          try {
            setClosingId(businessId);
            const response = await fetch(`${BASE_URL}/api/close_business.php?id=${businessId}`);
            const result = await response.json();

            if (result.success) {
              await fetchJobs(userId);
              Alert.alert(t.closedSuccessTitle, t.closedSuccessMessage);
            } else {
              Alert.alert(t.error, result.error || t.closedError);
            }
          } catch (error) {
            console.error('Error closing project:', error);
            Alert.alert(t.error, t.closedError);
          } finally {
            setClosingId(null);
          }
        },
      },
    ],
    { cancelable: true }
  );
};

  const renderJobCard = ({ item: job, index }) => {
    const {
      id,
      images,
      businessName,
      category,
      subcategory,
      description,
      block,
      village,
      district,
      pinCode,
      mobile,
      created_at,
      status,
      user = {} // Default to empty object
    } = job;

    const readableDate = created_at ? new Date(created_at).toLocaleDateString() : 'N/A';
    const statusStr = String(status);
    const isOpen = statusStr === '1';

    return (
      <View style={[styles.card, !isOpen && styles.closedCard]}>
        <StatusBar backgroundColor="#5878dd" barStyle="light-content" />
        
        {!isOpen && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedText}>{t.statusClosed}</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <Text style={styles.businessTitle} numberOfLines={1} ellipsizeMode="tail">
            {businessName || 'Untitled Project'}
          </Text>
          
          {isOpen && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Job Edit', { jobData: job })}
            >
              <Feather name="edit-3" size={22} color="#4a6fa5" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.subheading}>
          <Ionicons name="pricetag-outline" size={14} color="#6b7280" /> 
          {` ${category || 'N/A'} • ${subcategory || 'N/A'}`}
        </Text>

        {images && images.length > 0 ? (
          <AutoSlidingImage images={images} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="image" size={40} color="#9ca3af" />
            <Text style={styles.imagePlaceholderText}>No Images Available</Text>
          </View>
        )}

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, isOpen ? styles.openStatusBadge : styles.closedStatusBadge]}>
            <Ionicons 
              name={isOpen ? 'checkmark-circle' : 'close-circle'} 
              size={16} 
              color={isOpen ? '#16a34a' : '#dc2626'} 
            />
            <Text style={[styles.statusText, { color: isOpen ? '#16a34a' : '#dc2626' }]}>
           {isOpen ? 'OPEN FOR APPLICATIONS' : t.statusClosed}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailRow}>
            <MaterialIcons name="date-range" size={18} color="#4b5563" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Posted On</Text>
              <Text style={styles.detailValue}>{readableDate}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={18} color="#4b5563" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue} numberOfLines={3}>
                {description || 'No description provided'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color="#4b5563" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {user?.village || 'N/A'} > {user?.block || 'N/A'} > {user?.city || 'N/A'} > Pin: {user?.pin || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={18} color="#4b5563" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Contact</Text>
              <Text style={[styles.detailValue, styles.contactValue]}>
                {mobile || 'Not provided'}
              </Text>
            </View>
          </View>
        </View>

        {isOpen && (
          <TouchableOpacity
            style={[
              styles.actionButton, 
              closingId === id && styles.disabledButton
            ]}
            onPress={() => handleCloseProject(id)}
            disabled={closingId === id}
          >
            {closingId === id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="lock" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>{t.closeBusiness}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#5878dd" />
      
      {loading ? (
        <ScrollView contentContainerStyle={styles.loaderContainer}>
          {[1, 2, 3].map((_, i) => <SkeletonLoader key={i} />)}
        </ScrollView>
      ) : jobs.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0047ab"
            />
          }
        >
          <Feather name="briefcase" size={60} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>{t.title}</Text>
          <Text style={styles.emptyText}>
            {t.discription}
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate(MobileUser ? 'PostJobScreen' : 'LoginScreen')}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.createButtonText}>{t.postButton}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJobCard}
          keyExtractor={(item, index) => `${item.id || index}-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0047ab"
              colors={['#0047ab']}
            />
          }
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      )}
    </View>
  );
};

// Enhanced Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    padding: 16,
    paddingTop: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  closedCard: {
    opacity: 0.9,
    backgroundColor: '#f9fafb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  businessTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  subheading: {
    fontSize: 14,
    color: '#6b7280',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  imageSliderWrapper: {
    height: 220,
    marginBottom: 16,
  },
  image: {
    width: width - 32,
    height: 220,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    margin: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
  },
  imagePlaceholder: {
    height: 220,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  imagePlaceholderText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 14,
  },
  closedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  closedText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  statusContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  openStatusBadge: {
    backgroundColor: '#dcfce7',
  },
  closedStatusBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  detailSection: {
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  contactValue: {
    color: '#2563eb',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#fca5a5',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 8,
    lineHeight: 22,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0047ab',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Skeleton styles
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  skeletonHeader: {
    height: 24,
    width: '70%',
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
    borderRadius: 4,
  },
  skeletonImage: {
    height: 200,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
    borderRadius: 12,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
    borderRadius: 4,
  },
  skeletonButton: {
    height: 48,
    backgroundColor: '#f1f5f9',
    marginTop: 8,
    borderRadius: 12,
  },
});

export default PostJobScreen;