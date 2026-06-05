// ====================================================================
// HOME SCREEN - Banking dashboard (VCB Digibank inspired)
// ====================================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ImageBackground, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [showBalance, setShowBalance] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Top Header Background */}
        <ImageBackground
          source={require('../../img/home.png')}
          style={styles.headerBg}
          resizeMode="cover"
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.companyName}>USIT Bank</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="search" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="settings-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={logout}>
                <Ionicons name="log-out-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* Balance Card - Floating */}
        <View style={styles.balanceCardWrapper}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceTop}>
              <View style={styles.userIconWrapper}>
                <Ionicons name="person" size={20} color="#059669" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{user?.name?.toUpperCase() || 'NGUYEN VAN A'}</Text>
                <Text style={styles.accountType}>Số tài khoản: {user?.id}</Text>
              </View>
              <TouchableOpacity style={styles.qrMiniBtn}>
                <Ionicons name="qr-code-outline" size={12} color="#065F46" />
                <Text style={styles.qrMiniText}>QR của tôi</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Số dư</Text>
              <Text style={styles.balanceValue}>
                {showBalance ? `$${(user?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '********'}
              </Text>
              <TouchableOpacity onPress={() => setShowBalance(!showBalance)} style={styles.eyeBtn}>
                <Ionicons name={showBalance ? "eye-outline" : "eye-off-outline"} size={20} color="#065F46" />
              </TouchableOpacity>
            </View>

            {/* Quick inside-card actions */}
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.cardActionBtn} onPress={() => navigation.navigate('HistoryTab')}>
                <Ionicons name="time-outline" size={16} color="#065F46" />
                <Text style={styles.cardActionText}>Lịch sử giao dịch</Text>
              </TouchableOpacity>
              <View style={styles.cardActionDivider} />
              <TouchableOpacity style={styles.cardActionBtn}>
                <Ionicons name="wallet-outline" size={16} color="#065F46" />
                <Text style={styles.cardActionText}>Danh sách tài khoản</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Favorite Functions */}
        <View style={styles.favoriteSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chức năng ưa thích</Text>
            <TouchableOpacity style={styles.settingsBtn}>
              <Text style={styles.settingsText}>Tuỳ chỉnh</Text>
              <Ionicons name="options-outline" size={16} color={COLORS.success} />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {/* Grid Items */}
            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconFrame}>
                <Ionicons name="document-text-outline" size={26} color={COLORS.success} />
              </View>
              <Text style={styles.gridLabel}>Tra soát trực{'\n'}tuyến</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Transfer')}>
              <View style={styles.gridIconFrame}>
                <Ionicons name="paper-plane-outline" size={26} color={COLORS.success} />
              </View>
              <Text style={styles.gridLabel}>Chuyển tiền{'\n'}trong nước</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconFrame}>
                <Ionicons name="car-outline" size={26} color={COLORS.success} />
              </View>
              <Text style={styles.gridLabel}>VNPAY Taxi</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconFrame}>
                <Ionicons name="phone-portrait-outline" size={26} color={COLORS.success} />
              </View>
              <Text style={styles.gridLabel}>Điện thoại</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconFrame}>
                <Ionicons name="cart-outline" size={26} color={COLORS.success} />
                <View style={styles.badgeNew}><Text style={styles.badgeText}>NEW</Text></View>
              </View>
              <Text style={styles.gridLabel}>Mua sắm{'\n'}VnShop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconFrame}>
                <Ionicons name="mail-outline" size={26} color={COLORS.success} />
              </View>
              <Text style={styles.gridLabel}>Quản lý email</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.success} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  headerBg: {
    width: '100%',
    height: 250,
    justifyContent: 'flex-start',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCardWrapper: {
    marginTop: -80,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  balanceCard: {
    backgroundColor: '#F0FDF4', // Trắng pha xanh nhạt 
    borderRadius: 16, // Bo hết 4 góc
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#064E3B',
  },
  accountType: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  qrMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  qrMiniText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
    width: 60,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#064E3B',
    flex: 1,
    letterSpacing: -0.5,
  },
  eyeBtn: {
    padding: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D1FAE5',
    paddingTop: 12,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  cardActionDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#A7F3D0',
  },
  favoriteSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 24,
  },
  gridIconFrame: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridLabel: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
  badgeNew: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '800',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
});
