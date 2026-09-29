/**
 * components/shared/ForceUpdateScreen.tsx
 *
 * Full-screen blocking overlay shown when admin forces an update.
 * Cannot be dismissed — user must update the app.
 * Uses the app's theme system (light/dark) and lucide-react-native icons.
 */

import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { ArrowUpCircle } from 'lucide-react-native';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

interface Props {
  message:  string;
  storeUrl: string;
}

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export function ForceUpdateScreen({ message, storeUrl }: Props) {
  const { isDark } = useTheme();
  const insets     = useSafeAreaInsets();

  const bg      = isDark ? '#0f172a' : '#f0fdf9';
  const cardBg  = isDark ? '#1e293b' : '#ffffff';
  const textPri = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#64748b';
  const border  = isDark ? '#334155' : '#e2e8f0';

  const handleUpdate = () => {
    const url = storeUrl || (
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/search?term=fashiontally'
        : 'https://play.google.com/store/search?q=fashiontally'
    );
    Linking.openURL(url);
  };

  return (
    <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.55)' }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor:     border,
            paddingBottom:   Math.max(insets.bottom, 24) + 8,
          },
        ]}
      >
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(22,152,141,0.15)' : 'rgba(22,152,141,0.1)' }]}>
          <ArrowUpCircle
            size={56}
            color={Colors.primary}
            strokeWidth={1.5}
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: textPri }]}>
          Update Required
        </Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: border }]} />

        {/* Message */}
        <Text style={[styles.message, { color: textSec }]}>
          {message || 'A new version of FashionTally is available. Please update the app to continue.'}
        </Text>

        {/* Version badge */}
        <View style={[styles.versionBadge, { backgroundColor: isDark ? '#2d1f1f' : '#fef2f2', borderColor: isDark ? '#7f1d1d' : '#fecaca' }]}>
          <Text style={[styles.versionText, { color: isDark ? '#fca5a5' : '#dc2626' }]}>
            Your version {APP_VERSION} is no longer supported
          </Text>
        </View>

        {/* Update button */}
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleUpdate}
        >
          <ArrowUpCircle size={18} color="#fff" strokeWidth={2} style={{ marginRight: 8 }} />
          <Text style={styles.btnText}>Update Now</Text>
        </Pressable>

        {/* Platform hint */}
        <Text style={[styles.hint, { color: textSec }]}>
          {Platform.OS === 'ios' ? 'Opens App Store' : 'Opens Play Store'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems:     'center',
    zIndex:         9999,
  },
  card: {
    borderRadius:    24,
    borderWidth:     1,
    paddingTop:      36,
    paddingHorizontal: 28,
    paddingBottom:   28,
    marginHorizontal: 20,
    alignItems:      'center',
    width:           '100%',
    maxWidth:        380,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.2,
    shadowRadius:    20,
    elevation:       12,
  },
  iconWrap: {
    width:         100,
    height:        100,
    borderRadius:  50,
    justifyContent:'center',
    alignItems:    'center',
    marginBottom:  20,
  },
  title: {
    fontSize:    24,
    fontWeight:  '800',
    letterSpacing: -0.5,
    marginBottom: 16,
    textAlign:   'center',
    fontFamily:  'bold',
  },
  divider: {
    height:        1,
    width:         '100%',
    marginBottom:  16,
  },
  message: {
    fontSize:    15,
    lineHeight:  23,
    textAlign:   'center',
    marginBottom: 20,
    fontFamily:  'regular',
  },
  versionBadge: {
    borderRadius:    8,
    borderWidth:     1,
    paddingVertical:  6,
    paddingHorizontal: 12,
    marginBottom:    24,
  },
  versionText: {
    fontSize:   12,
    fontWeight: '600',
    fontFamily: 'medium',
  },
  btn: {
    backgroundColor:  Colors.primary,
    paddingVertical:  15,
    paddingHorizontal: 32,
    borderRadius:     14,
    width:            '100%',
    alignItems:       'center',
    flexDirection:    'row',
    justifyContent:   'center',
    shadowColor:      Colors.primary,
    shadowOffset:     { width: 0, height: 4 },
    shadowOpacity:    0.35,
    shadowRadius:     8,
    elevation:        4,
  },
  btnText: {
    color:      '#fff',
    fontSize:   16,
    fontWeight: '700',
    fontFamily: 'bold',
  },
  hint: {
    fontSize:   12,
    marginTop:  12,
    fontFamily: 'regular',
  },
});
