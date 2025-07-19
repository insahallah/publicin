
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
import { BASE_URL } from './BaseUrl';

const { width: screenWidth } = Dimensions.get('window');

const chunkArray = (arr, size) =>
  arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);

const RemoteSvgIcon = ({ uri, width = 30, height = 30 }) => {
  const [svgXml, setSvgXml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        const res = await fetch(uri);
        const text = await res.text();
        setSvgXml(text);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (uri) fetchSvg();
  }, [uri]);

  if (loading) return <ActivityIndicator size="small" color="#5E7CE2" />;
  if (error || !svgXml) return <Icon name="alert-circle-outline" size={width} color="#FF6B6B" />;

  return <SvgXml xml={svgXml} width={width} height={height} />;
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [quickActions, setQuickActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('en');
  const [scrollY] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 80],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const localizedContent = {
    post_job: {
      en: {
        title: 'Post Your Job FREE',
        subtitle: 'Find the right talent quickly',
        button: 'Post',
        view_all: 'View All',
      },
      hi: {
        title: 'अपना काम पोस्ट करें',
        subtitle: 'सही प्रतिभा जल्दी पाएं',
        button: 'पोस्ट करें',
        view_all: 'सभी देखें',
      },
    },
  };

  const preloadLocalizedContent = async () => {
    const existing = await AsyncStorage.getItem('localizedContent');
    if (!existing) {
      await AsyncStorage.setItem('localizedContent', JSON.stringify(localizedContent));
    }
  };

  const fetchActions = async (langCode) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${BASE_URL}/api/home.php?lang=${langCode}`
      );
      if (response.data.status === 'success') {
        setQuickActions(response.data.data.categories);
      } else {
        setError('Failed to load categories.');
      }
    } catch (err) {
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
      const selectedLang = await AsyncStorage.getItem('appLanguage');
      const langToUse = selectedLang || 'en';
      setLang(langToUse);
      fetchActions(langToUse);
    };
    loadLanguageAndData();
  }, []);

  const handleActionPress = (action) => {
    navigation.navigate('All Categories', { category: action });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#4A6CD4"
        barStyle="light-content"
        translucent={false}
      />

      <Animated.View style={[
        styles.header,
        {
          height: headerHeight,
          opacity: headerOpacity,
        }
      ]}>
        <LinearGradient
          colors={['#4A6CD4', '#3A5BC7']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>PublicIn</Text>
            <Text style={styles.logoSubtext}>Services Marketplace</Text>
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')} 
            style={styles.headerButton}
          >
            <Icon name="bell-outline" size={24} color="#ffffff" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4A6CD4']}
            tintColor="#4A6CD4"
          />
        }
      >
        <View style={styles.searchSection}>
          <TouchableOpacity 
            onPress={() => handleActionPress()}
            activeOpacity={0.9}
          >
            <View style={styles.searchBarContainer}>
              <Icon name="magnify" size={22} color="#777" style={styles.searchIcon} />
              <Text style={styles.fakeInput}>Search services, professionals...</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Services</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('All Categories')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAll}>{localizedContent.post_job[lang]?.view_all || 'View All'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4A6CD4" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={40} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.retryButton}
              activeOpacity={0.7}
            >
              <Icon name="refresh" size={20} color="#4A6CD4" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
       (() => {
  const items = [...quickActions];
  items.push({
    id: 'view_all',
    icon: 'apps', // Ionicon name
    label: localizedContent.post_job[lang]?.view_all || 'View All',
    isViewAll: true,
  });

  return chunkArray(items, 4).map((row, rowIndex) => (
    <View style={styles.quickActions} key={rowIndex}>
      {row.map((action) => {
        const simpleId = action.id.replace(/^cat/, '');
        const cleanId = parseInt(simpleId, 10).toString();

        return (
          <ActionButton
            key={action.id}
            emoji={action.emoji}
            icon={action.icon}
            label={action.label}
            onPress={() =>
              action.isViewAll
                ? navigation.navigate('All Categories')
                : navigation.navigate('All Categories', { id: cleanId })
            }
          />
        );
      })}
    </View>
  ));
})()

        )}

        <PostJobItem navigation={navigation} />

        <View style={styles.promoSection}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.promoCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.promoContent}>
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>Premium Membership</Text>
                <Text style={styles.promoText}>Get 50% more visibility for your services</Text>
              </View>
              <TouchableOpacity 
                style={styles.promoButton}
                activeOpacity={0.8}
              >
                <Text style={styles.promoButtonText}>Upgrade</Text>
                <Icon name="arrow-right" size={16} color="#FF6B6B" style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Animated.ScrollView>
    </View>
  );
};



const ActionButton = ({ emoji, icon, label, onPress }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.actionButton}
    activeOpacity={0.8}
  >
    <Animatable.View
      animation="pulse"
      duration={1000}
      style={styles.tile}
    >
      {emoji ? (
        <Text style={{ fontSize: 32 }}>{emoji}</Text>
      ) : icon ? (
        <Ionicons name={icon} size={28} color="#4A6CD4" />
      ) : null}
    </Animatable.View>
    
    <Text style={styles.actionLabel} numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);

const PostJobItem = ({ navigation }) => {
  const [text, setText] = useState({
    title: 'Post Your Job FREE',
    subtitle: 'Find the right talent quickly',
    button: 'Post',
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
      const lang = (await AsyncStorage.getItem('appLanguage'));
      const raw = await AsyncStorage.getItem('localizedContent');

      if (raw) {
        const json = JSON.parse(raw);
        if (json?.post_job?.[lang]) {
          setText(json.post_job[lang]);
        }
      }
    };
    loadLocalizedText();
  }, []);

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={300}
      duration={600}
      style={styles.postJobContainer}
    >
      <LinearGradient
        colors={['#4A6CD4', '#3A5BC7']}
        style={styles.postJobCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.postJobContent}>
          <View style={styles.postJobIcon}>
            <Icon name="briefcase-plus" size={28} color="#fff" />
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
            <Text style={styles.postJobButtonText}>{text.button}</Text>
            <Icon name="arrow-right" size={16} color="#4A6CD4" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animatable.View>
  );
};

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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 5,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop:25
  },
  logoSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  content: {
    paddingTop: 140,
    paddingBottom: 30,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  fakeInput: {
    color: '#999',
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  viewAll: {
    color: '#4A6CD4',
    fontWeight: '600',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  actionButton: {
    alignItems: 'center',
    width: '23%',
    marginBottom: 15,
  },
  tile: {
    width: 64,
    height: 64,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  postJobContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  postJobCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  postJobContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postJobIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  postJobTextContainer: {
    flex: 1,
  },
  postJobTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  postJobSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  postJobButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postJobButtonText: {
    color: '#4A6CD4',
    fontWeight: '700',
    fontSize: 14,
  },
  promoSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  promoCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  promoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  promoTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  promoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  promoButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoButtonText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 14,
  },
  loaderContainer: {
    paddingVertical: 40,
    justifyContent: 'center',  
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    fontSize: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(74, 108, 212, 0.1)',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#4A6CD4',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HomeScreen;