import React from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar,
    Linking,
    Share,
    Alert,
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import { PROFILE_IMAGE_URL } from './BaseUrl';

const VoiceSearchListDisply = ({ route, navigation }) => {
    const { results } = route.params;

    const handleCall = (phone) => {
        if (phone) Linking.openURL(`tel:${phone}`);
        else Alert.alert('Error', 'Phone number not available');
    };

    const handleSendEnquiry = (phone, name) => {
        if (phone) {
            const message = `Hello ${name}, I'm interested in your business listing.`;
            Linking.openURL(`sms:${phone}?body=${encodeURIComponent(message)}`);
        }
    };

    const handleShare = (item) => {
        const message = `Check out ${item.business_name} at ${item.location.village}, ${item.location.block}, ${item.location.district}, ${item.location.pin_code}. Contact: ${item.contact.mobile}`;
        Share.share({ message });
    };

    const openWhatsApp = async (phone, message) => {
        if (!phone) {
            Alert.alert('Error', 'Phone number is not available.');
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
            Alert.alert('Error', 'Failed to open WhatsApp.');
        }
    };

    const renderItem = ({ item }) => {
        const whatsappMessage = `Hello ${item.contact.user?.name || ''}, I'm interested in your business listing.`;

        return (
            <TouchableOpacity
                style={styles.cardContainer}
                onPress={() => navigation.navigate('ViewJobScreen', { 
                    data: item,
                    image: item.images.all?.[0] ?? null 
                })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.businessName}>{item.business_name}</Text>
                    <TouchableOpacity onPress={() => handleShare(item)}>
                        <Icon2 name="share-alt" size={20} color="#5c6bc0" />
                    </TouchableOpacity>
                </View>

                {item.images.all?.[0] ? (
                    <Image
                        source={{ uri: item.images.all[0] }}
                        style={styles.businessImage}
                    />
                ) : (
                    <View style={[styles.businessImage, styles.noImage]}>
                        <Icon name="image" size={40} color="#b0b0b0" />
                    </View>
                )}

                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <Icon name="location-on" size={16} color="#5c6bc0" />
                        <Text style={styles.infoText}>
                            {item.location.village}, {item.location.block}, {item.location.district}, {item.location.pin_code}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Icon name="phone" size={16} color="#5c6bc0" />
                        <Text style={styles.infoText}>{item.contact.mobile || 'N/A'}</Text>
                    </View>

                    <View style={styles.ratingContainer}>
                        <View style={styles.ratingBadge}>
                            <Icon name="star" size={14} color="#FFF" />
                            <Text style={styles.ratingText}>{item.meta.ratings || '0.0'}</Text>
                        </View>
                        <Text style={styles.ratingCount}>Ratings</Text>
                    </View>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.actionButtonsContainer}
                >
                    <TouchableOpacity
                        style={[styles.actionButton, styles.callButton]}
                        onPress={() => handleCall(item.contact.mobile)}
                    >
                        <Icon name="call" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.whatsappButton]}
                        onPress={() => openWhatsApp(item.contact.mobile, whatsappMessage)}
                        onLongPress={() => {
                            Clipboard.setString(whatsappMessage);
                            Alert.alert('Copied', 'Message copied to clipboard!');
                        }}
                    >
                        <Icon2 name="whatsapp" size={16} color="#fff" />
                        <Text style={styles.buttonText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.enquiryButton]}
                        onPress={() => handleSendEnquiry(item.contact.mobile, item.contact.user?.name)}
                    >
                        <Icon name="email" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Enquiry</Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#5878dd" barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.headerButton, { marginLeft: 20, marginTop: 25 }]}
                    onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { marginTop: 25 }]} numberOfLines={1}>
                    Voice Search Results
                </Text>
            </View>

            {results.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="search-off" size={50} color="#e0e0e0" />
                    <Text style={styles.emptyText}>No results found</Text>
                    <Text style={styles.emptySubtext}>Try a different search term</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7ff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#5878dd',
        paddingVertical: 15,
        paddingHorizontal: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    listContent: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    cardContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#3f51b5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    businessName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3748',
        flex: 1,
    },
    businessImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: '#f0f4ff',
    },
    noImage: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eef2ff',
        borderWidth: 1,
        borderColor: '#e0e7ff',
    },
    infoContainer: {
        marginTop: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#4a5568',
        marginLeft: 8,
        flex: 1,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    ratingBadge: {
        flexDirection: 'row',
        backgroundColor: '#4caf50',
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '600',
        marginLeft: 5,
    },
    ratingCount: {
        fontSize: 13,
        color: '#718096',
        marginLeft: 10,
    },
    actionButtonsContainer: {
        marginTop: 15,
        paddingBottom: 5,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        marginRight: 12,
    },
    callButton: {
        backgroundColor: '#3f51b5',
    },
    whatsappButton: {
        backgroundColor: '#25D366',
    },
    enquiryButton: {
        backgroundColor: '#ff9800',
    },
    buttonText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#a0aec0',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#cbd5e0',
        marginTop: 5,
    },
});

export default VoiceSearchListDisply;