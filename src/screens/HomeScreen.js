import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Animated,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { SvgXml } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { showMessage } from 'react-native-flash-message';
import { BASE_URL } from './BaseUrl';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced chunk array function
const chunkArray = (arr, size) =>
  arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);

// Professional Svg Loader with caching
const RemoteSvgIcon = ({ uri, width = 32, height = 32, style }) => {
  const [svgXml, setSvgXml] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        // Check cache first
        const cachedSvg = await AsyncStorage.getItem(`svg_${uri}`);
        if (cachedSvg) {
          setSvgXml(cachedSvg);
          setLoading(false);
          return;
        }

        const res = await fetch(uri);
        const text = await res.text();
        setSvgXml(text);
        await AsyncStorage.setItem(`svg_${uri}`, text);
      } catch (err) {
        console.log('SVG load error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (uri) fetchSvg();
  }, [uri]);

  if (loading) {
    return (
      <View style={[styles.svgPlaceholder, { width, height }, style]}>
        <ActivityIndicator size="small" color="#5E7CE2" />
      </View>
    );
  }

  if (!svgXml) {
    return (
      <View style={[styles.svgPlaceholder, { width, height }, style]}>
        <Icon name="image-outline" size={width * 0.6} color="#CBD5E0" />
      </View>
    );
  }

  return <SvgXml xml={svgXml} width={width} height={height} style={style} />;
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [quickActions, setQuickActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('en');
  const [scrollY] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);

  // Enhanced animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [160, 100],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.95, 0.9],
    extrapolate: 'clamp',
  });

  const searchBarScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const localizedContent = {
    post_job: {
      en: { 
        title: 'Post Your Job FREE', 
        subtitle: 'Find the right talent quickly', 
        button: 'Post Now', 
        view_all: 'View All',
        greeting: 'Hello,',
        search_placeholder: 'Search services, professionals...',
        popular_services: 'Popular Services',
        premium_title: 'Premium Membership',
        premium_text: 'Get 50% more visibility for your services'
      },
      hi: { 
        title: 'अपना काम पोस्ट करें', 
        subtitle: 'सही प्रतिभा जल्दी पाएं', 
        button: 'पोस्ट करें', 
        view_all: 'सभी देखें',
        greeting: 'नमस्ते,',
        search_placeholder: 'सेवाएं, पेशेवर खोजें...',
        popular_services: 'लोकप्रिय सेवाएं',
        premium_title: 'प्रीमियम सदस्यता',
        premium_text: 'अपनी सेवाओं के लिए 50% अधिक दृश्यता प्राप्त करें'
      },
    },
  };

  const preloadLocalizedContent = async () => {
    const existing = await AsyncStorage.getItem('localizedContent');
    if (!existing) {
      await AsyncStorage.setItem('localizedContent', JSON.stringify(localizedContent));
    }
  };

  const fetchUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      const userName = await AsyncStorage.getItem('user_name');
      if (user || userName) {
        setUserData({
          name: userName || JSON.parse(user)?.name || 'User',
          initial: (userName || 'U').charAt(0).toUpperCase()
        });
      }
    } catch (error) {
      console.log('Error fetching user data:', error);
    }
  };

  const fetchActions = async (langCode) => {
    try {
      setLoading(true);
      setError(null);

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        showMessage({
          message: "No internet connection",
          description: "Please check your network and try again.",
          type: "warning",
          backgroundColor: '#FFA726',
          color: '#fff',
        });
        setError("No internet connection. Please check your network.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/home.php?lang=${langCode}`);
      if (response.data.status === 'success') {
        setQuickActions(response.data.data.categories);
        
        showMessage({
          message: "Data loaded successfully",
          type: "success",
          backgroundColor: '#4CAF50',
          color: '#fff',
        });
      } else {
        showMessage({
          message: "Slow connection",
          description: "Unable to fetch fresh data.",
          type: "warning",
          backgroundColor: '#FFA726',
          color: '#fff',
        });
        setError('Failed to load categories.');
      }
    } catch (err) {
      showMessage({
        message: "Connection error",
        description: "Please try again later.",
        type: "danger",
        backgroundColor: '#F44336',
        color: '#fff',
      });
      setError('Failed to load quick actions. Please try again.');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const selectedLang = await AsyncStorage.getItem('appLanguage');
    const langToUse = selectedLang || 'en';
    await fetchActions(langToUse);
  };

  useEffect(() => {
    const loadLanguageAndData = async () => {
      await preloadLocalizedContent();
      await fetchUserData();
      const selectedLang = await AsyncStorage.getItem('appLanguage');
      const langToUse = selectedLang || 'en';
      setLang(langToUse);
      fetchActions(langToUse);
    };
    
    loadLanguageAndData();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        showMessage({
          message: "No internet connection",
          description: "Please check your network.",
          type: "warning",
          backgroundColor: '#FFA726',
          color: '#fff',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleActionPress = (action) => {
    navigation.navigate('All Categories', { category: action });
  };

  const renderActionGrid = () => {
    const items = [...quickActions];
    items.push({
      id: 'view_all',
      icon: 'apps',
      label: localizedContent.post_job[lang]?.view_all || 'View All',
      isViewAll: true,
    });

    return chunkArray(items, 4).map((row, rowIndex) => (
      <Animatable.View 
        key={rowIndex}
        animation="fadeInUp"
        delay={rowIndex * 100}
        duration={600}
        style={styles.quickActionsRow}
      >
        {row.map((action, index) => {
          const simpleId = action.id.replace(/^cat/, '');
          const cleanId = parseInt(simpleId, 10).toString();

          return (
            <ActionButton
              key={action.id}
              emoji={action.emoji}
              icon={action.icon}
              label={action.label}
              index={index}
              onPress={() =>
                action.isViewAll
                  ? navigation.navigate('All Categories')
                  : navigation.navigate('All Categories', { id: cleanId })
              }
            />
          );
        })}
      </Animatable.View>
    ));
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#4A6CD4"
        barStyle="light-content"
        translucent={false}
      />

      {/* Enhanced Header */}
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#4A6CD4', '#3A5BC7', '#2A4BBA']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerBackgroundPattern} />
        </LinearGradient>

        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              style={styles.menuButton}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.menuButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="menu" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.userGreeting}>
              <Text style={styles.greetingText}>
                {localizedContent.post_job[lang]?.greeting || 'Hello,'}
              </Text>
              <Text style={styles.userName}>
                {userData?.name || 'Welcome Back'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')} 
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.headerButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="bell-outline" size={22} color="#ffffff" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>3</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Enhanced Search Bar */}
        <Animated.View style={[styles.searchBarContainer, { transform: [{ scale: searchBarScale }] }]}>
          <TouchableOpacity 
            onPress={() => handleActionPress()}
            activeOpacity={0.9}
            style={styles.searchBarTouchable}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
              style={styles.searchBarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="magnify" size={22} color="#4A6CD4" style={styles.searchIcon} />
              <Text style={styles.fakeInput}>
                {localizedContent.post_job[lang]?.search_placeholder || 'Search services, professionals...'}
              </Text>
              <View style={styles.searchBadge}>
                <Text style={styles.searchBadgeText}>⌘</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4A6CD4']}
            tintColor="#4A6CD4"
            progressBackgroundColor="#ffffff"
          />
        }
      >
        {/* Popular Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {localizedContent.post_job[lang]?.popular_services || 'Popular Services'}
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('All Categories')}
              activeOpacity={0.7}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>
                {localizedContent.post_job[lang]?.view_all || 'View All'}
              </Text>
              <Icon name="chevron-right" size={16} color="#4A6CD4" />
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#4A6CD4" />
              <Text style={styles.loadingText}>Loading services...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle-outline" size={48} color="#FF6B6B" />
              <Text style={styles.errorTitle}>Oops!</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                onPress={handleRefresh}
                style={styles.retryButton}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#4A6CD4', '#3A5BC7']}
                  style={styles.retryButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="refresh" size={18} color="#fff" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            renderActionGrid()
          )}
        </View>

        {/* Post Job Card */}
        <PostJobItem navigation={navigation} lang={lang} />

        {/* Premium Membership Card */}
        <Animatable.View
          animation="fadeInUp"
          delay={800}
          duration={600}
          style={styles.promoSection}
        >
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.promoCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.promoBackgroundPattern} />
            <View style={styles.promoContent}>
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>
                  {localizedContent.post_job[lang]?.premium_title || 'Premium Membership'}
                </Text>
                <Text style={styles.promoText}>
                  {localizedContent.post_job[lang]?.premium_text || 'Get 50% more visibility for your services'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.promoButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#fff', '#f7f7f7']}
                  style={styles.promoButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.promoButtonText}>Upgrade Now</Text>
                  <Icon name="rocket-launch" size={16} color="#667EEA" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
  );
};


// Enhanced ActionButton Component with Solid Background
const ActionButton = ({ emoji, icon, label, onPress, index }) => (
  <TouchableOpacity 
    onPress={onPress}   
    style={styles.actionButton}
    activeOpacity={0.8}
  >
    <Animatable.View
      animation="bounceIn"
      delay={index * 150}
      duration={800}
      style={styles.actionTile}
    >
      <View style={styles.tileGradient}>
        {emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : icon ? (
          <Ionicons name={icon} size={26} color="#6B8CE6" /> 
        ) : (
          <Icon name="apps" size={26} color="#6B8CE6" /> 
        )}
      </View>
    </Animatable.View>
    
    <Text style={styles.actionLabel} numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);
// Enhanced PostJobItem Component
const PostJobItem = ({ navigation, lang }) => {
  const [text, setText] = useState({
    title: 'Post Your Job FREE',
    subtitle: 'Find the right talent quickly',
    button: 'Post Now',
  });

  const [UserId, setUserId] = useState('');

  useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem('id');
      setUserId(id);
    };
    loadUserId();
  }, []);

  useEffect(() => {
    const loadLocalizedText = async () => {
      const currentLang = await AsyncStorage.getItem('appLanguage') || 'en';
      const raw = await AsyncStorage.getItem('localizedContent');

      if (raw) {
        const json = JSON.parse(raw);
        if (json?.post_job?.[currentLang]) {
          setText(json.post_job[currentLang]);
        }
      }
    };
    loadLocalizedText();
  }, [lang]);

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={500}
      duration={600}
      style={styles.postJobContainer}
    >
      <LinearGradient
        colors={['#4A6CD4', '#3A5BC7', '#2A4BBA']}
        style={styles.postJobCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.postJobBackgroundPattern} />
        <View style={styles.postJobContent}>
          <View style={styles.postJobIconContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.postJobIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="briefcase-plus" size={26} color="#fff" />
            </LinearGradient>
          </View>

          <View style={styles.postJobTextContainer}>
            <Text style={styles.postJobTitle}>{text.title}</Text>
            <Text style={styles.postJobSubtitle}>{text.subtitle}</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate(UserId ? 'PostJobScreen' : 'LoginScreen')}
            style={styles.postJobButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ffffff', '#f7f7f7']}
              style={styles.postJobButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.postJobButtonText}>{text.button}</Text>
              <Icon name="arrow-right" size={16} color="#4A6CD4" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animatable.View>
  );
};

// Enhanced Styles with Light Blue-Gray Border for Icon Boxes Only
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFF' 
  },
  header: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 100, 
    paddingTop: Platform.OS === 'ios' ? 60 : 30, 
    paddingHorizontal: 20, 
    overflow: 'hidden', 
    borderBottomLeftRadius: 25, 
    borderBottomRightRadius: 25 
  },
  headerBackgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 15 
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  menuButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  userGreeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A6CD4',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  searchBarContainer: {
    marginBottom: -25,
  },
  searchBarTouchable: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  searchBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchIcon: { 
    marginRight: 12 
  },
  fakeInput: { 
    color: '#718096', 
    fontSize: 16, 
    flex: 1, 
    fontWeight: '500' 
  },
  searchBadge: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  searchBadgeText: {
    color: '#4A5568',
    fontSize: 12,
    fontWeight: '600',
  },
  content: { 
    paddingTop: 180, 
    paddingBottom: 40 
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20, 
    paddingHorizontal: 20 
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#2D3748',
    letterSpacing: -0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#EDF2F7',
  },
  viewAllText: { 
    color: '#4A6CD4', 
    fontWeight: '600', 
    fontSize: 14,
    marginRight: 4,
  },
  quickActionsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    marginBottom: 10 
  },
  actionButton: { 
    alignItems: 'center', 
    width: '23%', 
    marginBottom: 20 
  },
  actionTile: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 10,
  },
 tileGradient: {
  width: 70,
  height: 70,
  borderRadius: 20,
  justifyContent: 'center',
  alignItems: 'center',
  // Light blue-gray border for icon boxes only
  borderWidth: 1.5,
  borderColor: '#BBCDE6', // Light blue-gray color
  backgroundColor: '#F0F3F7', // Light blue-gray background color
},
  emoji: {
    fontSize: 28,
  },
  actionLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#4A5568', 
    textAlign: 'center', 
    paddingHorizontal: 2,
    lineHeight: 16,
  },
  postJobContainer: { 
    paddingHorizontal: 20, 
    marginBottom: 25 
  },
  postJobCard: { 
    borderRadius: 20, 
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  postJobBackgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  postJobContent: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  postJobIconContainer: {
    marginRight: 16,
  },
  postJobIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  postJobTextContainer: { 
    flex: 1 
  },
  postJobTitle: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 18,
    marginBottom: 4,
  },
  postJobSubtitle: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 14,
    fontWeight: '500',
  },
  postJobButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  postJobButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  postJobButtonText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#4A6CD4' 
  },
  loaderContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 60 
  },
  loadingText: {
    marginTop: 12,
    color: '#718096',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: { 
    color: '#718096', 
    fontSize: 14, 
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    marginLeft: 8,
    fontSize: 14,
  },
  promoSection: { 
    paddingHorizontal: 20 
  },
  promoCard: { 
    borderRadius: 20, 
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  promoBackgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  promoContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  promoTextContainer: { 
    flex: 1,
    marginRight: 16,
  },
  promoTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 6 
  },
  promoText: { 
    color: 'rgba(255,255,255,0.9)', 
    fontSize: 14, 
    fontWeight: '500',
    lineHeight: 20,
  },
  promoButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  promoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  promoButtonText: { 
    color: '#667EEA', 
    fontWeight: '700', 
    fontSize: 14 
  },
  svgPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default HomeScreen;