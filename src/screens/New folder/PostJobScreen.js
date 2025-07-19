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
  Alert,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from './BaseUrl';

const { width } = Dimensions.get('window');

const AutoSlidingImage = ({ images }) => {
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, images]);

  return (
    <View style={styles.imageSliderWrapper}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
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
    </View>
  );
};

const PostJobScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const loadUserIdAndFetch = async () => {
      const id = await AsyncStorage.getItem('id');
      setUserId(id);
      await fetchJobs(id);
    };
    loadUserIdAndFetch();
  }, []);

  const fetchJobs = async (user_Id) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/get_business_details.php?id=${user_Id}`);
      const json = await response.json();
      setJobs(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error('Fetch error:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseProject = async (businessId) => {
    Alert.alert(
      'Confirm',
      'Are you sure you want to close this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Project',
          style: 'destructive',
          onPress: async () => {
            try {
              setClosingId(businessId);
              const response = await fetch(`${BASE_URL}/api/close_business.php?id=${businessId}`);
              const result = await response.json();

              if (result.success) {
                await fetchJobs(userId); // Refresh jobs
                Alert.alert('Success', 'Project closed successfully.');
              } else {
                Alert.alert('Error', result.error || 'Failed to close the project.');
              }
            } catch (error) {
              console.error('Error closing project:', error);
              Alert.alert('Error', 'Failed to close the project.');
            } finally {
              setClosingId(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  console.log(jobs);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0047ab" />
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No jobs found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <TouchableOpacity style={styles.backButtonTop} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0047ab" />
          <Text style={styles.backButtonTopText}>Back</Text>
        </TouchableOpacity>

        {jobs.map((job, index) => {
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
          } = job;

          const readableDate = created_at ? new Date(created_at).toLocaleDateString() : 'N/A';
          const statusStr = String(status);


          const statusText = statusStr === '1' ? 'Open' : 'Closed';
          const statusColor = statusStr === '1' ? 'green' : 'red';
          const statusIcon = statusStr === '1' ? 'check-circle' : 'cancel';


          return (
            <View key={index} style={styles.card}>
              {statusStr === '0' && (
                <View style={styles.closedBadge}>
                  <Text style={styles.closedText}>Closed</Text>
                </View>
              )}
              <View style={styles.businessHeader}>
                <Text style={styles.businessTitle}>{businessName || 'No Title'}</Text>


                {String(job.status).trim() === '1' && (
                  <TouchableOpacity
                    style={styles.editIcon}
                    onPress={() => navigation.navigate('Job Edit', { jobData: jobs[index] })}
                  >
                    <Ionicons name="create-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                )}


              </View>

              <Text style={styles.subheading}>{category || 'N/A'} • {subcategory || 'N/A'}</Text>

              {images && images.length > 0 ? (
                <AutoSlidingImage images={images} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>No Image</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                <MaterialIcons name={statusIcon} size={24} color={statusColor} />
                <Text style={{ marginLeft: 8, fontSize: 16, color: statusColor }}>{statusText}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="date-range" size={20} color="#334155" style={styles.icon} />
                <View>
                  <Text style={styles.detailLabel}>Posted On</Text>
                  <Text style={styles.detailValue}>{readableDate}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MaterialIcons name="description" size={20} color="#334155" style={styles.icon} />
                <View>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{description || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color="#334155" style={styles.icon} />
                <View>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>
                    {village || 'N/A'}, {block || ''}, {district || ''} - {pinCode || ''}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={20} color="#334155" style={styles.icon} />
                <View>
                  <Text style={styles.detailLabel}>Contact</Text>
                  <Text style={styles.detailValue}>{mobile || 'N/A'}</Text>
                </View>
              </View>

              {statusStr === '1' && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => handleCloseProject(id)}
                  disabled={closingId === id}
                >
                  <Text style={styles.closeButtonText}>
                    {closingId === id ? 'Closing...' : 'Close Project'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default PostJobScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0047ab',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButtonTopText: {
    color: '#0047ab',
    fontSize: 18,
    marginLeft: 8,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  closedBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
    zIndex: 5,
  },
  closedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 10,
  },
  editIcon: {
    backgroundColor: '#0047ab',
    padding: 6,
    borderRadius: 8,
  },
  subheading: {
    fontSize: 14,
    color: '#334155',
    marginTop: 5,
    marginBottom: 10,
  },
  imageSliderWrapper: {
    width: width - 30,
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 15,
  },
  image: {
    width: width - 30,
    height: 200,
  },
  imagePlaceholder: {
    width: width - 30,
    height: 200,
    backgroundColor: '#cbd5e1',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  imagePlaceholderText: {
    color: '#64748b',
    fontSize: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  detailLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: '#475569',
  },
  detailValue: {
    color: '#334155',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#dc2626',
    marginTop: 15,
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
