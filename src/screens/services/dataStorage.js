// services/dataStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../BaseUrl';

// ✅ API endpoint
const API_URL = `${BASE_URL}/api/BusinessLoadingDateForSearch.php`;

class DataStorageService {
  constructor() {
    this.isSyncing = false;
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24 hours default
    this.autoRefreshThreshold = 60 * 60 * 1000; // 1 hour for auto refresh
  }

  /**
   * 🔹 Fetch data from API
   */
  fetchDataFromAPI = async () => {
    try {
      console.log('🔄 Fetching data from API...');
      const { data } = await axios.get(API_URL, { timeout: 30000 });
      console.log('🔹 API Response received');

      if (data?.success && data?.data) {
        await this.storeCompleteData(data);
        console.log('✅ Data fetched and stored successfully');
        return data;
      } else {
        console.warn('⚠️ API returned empty or invalid data');
        // Store empty arrays to prevent AsyncStorage [] issue
        const emptyData = { 
          data: { 
            businesses: [], 
            categories: [] 
          }, 
          success: false 
        };
        await this.storeCompleteData(emptyData);
        return emptyData;
      }
    } catch (error) {
      console.error('❌ API fetch error:', error.message);
      // Fallback: store empty arrays to avoid AsyncStorage [] issue
      const emptyData = { 
        data: { 
          businesses: [], 
          categories: [] 
        }, 
        success: false 
      };
      await this.storeCompleteData(emptyData);
      throw error;
    }
  };

  /**
   * 💾 Store API data in AsyncStorage with expiry
   */
  storeCompleteData = async (apiData) => {
    try {
      const timestamp = Date.now();
      const cacheData = {
        ...apiData,
        _cachedAt: timestamp,
        _expiresAt: timestamp + this.cacheDuration,
      };

      await AsyncStorage.multiSet([
        ['complete_api_data', JSON.stringify(cacheData)],
        ['all_businesses', JSON.stringify(apiData.data.businesses || [])],
        ['all_categories', JSON.stringify(apiData.data.categories || [])],
        ['last_sync_timestamp', timestamp.toString()],
      ]);

      console.log('💾 Data cached successfully');
      return true;
    } catch (error) {
      console.error('❌ Storage error:', error.message);
      throw error;
    }
  };

  /**
   * 🏢 Get all businesses
   */
  getAllBusinesses = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        const fresh = await this.getData(true);
        return fresh.data.businesses || [];
      }

      const json = await AsyncStorage.getItem('all_businesses');
      const businesses = json ? JSON.parse(json) : [];

      // If empty, fetch fresh data automatically
      if (!businesses || businesses.length === 0) {
        console.log('🚨 Businesses empty, fetching fresh data...');
        const fresh = await this.getData(true);
        return fresh.data.businesses || [];
      }

      return businesses;
    } catch (error) {
      console.error('❌ Error loading businesses:', error.message);
      return [];
    }
  };

  /**
   * 🗂️ Get all categories
   */
  getAllCategories = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        const fresh = await this.getData(true);
        return fresh.data.categories || [];
      }

      const json = await AsyncStorage.getItem('all_categories');
      const categories = json ? JSON.parse(json) : [];

      // If empty, fetch fresh data automatically
      if (!categories || categories.length === 0) {
        console.log('🚨 Categories empty, fetching fresh data...');
        const fresh = await this.getData(true);
        return fresh.data.categories || [];
      }

      return categories;
    } catch (error) {
      console.error('❌ Error loading categories:', error.message);
      return [];
    }
  };

  /**
   * 📦 Get complete cached data (checks expiry)
   */
  getCompleteData = async () => {
    try {
      const json = await AsyncStorage.getItem('complete_api_data');
      if (!json) {
        console.log('📦 No cached data found');
        return null;
      }

      const data = JSON.parse(json);
      
      // Check if cache expired
      if (data._expiresAt && Date.now() > data._expiresAt) {
        console.warn('⚠️ Cache expired');
        await this.clearAllData(); // Clear expired data
        return null;
      }

      console.log('📦 Using cached data');
      return data;
    } catch (error) {
      console.error('❌ Error reading cached data:', error.message);
      return null;
    }
  };

  /**
   * 🧠 Smart data fetcher — uses cache or refreshes
   */
  getData = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cachedData = await this.getCompleteData();
        if (cachedData) {
          console.log('📦 Using cached data');
          return cachedData;
        }
      }

      console.log('🌐 Fetching fresh data from API...');
      const freshData = await this.fetchDataFromAPI();
      return freshData;
    } catch (error) {
      console.error('❌ Fetch error:', error.message);
      
      // Try to get expired cache as fallback
      const fallback = await this.getExpiredCacheAsFallback();
      if (fallback) {
        console.log('⚙️ Using fallback (expired cache)');
        return fallback;
      }
      
      throw error;
    }
  };

  /**
   * 🔄 Force refresh all data (logout scenario)
   */
  forceRefreshAllData = async () => {
    try {
      console.log('🔄 Force refreshing all data...');
      await this.clearAllData();
      const freshData = await this.fetchDataFromAPI();
      console.log('✅ Force refresh completed');
      return freshData;
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      throw error;
    }
  };

  /**
   * 🔍 Check if data needs refresh (app reopen scenario)
   */
  shouldRefreshData = async () => {
    try {
      const cachedData = await this.getCompleteData();
      if (!cachedData) {
        console.log('🔍 No cache found - needs refresh');
        return true;
      }
      
      // Check if cache is older than auto-refresh threshold
      const cacheAge = Date.now() - cachedData._cachedAt;
      const needsRefresh = cacheAge > this.autoRefreshThreshold;
      
      console.log(`🔍 Cache age: ${(cacheAge / (60 * 1000)).toFixed(2)} minutes, Needs refresh: ${needsRefresh}`);
      return needsRefresh;
    } catch (error) {
      console.error('❌ Error checking refresh need:', error);
      return true; // Error case mein refresh karo
    }
  };

  /**
   * 🧠 Smart app startup data loader
   */
  initializeAppData = async () => {
    try {
      console.log('🚀 Initializing app data...');
      
      const needsRefresh = await this.shouldRefreshData();
      
      if (needsRefresh) {
        console.log('🔄 App start: Refreshing data...');
        return await this.getData(true);
      } else {
        console.log('📦 App start: Using cached data');
        return await this.getData(false);
      }
    } catch (error) {
      console.error('❌ App data initialization failed:', error);
      
      // Final fallback - try to get any cached data
      try {
        const fallbackData = await this.getExpiredCacheAsFallback();
        if (fallbackData) {
          console.log('🆘 Using expired cache as last resort');
          return fallbackData;
        }
      } catch (fallbackError) {
        console.error('❌ Even fallback failed:', fallbackError);
      }
      
      // Return empty data structure as last resort
      return {
        data: { businesses: [], categories: [] },
        success: false,
        _isFallback: true
      };
    }
  };

  /**
   * 🆘 Get expired cache as fallback (when API fails)
   */
  getExpiredCacheAsFallback = async () => {
    try {
      const json = await AsyncStorage.getItem('complete_api_data');
      if (!json) return null;

      const data = JSON.parse(json);
      console.log('🆘 Using expired cache as fallback');
      return data;
    } catch (error) {
      console.error('❌ Error getting expired cache:', error);
      return null;
    }
  };

  /**
   * 🕒 Get cache info (for debugging)
   */
  getCacheInfo = async () => {
    try {
      const json = await AsyncStorage.getItem('complete_api_data');
      if (!json) return { exists: false };

      const data = JSON.parse(json);
      const now = Date.now();
      const cacheAge = now - data._cachedAt;
      const expiresIn = data._expiresAt - now;

      return {
        exists: true,
        cachedAt: new Date(data._cachedAt).toLocaleString(),
        expiresAt: new Date(data._expiresAt).toLocaleString(),
        cacheAge: Math.round(cacheAge / (60 * 1000)), // minutes
        expiresIn: Math.round(expiresIn / (60 * 1000)), // minutes
        isExpired: now > data._expiresAt,
        businessesCount: data.data?.businesses?.length || 0,
        categoriesCount: data.data?.categories?.length || 0,
      };
    } catch (error) {
      console.error('❌ Error getting cache info:', error);
      return { exists: false, error: error.message };
    }
  };

  /**
   * ⚙️ Update cache duration
   */
  setCacheDuration = (hours) => {
    this.cacheDuration = hours * 60 * 60 * 1000;
    console.log(`⚙️ Cache duration set to ${hours} hours`);
  };

  /**
   * ⚙️ Update auto-refresh threshold
   */
  setAutoRefreshThreshold = (minutes) => {
    this.autoRefreshThreshold = minutes * 60 * 1000;
    console.log(`⚙️ Auto-refresh threshold set to ${minutes} minutes`);
  };

  /**
   * 🗑️ Clear all cached data
   */
  clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        'complete_api_data',
        'all_businesses',
        'all_categories',
        'last_sync_timestamp',
      ]);
      console.log('🧹 All cache cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing cache:', error.message);
      return false;
    }
  };

  /**
   * 🔄 Manual sync - with protection against multiple syncs
   */
  manualSync = async () => {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress...');
      return { success: false, message: 'Sync already in progress' };
    }

    this.isSyncing = true;
    
    try {
      console.log('🔄 Manual sync started...');
      const freshData = await this.fetchDataFromAPI();
      this.isSyncing = false;
      return { success: true, data: freshData };
    } catch (error) {
      this.isSyncing = false;
      console.error('❌ Manual sync failed:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * 📊 Get storage statistics
   */
  getStorageStats = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const businesses = await this.getAllBusinesses();
      const categories = await this.getAllCategories();
      const cacheInfo = await this.getCacheInfo();

      return {
        totalKeys: keys.length,
        businessesCount: businesses.length,
        categoriesCount: categories.length,
        cacheInfo,
        isSyncing: this.isSyncing,
        cacheDuration: this.cacheDuration,
        autoRefreshThreshold: this.autoRefreshThreshold,
      };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return { error: error.message };
    }
  };
}

// ✅ Export singleton instance
const dataStorageService = new DataStorageService();
export default dataStorageService;