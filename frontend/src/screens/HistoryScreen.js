// ====================================================================
// HISTORY SCREEN - Danh sách giao dịch đã xử lý
// ====================================================================

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useTransaction } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';

export default function HistoryScreen({ navigation }) {
  const { transactionHistory } = useTransaction();
  const { user } = useAuth();

  // Lọc chỉ hiển thị giao dịch mà user là sender hoặc receiver
  const myTransactions = transactionHistory.filter(txn =>
    txn.sender === user?.id || txn.receiver === user?.id
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <Text style={styles.headerSub}>{myTransactions.length} transactions</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {myTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyDesc}>Create a transfer to see results here.</Text>
            
          </View>
        ) : (
          myTransactions.map((txn, i) => {
            const isSender = txn.sender === user?.id;
            const effectiveDecision = txn.finalDecision || txn.decision;

            const iconName = effectiveDecision === 'allow' ? 'checkmark-circle'
              : effectiveDecision === 'block' ? 'close-circle'
              : 'alert-circle';
            const iconColor = effectiveDecision === 'allow' ? COLORS.success
              : effectiveDecision === 'block' ? COLORS.danger
              : COLORS.warning;
            const bgColor = effectiveDecision === 'allow' ? COLORS.successBg
              : effectiveDecision === 'block' ? COLORS.dangerBg
              : COLORS.warningBg;

            return (
              <TouchableOpacity
                key={i}
                style={styles.txnCard}
                activeOpacity={0.7}
                onPress={() => {
                  // Navigate to pipeline and show this result
                }}
              >
                <View style={styles.txnRow}>
                  <View style={[styles.txnIcon, { backgroundColor: bgColor }]}>
                    <Ionicons
                      name={isSender ? 'arrow-up-circle' : 'arrow-down-circle'}
                      size={24}
                      color={isSender ? COLORS.danger : COLORS.success}
                    />
                  </View>

                  <View style={styles.txnInfo}>
                    <View style={styles.txnTypeRow}>
                      <Text style={[styles.txnType, { color: isSender ? COLORS.danger : COLORS.success }]}>
                        {isSender ? 'Sent' : 'Received'}
                      </Text>
                      <Text style={styles.txnId}>{txn.id}</Text>
                    </View>
                    <Text style={styles.txnParties}>
                      {isSender
                        ? `To: ${txn.receiverName || txn.receiver}`
                        : `From: ${txn.senderName || txn.sender}`
                      }
                    </Text>
                    <Text style={styles.txnTime}>
                      {new Date(txn.timestamp).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.txnRight}>
                    <Text style={[
                      styles.txnAmount,
                      { color: effectiveDecision === 'allow' ? (isSender ? COLORS.danger : COLORS.success) : COLORS.textMuted },
                      effectiveDecision !== 'allow' && { textDecorationLine: 'line-through' }
                    ]}>
                      {effectiveDecision === 'allow' ? (isSender ? '-' : '+') : ''}${Number(txn.amount).toLocaleString()}
                    </Text>
                    <View style={[
                      styles.decisionBadge,
                      effectiveDecision === 'allow' ? { backgroundColor: '#D1FAE5' }
                        : effectiveDecision === 'block' ? { backgroundColor: '#FEE2E2' }
                        : { backgroundColor: '#FEF3C7' },
                    ]}>
                      <Text style={[
                        styles.decisionText,
                        { color: iconColor },
                      ]}>
                        {txn.finalDecision ? `ESCALATE (${txn.finalDecision.toUpperCase()})` : txn.decision?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>


              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    paddingHorizontal: 40,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  txnCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txnIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: { flex: 1 },
  txnTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txnType: {
    fontSize: 12,
    fontWeight: '700',
  },
  txnId: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  txnParties: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  txnTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  decisionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  decisionText: {
    fontSize: 10,
    fontWeight: '800',
  },

});
