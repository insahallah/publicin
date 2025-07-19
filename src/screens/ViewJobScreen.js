import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Linking,
  useWindowDimensions,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import LinearGradient from 'react-native-linear-gradient';
import ViewJobScreenTranslator from './langs/viewJobScreenTranslator';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from './BaseUrl';
import { PROFILE_IMAGE_URL } from './BaseUrl';

const ViewJobScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { data } = route.params || {};

  console.log(data);

  // State for reviews data
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
    const [lang, setLang] = useState('en');
  const [t, setT] = useState(ViewJobScreenTranslator['en']);

  // Fetch reviews on component mount

  useEffect(() => {
    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage');

        console.log(storedLang);
        const selectedLang = storedLang || 'en';
        setLang(selectedLang);
        setT(ViewJobScreenTranslator[selectedLang]);
      } catch (e) {
        console.warn('Failed to load language', e);
      }
    })();
  }, []);
  useEffect(() => {
    if (data?.id) {
      fetch(`${BASE_URL}api/users/get_reviews_for_one_bussiness.php?business_id=${data.id}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.reviews) {
            setReviews(json.reviews);
            
            // Calculate average rating
            const sum = json.reviews.reduce((total, review) => total + review.rating, 0);
            const avg = json.reviews.length > 0 ? sum / json.reviews.length : 0;
            
            setAverageRating(avg);
            setTotalReviews(json.reviews.length);
          }
        })
        .catch(error => {
          console.error('Error fetching reviews:', error);
        })
        .finally(() => setReviewsLoading(false));
    }
  }, [data]);

  const handleCall = () => Linking.openURL(`tel:${data.mobile}`);
  const handleWhatsApp = () => Linking.openURL(`https://wa.me/${data.mobile}`);
const handleDirection = () => {
  const query = encodeURIComponent(`${data.user_village}, ${data.user_block}, ${data.pin}`);
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
};

  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  // const [routes] = useState([
  //   { key: 'overview', title: t.overview },
  //   { key: 'reviews', title: 'Reviews' },
  //   { key: 'services', title: 'Services' },
  //   { key: 'quickinfo', title: 'Quick Info' },
  // ]);

   const [routes] = useState([
    { key: 'overview', title: t.overview || 'Overview' },
    { key: 'reviews', title: t.reviews || 'Reviews' },
    { key: 'services', title: t.services || 'Services' },
    { key: 'quickinfo', title: t.quickInfo || 'Quick Info' },
  ]);


  const OverviewRoute = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const openImage = (index) => {
      setSelectedImageIndex(index);
      setModalVisible(true);
    };

    const goToNext = () => {
      setSelectedImageIndex(prev =>
        prev === data.images.length - 1 ? 0 : prev + 1
      );
    };

    const goToPrevious = () => {
      setSelectedImageIndex(prev =>
        prev === 0 ? data.images.length - 1 : prev - 1
      );
    };

    return (
      <ScrollView style={styles.scene} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{data.description}</Text>

        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.description}>
          {data.village}, {data.block}, {data.city}, {data.state} - {data.pinCode}
        </Text>

        <Text style={styles.sectionTitle}>Photos</Text>
        <FlatList
          horizontal
          data={data.images}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => openImage(index)}>
              <Image
                source={{ uri: `${BASE_URL}/images/${item.path}` }}
                style={styles.image}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          showsHorizontalScrollIndicator={false}
        />

        {/* Image Viewer Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close" size={30} color="#fff" />
            </TouchableOpacity>

            <Image
              source={{ uri: `${BASE_URL}/images/${data.images[selectedImageIndex].path}` }}
              style={styles.modalImage}
              resizeMode="contain"
            />

            <View style={styles.navigationButtons}>
              <TouchableOpacity onPress={goToPrevious} style={styles.navButton}>
                <Icon name="chevron-back" size={30} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.imageCounter}>
                {selectedImageIndex + 1} / {data.images.length}
              </Text>

              <TouchableOpacity onPress={goToNext} style={styles.navButton}>
                <Icon name="chevron-forward" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  };

const ReviewsTab = ({ reviews, sortOption }) => {
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortOption === 'latest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortOption === 'high_to_low') {
      return b.rating - a.rating;
    }
    return 0;
  });

  const renderItem = (item) => (
    <View key={item.id} style={styles.reviewCard}>
      <View style={styles.userRow}>
        {item.profile_image ? (
          <Image
            source={{ uri: PROFILE_IMAGE_URL + item.profile_image }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#555' }}>{item.username ? item.username[0] : '?'}</Text>
          </View>
        )}
        <Text style={styles.username}>{item.username || 'Anonymous'}</Text>
      </View>
      <Text style={styles.reviewText}>{item.review}</Text>
      <View style={styles.ratingContainer}>
        {[...Array(5)].map((_, i) => (
          <FontAwesome
            key={i}
            name="star"
            size={16}
            color={i < item.rating ? '#FFD700' : '#ccc'}
            style={styles.starIcon}
          />
        ))}
      </View>
      <Text style={styles.timeText}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  if (reviewsLoading) {
    return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;
  }

  if (sortedReviews.length === 0) {
    return <Text style={{ margin: 20, textAlign: 'center' }}>No reviews yet.</Text>;
  }

  return (
    <View style={{ padding: 16 }}>
      {sortedReviews.map(renderItem)}
    </View>
  );
};

const ReviewsRoute = () => {
  const [sortOption, setSortOption] = useState('relevant');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.reviewPromptContainer}>
        <View style={styles.reviewHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
          <Text style={styles.reviewTitle}>Share Your Experience</Text>
        </View>

        <View style={styles.ratingPrompt}>
          <View style={styles.starsContainer}>
            {[...Array(5)].map((_, i) => (
              <FontAwesome
                key={i}
                name="star"
                size={20}
                color={i < 5 ? "#FFD700" : "#ddd"}
                style={styles.starIcon}
              />
            ))}
          </View>
          <Text style={styles.promptText}>
            Finish your review for{" "}
            <Text style={styles.businessNameHighlight}>{data.businessName}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.aiReviewButton}
          onPress={() =>
            navigation.navigate("WriteReviewScreen", {
              business: {
                id: data.id,
                name: data.businessName,
                category: data.category,
                description: data.description,
              },
              user: {
                id: data.userId,
                name: "User Name",
              },
            })
          }
        >
          <LinearGradient
            colors={["#6E45E2", "#3889FF"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="sparkles" size={20} color="#fff" />
            <Text style={styles.aiReviewText}>Write AI-Powered Review</Text>
            <Icon name="arrow-forward" size={20} color="#fff" style={styles.arrowIcon} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.divider} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
        <View style={styles.ratingRow}>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingValue}>{averageRating.toFixed(1)}</Text>
          </View>
          <Text style={styles.ratingDetails}>
            {totalReviews} Ratings{"\n"}Based on reviews across platforms
          </Text>
        </View>
        <View style={styles.recentTrend}>
          <Text style={styles.star}>{averageRating.toFixed(1)} ★</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, sortOption === 'relevant' && styles.selectedFilter]}
          onPress={() => setSortOption('relevant')}
        >
          <Text style={sortOption === 'relevant' && { color: '#007BFF' }}>Relevant</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, sortOption === 'latest' && styles.selectedFilter]}
          onPress={() => setSortOption('latest')}
        >
          <Text style={sortOption === 'latest' && { color: '#007BFF' }}>Latest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, sortOption === 'high_to_low' && styles.selectedFilter]}
          onPress={() => setSortOption('high_to_low')}
        >
          <Text style={sortOption === 'high_to_low' && { color: '#007BFF' }}>High to Low</Text>
        </TouchableOpacity>
      </View>

      <ReviewsTab
        reviews={reviews}
        sortOption={sortOption}
      />
    </ScrollView>
  );
};

  const ServicesRoute = () => (
    <View style={styles.sceneCentered}>
      <Text style={styles.placeholderText}>Services information not available.</Text>
    </View>
  );

  const QuickInfoRoute = () => (
    <View style={styles.sceneCentered}>
      <Text style={styles.placeholderText}>Quick info will be shown here.</Text>
    </View>
  );

  const renderScene = SceneMap({
    overview: OverviewRoute,
    reviews: ReviewsRoute,
    services: ServicesRoute,
    quickinfo: QuickInfoRoute,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff',color:'#fff' }}>
<View style={[styles.header, { marginLeft: 0 }]}>
     <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 30, marginLeft: 10 }}>
  <Icon name="arrow-back" size={24} color="#fff" />
</TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{data.businessName}</Text>
      </View>

     <View style={styles.topSectionContainer}>
  <View style={styles.topSection}>
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: `${PROFILE_IMAGE_URL}${data.images[0].path}` }}
        style={styles.businessImage}
      />
      <View style={styles.overlay} />
    </View>

    <View style={styles.infoContainer}>
      <Text style={styles.businessName}>{data.businessName}</Text>
      
      <View style={styles.ratingRow}>
        <View style={styles.ratingBox}>
          {reviewsLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <FontAwesome name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
            </>
          )}
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.ratingCount}>
          {reviewsLoading ? 'Loading...' : `${totalReviews} Ratings`}
        </Text>
      </View>
      
      <View style={styles.locationRow}>
        <Icon name="location-outline" size={16} color="#555" />
        <Text style={styles.locationText} numberOfLines={1}>
          {data.block}, {data.city}
        </Text>
      </View>
    </View>
  </View>
</View>
      <View style={styles.actionRow}>
        <ActionButton icon="call" label="Call" onPress={handleCall} />
        <ActionButton icon="logo-whatsapp" label="WhatsApp" onPress={handleWhatsApp} />
        <ActionButton icon="chatbubble-ellipses" label="Enquiry" />
        <ActionButton icon="navigate" label="Direction" onPress={handleDirection} />
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#007bff' }}
            style={{ backgroundColor: '#f8f8f8' }}
            labelStyle={{ fontWeight: 'bold' }}
            activeColor="#000"
            inactiveColor="#888"
          />
        )}
        style={{ flex: 1 }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={handleCall}>
          <Text style={styles.footerText}>Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn}>
          <Text style={styles.footerText}>Enquire Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={handleWhatsApp}>
          <Text style={styles.footerText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ActionButton = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <Icon name={icon} size={24} color="#007bff" />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomColor: '#ddd',
    backgroundColor:'#5878dd',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 12,
    flexShrink: 1,
    textAlign:'center',
    justifyContent:'center',
    marginLeft:120,
    marginTop:20,
    color:'#fff'
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBox: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  ratingText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 14,
  },
  subText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
  locationText: {
    fontSize: 14,
    color: '#555',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionLabel: {
    marginTop: 4,
    color: '#007bff',
    fontSize: 12,
  },
  scene: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sceneCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  image: {
    width: 150,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  aiReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  aiReviewText: {
    color: '#007BFF',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  ratingValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  ratingDetails: {
    marginLeft: 16,
    fontSize: 12,
    color: '#555',
  },
  recentTrend: {
    marginTop: 10,
  },
  star: {
    color: '#28a745',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  selectedFilter: {
    borderColor: '#007BFF',
    backgroundColor: '#e6f0ff',
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  starIcon: {
    marginRight: 2,
  },
  timeText: {
    fontSize: 10,
    color: '#aaa',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  footerBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  footerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '70%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    marginTop: 20,
  },
  navButton: {
    padding: 20,
  },
  imageCounter: {
    color: '#fff',
    fontSize: 18,
  },topSectionContainer: {
  backgroundColor: '#fff',
  padding: 16,
  borderBottomLeftRadius: 24,
  borderBottomRightRadius: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 3,
},
topSection: {
  flexDirection: 'row',
  alignItems: 'center',
},
imageContainer: {
  position: 'relative',
},
businessImage: {
  width: 200,
  height: 120,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#fff',
},
overlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0,0,0,0.03)',
  borderRadius: 12,
},
infoContainer: {
  flex: 1,
  marginLeft: 16,
},
businessName: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 8,
},
ratingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 6,
},
ratingBox: {
  flexDirection: 'row',
  backgroundColor: '#007bff',
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
},
ratingText: {
  color: '#fff',
  fontWeight: 'bold',
  marginLeft: 4,
  fontSize: 14,
},
divider: {
  width: 1,
  height: 16,
  backgroundColor: '#ddd',
  marginHorizontal: 10,
},
ratingCount: {
  fontSize: 14,
  color: '#555',
  fontWeight: '500',
  marginLeft:50
},
locationRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 4,
},
locationText: {
  fontSize: 14,
  color: '#555',
  marginLeft: 6,
  flexShrink: 1,
},reviewPromptContainer: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
  margin: 16,
  marginBottom: 8,
  shadowColor: '#6E45E2',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 5,
},
reviewHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 15,
},
badge: {
  backgroundColor: '#FF6B6B',
  borderRadius: 4,
  paddingHorizontal: 6,
  paddingVertical: 2,
  marginRight: 8,
},
badgeText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: 'bold',
},
reviewTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#2D3748',
},
ratingPrompt: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 20,
},
starsContainer: {
  flexDirection: 'row',
  marginRight: 12,
  backgroundColor: 'rgba(255, 215, 0, 0.1)',
  borderRadius: 8,
  padding: 6,
},
starIcon: {
  marginHorizontal: 1,
},
promptText: {
  fontSize: 16,
  color: '#4A5568',
  flex: 1,
},
businessNameHighlight: {
  fontWeight: 'bold',
  color: '#2D3748',
},
aiReviewButton: {
  borderRadius: 12,
  overflow: 'hidden',
  marginBottom: 20,
},
gradient: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 15,
  paddingHorizontal: 20,
},
aiReviewText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
  marginLeft: 10,
  marginRight: 5,
},
arrowIcon: {
  marginLeft: 5,
},
divider: {
  height: 1,
  backgroundColor: 'rgba(237, 237, 237, 0.8)',
  marginHorizontal: -20,
},
});

export default ViewJobScreen;