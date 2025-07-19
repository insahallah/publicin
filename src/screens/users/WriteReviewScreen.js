import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../BaseUrl';

const WriteReviewScreen = ({ route, navigation }) => {
  const { business, user } = route.params;
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user_id, setId] = useState();

    useEffect(() => {
      
        loadUserID();
   
    }, []);

    const loadUserID = async () => {
    try {
      const id = await AsyncStorage.getItem('id');
     
        setId(id);
   

    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim() || rating === 0) {
      Alert.alert('Validation', 'Please enter a review and select a rating.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}api/users/submit_review.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user_id,
          business_id: business.id,
          review: reviewText.trim(),
          rating: rating,
        }),
      });

      const data = await response.json();
      setLoading(false);

      console.log(response);

      if (response.ok && data.status === 'success') {
        Alert.alert('Success', 'Your review has been submitted.');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message || 'Failed to submit review.');
      }
    } catch (error) {
      console.error('Submit Error:', error);
      Alert.alert('Error', 'Could not submit review.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {business.name}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Write a Review</Text>

      {/* Rating */}
      <Text style={styles.label}>Your Rating</Text>
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color="#FFD700"
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Textarea */}
      <TextInput
        style={styles.textInput}
        multiline
        numberOfLines={5}
        placeholder="Share your experience..."
        value={reviewText}
        onChangeText={setReviewText}
      />

      {/* Loading */}
      {loading && <ActivityIndicator size="large" color="#007bff" style={styles.loader} />}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.button,
          (loading || !reviewText.trim() || rating === 0) && styles.buttonDisabled,
        ]}
        onPress={handleSubmitReview}
        disabled={loading || !reviewText.trim() || rating === 0}
      >
        <Text style={styles.buttonText}>✅ Submit Review</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    flexShrink: 1,
    color: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    color: '#444',
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  star: {
    marginHorizontal: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#f5f5f5',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WriteReviewScreen;
