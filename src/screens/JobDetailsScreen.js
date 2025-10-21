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
  Alert,
  Easing,
  Share
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JobDetailsScreenTranslator from './langs/JobDetailsScreenTranslator';
import { BASE_URL } from './BaseUrl';

const { width } = Dimensions.get('window');

// Enhanced Image Slider with Smooth Animations
const AutoSlidingImage = ({ images }) => {
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ]).start(() => {
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: false });
        
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          })
        ]).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, images, fadeAnim, scaleAnim]);

  return (
    <View style={styles.imageSliderWrapper}>
      <Animated.View style={[
        styles.animatedImageContainer,
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}>
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
            <View key={idx} style={styles.imageContainer}>
              <Image
                source={{ uri: `${BASE_URL}/images/${imgPath.path}` }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, idx) => (
            <Animated.View 
              key={idx} 
              style={[
                styles.paginationDot,
                idx === currentIndex ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          ))}
        </View>
      )}
      
      {images.length > 1 && (
        <View style={styles.imageCounter}>
          <Text style={styles.imageCounterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
      )}
    </View>
  );
};

// Enhanced Skeleton Loader with Shimmer Effect
const SkeletonLoader = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [shimmerAnim]);

  const shimmerStyle = {
    opacity: shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  return (
    <View style={styles.skeletonCard}>
      <Animated.View style={[styles.skeletonShimmer, shimmerStyle]} />
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonText} />
      <View style={[styles.skeletonText, { width: '80%' }]} />
      <View style={styles.skeletonButton} />
    </View>
  );
};

// Floating Action Button
const FloatingActionButton = ({ onPress, icon, label, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.fabContainer, style]}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.fab, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.fabBackground}>
          <Feather name={icon} size={24} color="#fff" />
        </View>
      </Animated.View>
      {label && (
        <View style={styles.fabLabel}>
          <Text style={styles.fabLabelText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Detail Row Component
const DetailRow = ({ icon, label, value, multiline = false, isContact = false }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Feather name={icon} size={16} color="#5978DD" />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text 
        style={[
          styles.detailValue,
          isContact && styles.contactValue,
          multiline && styles.multilineValue
        ]} 
        numberOfLines={multiline ? 3 : 1}
      >
        {value}
      </Text>
    </View>
  </View>
);

// Job Card Component
const JobCard = ({ job, index, onEdit, onShare, onClose, closingId, navigation, t, MobileUser }) => {
  const {
    id,
    images,
    businessName,
    category_id,
    subcategory_id,
    childcategory_id,
    category_name,
    subcategory_name,
    description,
    block,
    village,
    district,
    pinCode,
    mobile,
    createdAt,
    status,
    user = {}
  } = job;

  const readableDate = createdAt ? new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'N/A';
  
  const statusStr = String(status);
  const isOpen = statusStr === '1';

  // Animation values for card entrance
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [cardAnim, index]);

  const cardStyle = {
    opacity: cardAnim,
    transform: [
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.card, !isOpen && styles.closedCard, cardStyle]}>
      
      {/* Card Header with Blue Background */}
      <View style={styles.cardHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.businessTitle} numberOfLines={1} ellipsizeMode="tail">
            {businessName || 'Untitled Project'}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => onShare(job)}
              style={styles.iconButton}
            >
              <Feather name="share-2" size={18} color="#fff" />
            </TouchableOpacity>
            {isOpen && (
              <TouchableOpacity
                onPress={() => onEdit(job)}
                style={styles.iconButton}
              >
                <Feather name="edit-3" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <Text style={styles.subheading}>
          <Ionicons name="pricetag-outline" size={14} color="rgba(255,255,255,0.8)" /> 
          {` ${category_name || category_id || 'N/A'} • ${subcategory_name || subcategory_id || 'N/A'}`}
        </Text>
      </View>

      {/* Small Red Closed Badge */}
      {!isOpen && (
        <View style={styles.closedBadge}>
          <Ionicons name="close-circle" size={12} color="#fff" />
          <Text style={styles.closedText}>CLOSED</Text>
        </View>
      )}

      {/* Image Section */}
      {images && images.length > 0 ? (
        <AutoSlidingImage images={images} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Feather name="image" size={50} color="#cbd5e1" />
          <Text style={styles.imagePlaceholderText}>No Images Available</Text>
        </View>
      )}

      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge, 
          isOpen ? styles.openStatusBadge : styles.closedStatusBadge
        ]}>
          <Ionicons 
            name={isOpen ? 'checkmark-circle' : 'close-circle'} 
            size={14} 
            color="#fff" 
          />
          <Text style={styles.statusText}>
            {isOpen ? 'OPEN FOR APPLICATIONS' : 'CLOSED'}
          </Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.detailSection}>
        <DetailRow 
          icon="calendar"
          label="Posted On"
          value={readableDate}
        />
        
        <DetailRow 
          icon="file-text"
          label="Description"
          value={description || 'No description provided'}
          multiline
        />
        
        <DetailRow 
          icon="map-pin"
          label="Location"
          value={`${user?.village || 'N/A'} • ${user?.block || 'N/A'} • ${user?.city || 'N/A'}`}
        />
        
        <DetailRow 
          icon="phone"
          label="Contact"
          value={mobile || 'Not provided'}
          isContact
        />
      </View>

      {/* Action Button - Only show for open businesses */}
      {isOpen && (
        <TouchableOpacity
          style={[
            styles.actionButton, 
            closingId === id && styles.disabledButton
          ]}
          onPress={() => onClose(id)}
          disabled={closingId === id}
        >
          <View style={styles.actionButtonBackground}>
            {closingId === id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="lock" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>{t.closeBusiness}</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const PostJobScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lang, setLang] = useState('en');
  const [t, setT] = useState(JobDetailsScreenTranslator['en']);
  const [MobileUser, setUserMobile] = useState();
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Scroll to top function
  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Handle scroll
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollTop(offsetY > 400);
      },
      useNativeDriver: false,
    }
  );

  // Share job function
  const handleShareJob = async (job) => {
    try {
      const shareUrl = `${BASE_URL}/business/${job.id}`;
      const message = `Check out this business: ${job.businessName}\n\n${job.description}\n\nView more: ${shareUrl}`;
      
      await Share.share({
        message: message,
        title: job.businessName,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Edit job function
  const handleEditJob = (job) => {
    navigation.navigate('JobEdit', { jobData: job });
  };

  useEffect(() => {
    const fetchMobile = async () => {
      const mobile = await AsyncStorage.getItem('user_mobile');
      setUserMobile(mobile);
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
      'Close Business',
      'Are you sure you want to permanently close this business? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Business',
          style: 'destructive',
          onPress: async () => {
            try {
              setClosingId(businessId);
              const response = await fetch(`${BASE_URL}/api/close_business.php?id=${businessId}`);
              const result = await response.json();

              if (result.success) {
                await fetchJobs(userId);
                Alert.alert('Success', 'Business closed successfully!');
              } else {
                Alert.alert('Error', result.error || 'Failed to close business');
              }
            } catch (error) {
              console.error('Error closing project:', error);
              Alert.alert('Error', 'Failed to close business');
            } finally {
              setClosingId(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderJobCard = ({ item, index }) => (
    <JobCard
      job={item}
      index={index}
      onEdit={handleEditJob}
      onShare={handleShareJob}
      onClose={handleCloseProject}
      closingId={closingId}
      navigation={navigation}
      t={t}
      MobileUser={MobileUser}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5978DD" />
      
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
              colors={['#5978DD']}
              tintColor="#5978DD"
            />
          }
        >
          <View style={styles.emptyIllustration}>
            <Feather name="briefcase" size={80} color="#cbd5e1" />
          </View>
          <Text style={styles.emptyTitle}>No Businesses Yet</Text>
          <Text style={styles.emptyText}>
            Start by creating your first business listing to showcase your services and reach potential customers.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate(MobileUser ? 'PostJobScreen' : 'LoginScreen')}
          >
            <View style={styles.createButtonBackground}>
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Business</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={jobs}
            renderItem={renderJobCard}
            keyExtractor={(item, index) => `${item.id || index}-${index}`}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#5978DD']}
                tintColor="#5978DD"
              />
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListFooterComponent={<View style={{ height: 30 }} />}
            showsVerticalScrollIndicator={false}
          />

          {/* Scroll to Top FAB */}
          {showScrollTop && (
            <FloatingActionButton
              onPress={scrollToTop}
              icon="arrow-up"
              label="Top"
            />
          )}

          {/* Create New Business FAB */}
          <FloatingActionButton
            onPress={() => navigation.navigate(MobileUser ? 'PostJobScreen' : 'LoginScreen')}
            icon="plus"
            label="Create"
            style={styles.createFab}
          />
        </>
      )}
    </View>
  );
};

// Updated Styles with Blue Color Scheme
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
        shadowColor: '#5978DD',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
        shadowColor: '#5978DD',
      },
    }),
  },
  closedCard: {
    opacity: 0.95,
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#F9C326',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  businessTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  subheading: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  imageSliderWrapper: {
    height: 220,
  },
  animatedImageContainer: {
    flex: 1,
  },
  imageContainer: {
    width: width - 32,
    height: 220,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageCounter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  imagePlaceholder: {
    height: 220,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  // Small Red Closed Badge
  closedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    gap: 4,
  },
  closedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statusContainer: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  openStatusBadge: {
    backgroundColor: '#92D7AF',
  },
  closedStatusBadge: {
    backgroundColor: '#dc2626',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
    color: '#fff',
  },
  detailSection: {
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },
  multilineValue: {
    lineHeight: 20,
  },
  contactValue: {
    color: '#5978DD',
    fontWeight: '600',
  },
  actionButton: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonBackground: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  borderRadius: 12,
  gap: 6,
  
  borderWidth: 1,              // gray border
  borderColor: 'gray',         // gray border color
},
actionButtonText: {
  color: 'red',                // red text
  fontSize: 16,
  fontWeight: 'bold',
},
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: 'red',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIllustration: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 22,
    fontSize: 15,
  },
  createButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#5978DD',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  // FAB Styles
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5978DD',
  },
  fabLabel: {
    position: 'absolute',
    top: -26,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fabLabelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  createFab: {
    bottom: 85,
  },
  // Skeleton styles
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f1f5f9',
    zIndex: 1,
  },
  skeletonHeader: {
    height: 20,
    width: '70%',
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  skeletonImage: {
    height: 180,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
    borderRadius: 10,
    zIndex: 2,
  },
  skeletonText: {
    height: 14,
    backgroundColor: '#e2e8f0',
    marginBottom: 10,
    borderRadius: 6,
    zIndex: 2,
  },
  skeletonButton: {
    height: 44,
    backgroundColor: '#e2e8f0',
    marginTop: 8,
    borderRadius: 10,
    zIndex: 2,
  },
});

export default PostJobScreen;