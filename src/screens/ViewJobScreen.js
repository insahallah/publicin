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
  Modal,
  TextInput
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import LinearGradient from 'react-native-linear-gradient';
import ViewJobScreenTranslator from './langs/viewJobScreenTranslator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { BASE_URL } from './BaseUrl';
import { PROFILE_IMAGE_URL } from './BaseUrl';
import { generateDescription } from './services/geminiApi'; // Import the AI function

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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Write Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  // AI Review Generation States - YEH NAYA STATE ADD KIYA HAI
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [showAiOptions, setShowAiOptions] = useState(false);

  // Image modal functions
  const openImage = (index) => {
    setSelectedImageIndex(index);
    setModalVisible(true);
  };

  const goToNext = () => {
    if (selectedImageIndex < data.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // AI Review Generation Function - YEH NAYA FUNCTION ADD KIYA HAI
  const generateAIReview = async (tone = 'positive') => {
    setAiReviewLoading(true);
    
    try {
     const prompt = `
Generate a ${tone} customer review for a business called "${data.businessName}".

Requirements:
- Include the business name "${data.businessName}" naturally in the review
- Add relevant emojis that match the business type and tone
- Make it sound authentic and genuine
- Keep it between 50–100 words
- Focus on ${tone === 'positive'
  ? 'positive experiences and strong recommendations'
  : tone === 'detailed'
  ? 'balanced feedback highlighting both positives and areas of improvement'
  : 'constructive criticism with polite improvement suggestions'}
- Mention specific aspects like service quality, staff behavior, pricing, or overall experience

Write in a natural, conversational tone as if written by a real customer.
`.trim();
      const aiReview = await generateDescription(prompt);
      
      if (aiReview && aiReview.trim().length > 0) {
        setReviewText(aiReview.trim());
        setShowAiOptions(false);
        
        // Auto-set rating based on tone
        if (tone === 'positive') {
          setRating(5);
        } else if (tone === 'detailed') {
          setRating(4);
        } else {
          setRating(3);
        }
      } else {
        alert('Failed to generate review. Please try again.');
      }
    } catch (error) {
      console.error('AI Review Generation Error:', error);
      alert('Error generating review. Please write manually.');
    } finally {
      setAiReviewLoading(false);
    }
  };

  // Write Review Button Handler
  const handleWriteReviewPress = async () => {
    const userId = await AsyncStorage.getItem('id');
    
    if (!userId) {
      alert('Please login to write a review');
      setShowReviewModal(false);
      setTimeout(() => {
        navigation.replace('LoginScreen');
      }, 100);
      return;
    }
    
    setShowReviewModal(true);
  };

  // Write Review Functions
  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    const trimmedReview = reviewText.trim();
    if (trimmedReview.length === 0) {
      alert('Please write a review');
      return;
    }

    if (trimmedReview.length < 10) {
      alert('Please write a more detailed review (minimum 10 characters)');
      return;
    }

    setSubmittingReview(true);

    try {
      const userId = await AsyncStorage.getItem('id');

      if (!userId) {
        alert('Please login to submit a review');
        setSubmittingReview(false);
        setShowReviewModal(false);
        setTimeout(() => {
          navigation.replace('LoginScreen');
        }, 100);
        return;
      }

      const response = await fetch(`${BASE_URL}api/users/submit_review.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: data.id,
          rating: rating,
          review: trimmedReview,
          user_id: userId,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('Server Response:', result);

      if (result.status === 'success') {
        alert('Review submitted successfully!');
        setShowReviewModal(false);
        setReviewText('');
        setRating(0);
        fetchReviews();
      } else {
        throw new Error(result.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.message || 'Error submitting review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const fetchReviews = () => {
    if (data?.id) {
      fetch(`${BASE_URL}api/users/get_reviews_for_one_bussiness.php?business_id=${data.id}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.reviews) {
            setReviews(json.reviews);

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
  };

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
    fetchReviews();
  }, [data]);

  const handleCall = () => Linking.openURL(`tel:${data.mobile_user}`);
  const handleWhatsApp = () => Linking.openURL(`https://wa.me/${data.mobile_user}`);

  const handleDirection = () => {
    console.log('latitude:', data.latitude);
    console.log('longitude:', data.longitude);

    if (data.latitude && data.longitude) {
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
    } else {
      const query = encodeURIComponent(`${data.user_village}, ${data.user_block}, ${data.pinCode || data.pin || ''}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const [routes] = useState([
    { key: 'overview', title: t.overview || 'Overview' },
    { key: 'reviews', title: t.reviews || 'Reviews' },
    { key: 'services', title: t.services || 'Services' },
    { key: 'quickinfo', title: t.quickInfo || 'Quick Info' },
  ]);

  // Enhanced Overview Route with beautiful UI
  const OverviewRoute = () => (
    <ScrollView style={styles.scene} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Business Header Section */}
      <View style={styles.businessHeader}>
        <View style={styles.businessIconContainer}>
          <Ionicons name="business" size={28} color="#5878DD" />
        </View>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{data.businessName}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>
              {averageRating.toFixed(1)} • {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
          </View>
        </View>
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      </View>

      {/* Description Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={20} color="#5878DD" />
          <Text style={styles.sectionTitle}>Description</Text>
        </View>
        <View style={styles.descriptionCard}>
          <Text style={styles.description}>
            {data.description || "No description provided for this business."}
          </Text>
        </View>
      </View>

      {/* Address Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location" size={20} color="#5878DD" />
          <Text style={styles.sectionTitle}>Address</Text>
        </View>
        <View style={styles.addressCard}>
          <View style={styles.addressContent}>
            <Ionicons name="home" size={18} color="#6B7280" style={styles.addressIcon} />
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressText}>
                {data.user_village}, {data.user_block}
              </Text>
              <Text style={styles.addressText}>
                {data.city}, {data.state} - {data.pin}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.directionButton} onPress={handleDirection}>
            <Ionicons name="navigate" size={16} color="#5878DD" />
            <Text style={styles.directionText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Photos Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="images" size={20} color="#5878DD" />
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.photoCount}>({data.images?.length || 0})</Text>
        </View>

        {data.images && data.images.length > 0 ? (
          <FlatList
            horizontal
            data={data.images}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => openImage(index)}
                style={styles.imageContainer}
              >
                <Image
                  source={{ uri: `${BASE_URL}/images/${item.path}` }}
                  style={styles.image}
                />
                <View style={styles.imageOverlay}>
                  <Ionicons name="expand" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.imagesList}
            showsHorizontalScrollIndicator={false}
          />
        ) : (
          <View style={styles.noPhotosContainer}>
            <Ionicons name="image-outline" size={48} color="#D1D5DB" />
            <Text style={styles.noPhotosText}>No photos available</Text>
          </View>
        )}
      </View>

      {/* Write Review Prompt Section */}
      <View style={styles.reviewPromptContainer}>
        <View style={styles.reviewHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
          <Text style={styles.reviewTitle}>Share Your Experience</Text>
        </View>

        <View style={styles.ratingPrompt}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome
                key={star}
                name="star"
                size={20}
                color="#FFD700"
                style={styles.starIcon}
              />
            ))}
          </View>
          <Text style={styles.promptText}>
            Help others by sharing your experience with{' '}
            <Text style={styles.businessNameHighlight}>{data.businessName}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.aiReviewButton}
          onPress={handleWriteReviewPress}
        >
          <LinearGradient
            colors={['#5878DD', '#6C63FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Ionicons name="pencil" size={20} color="#FFFFFF" />
            <Text style={styles.aiReviewText}>Write a Review</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.arrowIcon} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Contact & Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, styles.callButtonText]}>Call Now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.messageButton]} onPress={handleWhatsApp}>
          <Ionicons name="chatbubble" size={20} color="#5878DD" />
          <Text style={[styles.actionButtonText, styles.messageButtonText]}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.shareButton]}>
          <Ionicons name="share-social" size={20} color="#5878DD" />
          <Text style={[styles.actionButtonText, styles.shareButtonText]}>Share</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Enhanced Reviews Route with Write Review Feature
  const ReviewsRoute = () => {
    const [sortOption, setSortOption] = useState('latest');

    const sortedReviews = [...reviews].sort((a, b) => {
      if (sortOption === 'latest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortOption === 'high_to_low') {
        return b.rating - a.rating;
      }
      return 0;
    });

    const renderReviewItem = ({ item }) => (
      <View style={styles.reviewCard}>
        <View style={styles.userRow}>
          {item.profile_image ? (
            <Image
              source={{ uri: PROFILE_IMAGE_URL + item.profile_image }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{item.username ? item.username[0] : '?'}</Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.username || 'Anonymous'}</Text>
            <Text style={styles.reviewDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.reviewRatingContainer}>
          {[...Array(5)].map((_, i) => (
            <FontAwesome
              key={i}
              name="star"
              size={16}
              color={i < item.rating ? '#FFD700' : '#E5E7EB'}
              style={styles.starIcon}
            />
          ))}
        </View>

        <Text style={styles.reviewText}>{item.review}</Text>
      </View>
    );

    if (reviewsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5878DD" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      );
    }

    return (
      <View style={styles.reviewsScene}>
        {/* Write Review Button */}
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={handleWriteReviewPress}
        >
          <LinearGradient
            colors={['#5878DD', '#6C63FF']}
            style={styles.writeReviewGradient}
          >
            <Ionicons name="pencil" size={20} color="#FFFFFF" />
            <Text style={styles.writeReviewText}>Write a Review</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Reviews Summary */}
        <View style={styles.reviewsSummary}>
          <View style={styles.ratingOverview}>
            <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <FontAwesome
                  key={i}
                  name="star"
                  size={20}
                  color={i < Math.floor(averageRating) ? '#FFD700' : '#E5E7EB'}
                />
              ))}
            </View>
            <Text style={styles.totalReviews}>{totalReviews} reviews</Text>
          </View>
        </View>

        {/* Sort Filters */}
        <View style={styles.filterRow}>
          {['latest', 'high_to_low'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterBtn,
                sortOption === option && styles.selectedFilter
              ]}
              onPress={() => setSortOption(option)}
            >
              <Text style={[
                styles.filterText,
                sortOption === option && styles.selectedFilterText
              ]}>
                {option === 'latest' ? 'Latest' : 'Highest Rated'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reviews List */}
        {sortedReviews.length > 0 ? (
          <FlatList
            data={sortedReviews}
            renderItem={renderReviewItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.reviewsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.noReviewsContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#D1D5DB" />
            <Text style={styles.noReviewsText}>No reviews yet</Text>
            <Text style={styles.noReviewsSubtext}>Be the first to review this business</Text>

            <TouchableOpacity
              style={[styles.writeReviewButton, { marginTop: 20 }]}
              onPress={handleWriteReviewPress}
            >
              <LinearGradient
                colors={['#5878DD', '#6C63FF']}
                style={styles.writeReviewGradient}
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
                <Text style={styles.writeReviewText}>Write First Review</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const ServicesRoute = () => (
    <View style={styles.sceneCentered}>
      <Ionicons name="construct" size={64} color="#D1D5DB" />
      <Text style={styles.placeholderText}>Services information not available</Text>
    </View>
  );

  const QuickInfoRoute = () => (
    <View style={styles.sceneCentered}>
      <Ionicons name="information" size={64} color="#D1D5DB" />
      <Text style={styles.placeholderText}>Quick info will be shown here</Text>
    </View>
  );

  const renderScene = SceneMap({
    overview: OverviewRoute,
    reviews: ReviewsRoute,
    services: ServicesRoute,
    quickinfo: QuickInfoRoute,
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{data.businessName}</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-social" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#5878DD', height: 3 }}
            style={{ backgroundColor: '#FFFFFF' }}
            labelStyle={styles.tabLabel}
            activeColor="#5878DD"
            inactiveColor="#6B7280"
          />
        )}
        style={{ flex: 1 }}
      />

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#FFFFFF" />
          <Text style={styles.footerText}>Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn}>
          <Ionicons name="mail" size={20} color="#FFFFFF" />
          <Text style={styles.footerText}>Enquire Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
          <Text style={styles.footerText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Image Viewer Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedImageIndex + 1} / {data.images.length}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Image
            source={{ uri: `${BASE_URL}/images/${data.images[selectedImageIndex].path}` }}
            style={styles.modalImage}
            resizeMode="contain"
          />

          <View style={styles.navigationButtons}>
            <TouchableOpacity onPress={goToPrevious} style={styles.navButton}>
              <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={goToNext} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Write Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.reviewModalContainer}>
          <View style={styles.reviewModalContent}>
            <View style={styles.reviewModalHeader}>
              <Text style={styles.reviewModalTitle}>Write a Review</Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                style={styles.reviewModalClose}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.businessNameModal}>{data.businessName}</Text>

            {/* AI Review Generation Button - YEH NAYA BUTTON ADD KIYA HAI */}
            <TouchableOpacity
              style={styles.aiGenerateButton}
              onPress={() => setShowAiOptions(true)}
              disabled={aiReviewLoading}
            >
              <LinearGradient
                colors={['#8E44AD', '#9B59B6']}
                style={styles.aiGenerateGradient}
              >
                {aiReviewLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                    <Text style={styles.aiGenerateText}>Generate with AI ✨</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Rating Stars */}
            <View style={styles.ratingInputContainer}>
              <Text style={styles.ratingLabel}>Your Rating</Text>
              <View style={styles.ratingStarsInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                  >
                    <FontAwesome
                      name="star"
                      size={32}
                      color={star <= rating ? '#FFD700' : '#E5E7EB'}
                      style={styles.ratingStarInput}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingValue}>
                {rating > 0 ? `${rating} out of 5` : 'Select rating'}
              </Text>
            </View>

            {/* Review Text Input */}
            <View style={styles.reviewInputContainer}>
              <Text style={styles.reviewInputLabel}>Your Review</Text>
              <TextInput
                style={styles.reviewTextInput}
                placeholder="Share your experience with this business..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={reviewText}
                onChangeText={setReviewText}
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {reviewText.length}/500 characters
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitReviewButton,
                (rating === 0 || reviewText.trim().length === 0 || submittingReview) && styles.submitReviewButtonDisabled
              ]}
              onPress={handleSubmitReview}
              disabled={rating === 0 || reviewText.trim().length === 0 || submittingReview}
            >
              <LinearGradient
                colors={['#5878DD', '#6C63FF']}
                style={styles.submitReviewGradient}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.submitReviewText}>Submit Review</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Options Modal - YEH NAYA MODAL ADD KIYA HAI */}
      <Modal
        visible={showAiOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAiOptions(false)}
      >
        <View style={styles.aiOptionsModalContainer}>
          <View style={styles.aiOptionsModalContent}>
            <View style={styles.aiOptionsHeader}>
              <Text style={styles.aiOptionsTitle}>Generate AI Review</Text>
              <TouchableOpacity
                onPress={() => setShowAiOptions(false)}
                style={styles.aiOptionsClose}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.aiOptionsSubtitle}>
              Choose the tone for your review of{' '}
              <Text style={styles.businessNameHighlight}>{data.businessName}</Text>
            </Text>

            <View style={styles.aiOptionsGrid}>
              <TouchableOpacity
                style={[styles.aiOptionCard, styles.positiveOption]}
                onPress={() => generateAIReview('positive')}
                disabled={aiReviewLoading}
              >
                <Ionicons name="happy" size={32} color="#27AE60" />
                <Text style={styles.aiOptionTitle}>Positive</Text>
                <Text style={styles.aiOptionDescription}>
                  Great experience with high praise and recommendations
                </Text>
                <View style={styles.ratingPreview}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FontAwesome
                      key={star}
                      name="star"
                      size={16}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.aiOptionCard, styles.detailedOption]}
                onPress={() => generateAIReview('detailed')}
                disabled={aiReviewLoading}
              >
                <Ionicons name="thumbs-up" size={32} color="#3498DB" />
                <Text style={styles.aiOptionTitle}>Balanced</Text>
                <Text style={styles.aiOptionDescription}>
                  Detailed feedback with both positives and suggestions
                </Text>
                <View style={styles.ratingPreview}>
                  {[1, 2, 3, 4].map((star) => (
                    <FontAwesome
                      key={star}
                      name="star"
                      size={16}
                      color="#FFD700"
                    />
                  ))}
                  <FontAwesome
                    name="star"
                    size={16}
                    color="#E5E7EB"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.aiOptionCard, styles.constructiveOption]}
                onPress={() => generateAIReview('constructive')}
                disabled={aiReviewLoading}
              >
                <Ionicons name="build" size={32} color="#E67E22" />
                <Text style={styles.aiOptionTitle}>Constructive</Text>
                <Text style={styles.aiOptionDescription}>
                  Focus on areas for improvement with helpful suggestions
                </Text>
                <View style={styles.ratingPreview}>
                  {[1, 2, 3].map((star) => (
                    <FontAwesome
                      key={star}
                      name="star"
                      size={16}
                      color="#FFD700"
                    />
                  ))}
                  {[1, 2].map((star) => (
                    <FontAwesome
                      key={star}
                      name="star"
                      size={16}
                      color="#E5E7EB"
                    />
                  ))}
                </View>
              </TouchableOpacity>
            </View>

            {aiReviewLoading && (
              <View style={styles.aiLoadingContainer}>
                <ActivityIndicator size="large" color="#8E44AD" />
                <Text style={styles.aiLoadingText}>AI is writing your review...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#5878DD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },

  // Tab Styles
  tabLabel: {
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'none',
  },

  // Scene Styles
  scene: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  sceneCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },

  // Business Header
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  businessIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },

  // Section Styles
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },

  // Description
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },

  // Address
  addressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressContent: {
    flexDirection: 'row',
    flex: 1,
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF0FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  directionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5878DD',
    marginLeft: 4,
  },

  // Photos
  imagesList: {
    paddingHorizontal: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  noPhotosContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotosText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callButton: {
    backgroundColor: '#5878DD',
  },
  messageButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#5878DD',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#5878DD',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  callButtonText: {
    color: '#FFFFFF',
  },
  messageButtonText: {
    color: '#5878DD',
  },
  shareButtonText: {
    color: '#5878DD',
  },

  // Write Review Prompt Styles - YEH NAYA STYLES ADD KIYE HAIN
  reviewPromptContainer: {
    backgroundColor: '#FFFFFF',
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

  // Reviews Styles
  reviewsScene: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  reviewsSummary: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ratingOverview: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalReviews: {
    fontSize: 16,
    color: '#6B7280',
  },

  // Write Review Button Styles
  writeReviewButton: {
    margin: 16,
    borderRadius: 12,
    shadowColor: '#5878DD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  writeReviewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  writeReviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Review Cards
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1F2937',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  reviewRatingContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },

  // Filter Styles
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedFilter: {
    borderColor: '#5878DD',
    backgroundColor: '#EBF0FF',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedFilterText: {
    color: '#5878DD',
  },

  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  noReviewsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noReviewsText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginTop: 16,
    fontWeight: '600',
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5878DD',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  footerText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  modalImage: {
    width: '95%',
    height: '70%',
  },
  navigationButtons: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
  },

  // Write Review Modal Styles - YEH NAYA STYLES ADD KIYE HAIN
  reviewModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reviewModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewModalClose: {
    padding: 4,
  },
  businessNameModal: {
    fontSize: 16,
    color: '#5878DD',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },

  // Rating Input
  ratingInputContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  ratingStarsInput: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingStarInput: {
    marginHorizontal: 6,
  },
  ratingValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Review Text Input
  reviewInputContainer: {
    marginBottom: 24,
  },
  reviewInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },

  // Submit Button
  submitReviewButton: {
    borderRadius: 12,
    shadowColor: '#5878DD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitReviewButtonDisabled: {
    opacity: 0.6,
  },
  submitReviewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitReviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
   aiGenerateButton: {
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#8E44AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiGenerateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  aiGenerateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // AI Options Modal Styles - YEH NAYA STYLES ADD KIYE HAIN
  aiOptionsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aiOptionsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  aiOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiOptionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  aiOptionsClose: {
    padding: 4,
  },
  aiOptionsSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  aiOptionsGrid: {
    gap: 16,
  },
  aiOptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  positiveOption: {
    borderColor: '#27AE60',
  },
  detailedOption: {
    borderColor: '#3498DB',
  },
  constructiveOption: {
    borderColor: '#E67E22',
  },
  aiOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  aiOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  ratingPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  aiLoadingContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
  },
  aiLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E44AD',
    fontWeight: '600',
  },
});

export default ViewJobScreen;