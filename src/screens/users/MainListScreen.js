//MainListScreen.js
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Linking,
    Share,
    Alert,
    ScrollView,
    Animated,
    Easing,
    Dimensions
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from './BaseUrl';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { showMessage } from 'react-native-flash-message';

const { width } = Dimensions.get('window');
const MAIN_LIST_URL = `${BASE_URL}api/users/main-search-display-request.php`;

const MainListScreen = ({ route, navigation }) => {
    const { pinCode, ChildId, searchQuery, childCategoryId, subCategoryId, mainCategoryId, subcategoryLabel, mainCategoryLabel } = route.params || {};

    //console.log('DDD',route.params);   




    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pin, setPin] = useState('');
    const [filterText, setFilterText] = useState('');
    const [showFilterInput, setShowFilterInput] = useState(false);
    const [filterAnim] = useState(new Animated.Value(0));

//console.log('route.params',businesses);  

    useEffect(() => {
        const fetchPin = async () => {
            try {
                if (pinCode) {
                    setPin(pinCode);
                    return;
                }
                const storedPin = await AsyncStorage.getItem('pin');
                if (storedPin && storedPin !== 'undefined' && storedPin.trim() !== '') {
                    setPin(storedPin);
                }
            } catch (error) {
                console.error('Failed to get pin:', error);
            }
        };
        fetchPin();
    }, []);

    useEffect(() => {
        fetchBusinessList();
    }, [pin]);

    useEffect(() => {
        Animated.timing(filterAnim, {
            toValue: showFilterInput ? 1 : 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true
        }).start();
    }, [showFilterInput]);

    const fetchBusinessList = async () => {
        setLoading(true);

        // 🔹 Check internet connection
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            showMessage({
                message: "No Internet Connection",
                description: "Please check your network and try again.",
                type: "danger",
                duration: 4000,
            });
            setLoading(false);
            setBusinesses([]);
            return;
        }

        try {
            const lang = (await AsyncStorage.getItem('appLanguage')) || 'en';

            const formData = new FormData();

            if (ChildId || childCategoryId) {
                const childId = ChildId ? ChildId : `child${childCategoryId}`;
                formData.append('childrenId', childId);
            } else if (subCategoryId) {
                const subId = `sub${subCategoryId}`;
                formData.append('subcategoryId', subId);
            } else if (mainCategoryId) {
                formData.append('category', mainCategoryId);
            }

            if (pinCode) formData.append('pin_code', pinCode);
            if (searchQuery) formData.append('search_Query', searchQuery);
            formData.append('lang', lang);

            // 🔹 Set timeout for slow connections
            const response = await axios.post(MAIN_LIST_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 10000, // 10 seconds timeout
            });

            setBusinesses(response.data || []);

        } catch (error) {
            console.error('Fetch error:', error);
            setBusinesses([]);

            // Show flash message for error
            showMessage({
                message: "Error",
                description: "Failed to fetch business list. Please try again.",
                type: "warning",
                duration: 4000,
            });
        } finally {
            setLoading(false);
        }
    };

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else showMessage({ message: 'Phone number not available', type: 'warning', duration: 3000 });
};

const handleSendEnquiry = (phone, name) => {
    if (phone) {
        const message = `Hello ${name}, I'm interested in your business listing.`;
        Linking.openURL(`sms:${phone}?body=${encodeURIComponent(message)}`);
    } else {
        showMessage({ message: 'Phone number not available', type: 'warning', duration: 3000 });
    }
};

const handleShare = (item) => {
    const message = `Check out ${item.businessName} at ${item.user_village}, ${item.user_block}, ${item.pin}. Contact: ${item.mobile_user}`;
    Share.share({ message });
};

const openWhatsApp = async (phone, message) => {
    if (!phone) {
        showMessage({ message: 'Phone number is not available', type: 'warning', duration: 3000 });
        return;
    }
    const phoneNumber = phone.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    const fallbackUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    try {
        const supported = await Linking.canOpenURL('whatsapp://send');
        if (supported) {
            await Linking.openURL(url);
        } else {
            await Linking.openURL(fallbackUrl);
        }
    } catch (err) {
        showMessage({ message: 'Failed to open WhatsApp', type: 'danger', duration: 3000 });
    }
};

// Updated openDirections function that accepts item data
const openDirections = (item) => {
    if (item.latitude && item.longitude) {
        const lat = parseFloat(item.latitude);
        const lng = parseFloat(item.longitude);
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        
        Linking.openURL(url).catch(() => {
            showMessage({ message: 'Failed to open Google Maps', type: 'danger', duration: 3000 });
        });
    } else {
        // Fallback to address-based directions
        const address = `${item.user_village}, ${item.user_block}, ${item.pin}`;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
        
        Linking.openURL(url).catch(() => {
            showMessage({ message: 'Failed to open Google Maps', type: 'danger', duration: 3000 });
        });
    }
};

const filteredData = businesses.filter(item =>
    item?.block?.toLowerCase().includes(filterText.toLowerCase()) ||
    item?.pinCode?.includes(filterText)
);

const renderItem = ({ item }) => {
    const userPhone = item.mobile_user || item.mobile;
    const whatsappMessage = `Hello ${item.name || ''}, I'm interested in your business listing.`;

    console.log(item);

    return (
        <TouchableOpacity
            style={styles.cardContainer}
            onPress={() => navigation.navigate('ViewJobScreen', { data: item, image: item.images?.[0]?.path ?? null })}
        >
            <View style={styles.cardContent}>
                <View style={styles.imageContainer}>
                    {item.images?.[0]?.path ? (
                        <Image
                            source={{ uri: `${BASE_URL}/images/${item.images[0].path}` }}
                            style={styles.businessImage}
                        />
                    ) : (
                        <View style={[styles.businessImage, styles.noImage]}>
                            <Icon name="image" size={30} color="#dbe4ff" />
                            <Text style={styles.noImageText}>No Image</Text>
                        </View>
                    )}
                </View>

                <View style={styles.textContainer}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.businessName} numberOfLines={2}>
                            {item.businessName}
                        </Text>
                        <TouchableOpacity onPress={() => handleShare(item)} style={styles.shareButton}>
                            <Icon2 name="share-alt" size={18} color="#7c8db5" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoContainer}>
                        <View style={styles.infoRow}>
                            <Icon name="location-on" size={14} color="#4A6CF7" />
                            <Text style={styles.infoText}>
                                {item.user_village || ''},{"\n"}
                                {item.user_block || ''},{"\n"}
                                {item.pin || ''}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Icon name="phone" size={14} color="#4A6CF7" />
                            <Text style={styles.infoText}>{userPhone || 'N/A'}</Text>
                        </View>

                        <View style={styles.ratingContainer}>
                            <View style={styles.ratingBadge}>
                                <Icon name="star" size={12} color="#FFF" />
                                <Text style={styles.ratingText}>{item.averageRating || '0.0'}</Text>
                            </View>
                            <Text style={styles.ratingCount}>({item.ratingCount || '0'})</Text>
                        </View>
                    </View>
                </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionButtonsContainer}>
                <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={() => handleCall(userPhone)}>
                    <Icon name="call" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.whatsappButton]} onPress={() => openWhatsApp(userPhone, whatsappMessage)}>
                    <Icon2 name="whatsapp" size={16} color="#fff" />
                    <Text style={styles.buttonText}>WhatsApp</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.actionButton, styles.shareButtonAction]} onPress={() => handleShare(item)}>
                    <Icon2 name="share-alt" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Share</Text>
                </TouchableOpacity>

                {/* Updated: Pass the entire item object to openDirections */}
                <TouchableOpacity style={[styles.actionButton, styles.directionButton]} onPress={() => openDirections(item)}>
                    <Icon2 name="location-arrow" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Directions</Text>
                </TouchableOpacity>
            </ScrollView>
        </TouchableOpacity>
    );
};

    const filterHeight = filterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50] });
    const filterOpacity = filterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#4A6CF7" barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.headerTitle} numberOfLines={1}>
                    {mainCategoryLabel || subcategoryLabel}
                </Text>

                <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilterInput(!showFilterInput)}>
                    <Icon name={showFilterInput ? "close" : "filter-list"} size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <Animated.View style={[styles.filterContainer, {
                height: filterHeight,
                opacity: filterOpacity,
                transform: [{ translateY: filterAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
            }]}>
                <View style={styles.filterInputContainer}>
                    <Icon name="search" size={20} color="#7c8db5" />
                    <TextInput
                        placeholder="Search by block or pin code..."
                        placeholderTextColor="#a6b0cf"
                        value={filterText}
                        onChangeText={setFilterText}
                        style={styles.filterInput}
                    />
                    {filterText.length > 0 && (
                        <TouchableOpacity onPress={() => setFilterText('')}>
                            <Icon name="close" size={18} color="#7c8db5" />
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4A6CF7" />
                    <Text style={styles.loadingText}>Loading businesses...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <Text style={styles.resultsCount}>
                            {filteredData.length} business{filteredData.length !== 1 ? 'es' : ''} found
                        </Text>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyCircle}>
                                <Icon name="search-off" size={40} color="#7c8db5" />
                            </View>
                            <Text style={styles.emptyText}>No businesses found</Text>
                            <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default MainListScreen;



// Styles remain the same as your previous code
const styles = StyleSheet.create({
    shareButtonAction: { backgroundColor: '#7c8db5' },
     directionButton: { backgroundColor: '#4A90E2' },
    container: { flex: 1, backgroundColor: '#f8fafd' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#4A6CF7', paddingVertical: 15, paddingHorizontal: 15, elevation: 8, shadowColor: '#4A6CF7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 25 },
    filterToggle: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 25 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1, textAlign: 'center', marginHorizontal: 10, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, marginTop: 25 },
    filterContainer: { overflow: 'hidden', backgroundColor: '#f8fafd', paddingHorizontal: 16, paddingTop: 5 },
    filterInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 20, height: 50, elevation: 3, shadowColor: '#3f51b5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: '#e9edf9' },
    filterInput: { flex: 1, fontSize: 15, color: '#4a5568', marginLeft: 10, paddingVertical: 12 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    loadingText: { marginTop: 20, color: '#718096', fontSize: 16, fontWeight: '500' },
    listContent: { paddingVertical: 15, paddingHorizontal: 16 },
    resultsCount: { color: '#718096', fontSize: 14, marginBottom: 15, textAlign: 'center', fontWeight: '500' },
    cardContainer: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 20, elevation: 4, shadowColor: '#4A6CF7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, borderWidth: 1, borderColor: '#f1f5ff' },
    cardContent: { flexDirection: 'row', marginBottom: 15 },
    imageContainer: { width: '40%', paddingRight: 15 },
    textContainer: { width: '60%' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    businessName: { fontSize: 16, fontWeight: '700', color: '#2d3748', flex: 1 },
    shareButton: { padding: 6, borderRadius: 12, backgroundColor: '#f0f5ff', marginLeft: 8 },
    businessImage: { width: '100%', height: 150, borderRadius: 10, backgroundColor: '#f5f9ff' },
    noImage: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f5ff', borderWidth: 1, borderColor: '#e9f0ff' },
    noImageText: { color: '#a6b0cf', marginTop: 5, fontSize: 12 },
    infoContainer: { marginTop: 5 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
infoText: { 
    fontSize: 14, 
    color: '#4a5568', 
    marginLeft: 8,    
    flex: 1, 
    fontFamily: 'Verdana' 
},    ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    ratingBadge: { flexDirection: 'row', backgroundColor: '#10b981', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8, alignItems: 'center' },
    ratingText: { fontSize: 12, color: '#FFF', fontWeight: '700', marginLeft: 3 },
    ratingCount: { fontSize: 12, color: '#718096', marginLeft: 5, fontWeight: '500' },
    actionButtonsContainer: { paddingBottom: 5 },
    actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 30, marginRight: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    callButton: { backgroundColor: '#4A6CF7' },
    whatsappButton: { backgroundColor: '#25D366' },
    enquiryButton: { backgroundColor: '#F59E0B' },
    buttonText: { color: '#fff', marginLeft: 8, fontSize: 12, fontWeight: '600' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f5ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#4a5568' },
    emptySubtext: { fontSize: 14, color: '#718096', textAlign: 'center', marginTop: 5 }
});
