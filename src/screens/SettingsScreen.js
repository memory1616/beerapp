/**
 * Beer POS Mobile - Settings Screen
 * Màn hình cài đặt ứng dụng
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SystemAPI, SettingsAPI } from '../services/api';

const DEFAULT_SERVER_URL = 'http://localhost:3000';

export default function SettingsScreen() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [appVersion, setAppVersion] = useState('1.0.0');

  // Load saved settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const savedUrl = await AsyncStorage.getItem('serverBaseUrl');
      if (savedUrl) {
        setServerUrl(savedUrl);
      }
      setConnectionStatus(null);
    } catch (error) {
      console.log('Error loading settings:', error);
    }
    setLoading(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);

    try {
      const result = await SystemAPI.ping();
      if (result.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
    }

    setTesting(false);
  };

  const handleSaveServerUrl = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ server');
      return;
    }

    // Basic URL validation
    let url = serverUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }

    try {
      await SettingsAPI.setServerUrl(url);
      setServerUrl(url);
      Alert.alert('Thành công', 'Đã lưu địa chỉ server');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
    }
  };

  const handleOpenBrowser = () => {
    Linking.openURL(serverUrl);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Server Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kết nối Server</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Địa chỉ Server</Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://localhost:3000"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#1a365d" />
              ) : (
                <Text style={styles.buttonSecondaryText}>Kiểm tra</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSaveServerUrl}
            >
              <Text style={styles.buttonPrimaryText}>Lưu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonOutline]}
              onPress={handleOpenBrowser}
            >
              <Text style={styles.buttonOutlineText}>Mở web</Text>
            </TouchableOpacity>
          </View>

          {/* Connection Status */}
          {connectionStatus && (
            <View style={[
              styles.statusBox,
              connectionStatus === 'success' ? styles.statusSuccess : styles.statusError
            ]}>
              <Text style={[
                styles.statusText,
                connectionStatus === 'success' ? styles.statusTextSuccess : styles.statusTextError
              ]}>
                {connectionStatus === 'success' ? '✓ Kết nối thành công!' : '✕ Không kết nối được'}
              </Text>
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin ứng dụng</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phiên bản</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên ứng dụng</Text>
            <Text style={styles.infoValue}>Beer POS Mobile</Text>
          </View>
        </View>

        {/* Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hướng dẫn</Text>

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Cách sử dụng</Text>
            <Text style={styles.helpText}>
              1. Đảm bảo server Beer POS đang chạy{'\n'}
              2. Nhập địa chỉ server và nhấn "Lưu"{'\n'}
              3. Kiểm tra kết nối bằng nút "Kiểm tra"{'\n'}
              4. Bắt đầu sử dụng ứng dụng
            </Text>
          </View>

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Mặc định</Text>
            <Text style={styles.helpText}>
              Server: http://localhost:3000{'\n'}
              {'\n'}
              Thay đổi theo IP server thực tế của bạn.
            </Text>
          </View>
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              Alert.alert(
                'Đặt lại cài đặt',
                'Bạn có chắc muốn đặt lại về mặc định?',
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Đặt lại',
                    style: 'destructive',
                    onPress: async () => {
                      await AsyncStorage.removeItem('serverBaseUrl');
                      setServerUrl(DEFAULT_SERVER_URL);
                      Alert.alert('Thành công', 'Đã đặt lại cài đặt');
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.resetButtonText}>Đặt lại cài đặt</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a365d',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  // Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  // Input
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#1a365d',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  buttonSecondaryText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1a365d',
  },
  buttonOutlineText: {
    color: '#1a365d',
    fontWeight: '600',
    fontSize: 14,
  },

  // Status
  statusBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: '#dcfce7',
  },
  statusError: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusTextSuccess: {
    color: '#166534',
  },
  statusTextError: {
    color: '#991b1b',
  },

  // Info
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Help
  helpCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 22,
  },

  // Reset
  resetButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
});
