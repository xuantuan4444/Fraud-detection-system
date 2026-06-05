import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function CustomTabBar({ state, descriptors, navigation }) {
  const currentRouteName = state.routes[state.index].name;

  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity 
        style={styles.tabBtn} 
        onPress={() => navigation.navigate('HomeTab')}
      >
        <Ionicons 
          name={currentRouteName === 'HomeTab' ? 'home' : 'home-outline'} 
          size={24} 
          color={currentRouteName === 'HomeTab' ? COLORS.success : COLORS.textSecondary} 
        />
        <Text style={[
          styles.tabText, 
          { 
            color: currentRouteName === 'HomeTab' ? COLORS.success : COLORS.textSecondary,
            fontWeight: currentRouteName === 'HomeTab' ? '700' : '500' 
          }
        ]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabBtn}>
        <View style={styles.qrFlatBtn}>
          <Ionicons name="qr-code" size={20} color="#fff" />
        </View>
        <Text style={styles.tabText}>Quét QR</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabBtn} 
        onPress={() => navigation.navigate('HistoryTab')}
      >
        <Ionicons 
          name={currentRouteName === 'HistoryTab' ? 'time' : 'time-outline'} 
          size={24} 
          color={currentRouteName === 'HistoryTab' ? COLORS.success : COLORS.textSecondary} 
        />
        <Text style={[
          styles.tabText, 
          { 
            color: currentRouteName === 'HistoryTab' ? COLORS.success : COLORS.textSecondary,
            fontWeight: currentRouteName === 'HistoryTab' ? '700' : '500' 
          }
        ]}>History</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 20, // Cao hơn mặc định
    paddingBottom: Platform.OS === 'ios' ? 15 : 5,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 8,
  },
  tabText: {
    fontSize: 10,
    marginTop: 4,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  qrFlatBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
