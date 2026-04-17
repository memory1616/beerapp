/**
 * Beer POS Mobile - Common UI Components
 * Các component UI dùng chung
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

// ==================== BUTTON ====================

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) {
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    disabled && styles.button_disabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`buttonText_${variant}`],
    styles[`buttonText_${size}`],
    disabled && styles.buttonText_disabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : '#1a365d'}
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ==================== CARD ====================

export function Card({ children, style, onPress }) {
  const content = (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ==================== BADGE ====================

export function Badge({ text, variant = 'default', style }) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], style]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`]]}>
        {text}
      </Text>
    </View>
  );
}

// ==================== DIVIDER ====================

export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  // Button
  button: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_primary: {
    backgroundColor: '#1a365d',
  },
  button_secondary: {
    backgroundColor: '#f0f0f0',
  },
  button_success: {
    backgroundColor: '#4ade80',
  },
  button_danger: {
    backgroundColor: '#dc2626',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1a365d',
  },
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  button_medium: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  button_large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  button_disabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonText_primary: {
    color: '#fff',
  },
  buttonText_secondary: {
    color: '#333',
  },
  buttonText_success: {
    color: '#fff',
  },
  buttonText_danger: {
    color: '#fff',
  },
  buttonText_outline: {
    color: '#1a365d',
  },
  buttonText_small: {
    fontSize: 13,
  },
  buttonText_medium: {
    fontSize: 15,
  },
  buttonText_large: {
    fontSize: 17,
  },
  buttonText_disabled: {
    opacity: 0.7,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badge_default: {
    backgroundColor: '#f0f0f0',
  },
  badge_success: {
    backgroundColor: '#dcfce7',
  },
  badge_warning: {
    backgroundColor: '#fef3c7',
  },
  badge_danger: {
    backgroundColor: '#fee2e2',
  },
  badgeInfo: {
    backgroundColor: '#dbeafe',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeText_default: {
    color: '#666',
  },
  badgeText_success: {
    color: '#166534',
  },
  badgeText_warning: {
    color: '#92400e',
  },
  badgeText_danger: {
    color: '#991b1b',
  },
  badgeTextInfo: {
    color: '#1e40af',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 12,
  },
});
