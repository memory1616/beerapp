/**
 * Beer POS Mobile - Main App Entry
 * Ứng dụng POS di động cho Beer POS
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { SystemAPI } from './src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== CONNECTION CHECK ====================

function ConnectionStatus({ children }) {
  const [isConnected, setIsConnected] = useState(null);
  const [serverUrl, setServerUrl] = useState('');

  const checkConnection = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('serverBaseUrl');
      const url = savedUrl || 'http://localhost:3000';
      setServerUrl(url);

      // Try to ping the server
      await SystemAPI.ping();
      setIsConnected(true);
    } catch (error) {
      console.log('[Connection] Server not reachable:', error.message);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    // Still checking connection
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a365d" />
        <Text style={styles.loadingText}>Đang kết nối...</Text>
      </View>
    );
  }

  if (isConnected === false) {
    // Show warning but still render app
    return (
      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>
          ⚠️ Không kết nối được server
        </Text>
        <Text style={styles.warningUrl}>{serverUrl}</Text>
      </View>
    );
  }

  return children;
}

// ==================== MAIN APP ====================

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <StoreProvider>
        <ConnectionStatus>
          <AppNavigator />
        </ConnectionStatus>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: '600',
  },
  warningUrl: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
});
