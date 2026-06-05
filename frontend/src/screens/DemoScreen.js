// ====================================================================
// DEMO SCREEN - 3 pre-configured scenarios to test pipeline
// ====================================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { DEMO_SCENARIOS } from '../constants/scenarios';
import { useTransaction } from '../context/TransactionContext';

export default function DemoScreen({ navigation }) {
  const { processTransaction, isProcessing } = useTransaction();
  const [selectedId, setSelectedId] = useState(null);

  const handleRun = (scenario) => {
    if (isProcessing) return;
    setSelectedId(scenario.id);

    const txn = {
      ...scenario.transaction,
      timestamp: new Date().toISOString(),
    };

    // Navigate to pipeline view & process
    navigation.navigate('Pipeline');
    processTransaction(txn);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Demo Scenarios</Text>
        <Text style={styles.headerSub}>Tap a scenario to run through the fraud detection pipeline</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {DEMO_SCENARIOS.map((sc) => {
          const isSelected = selectedId === sc.id;
          const badgeStyle = sc.riskLevel === 'green' ? styles.badgeGreen
            : sc.riskLevel === 'red' ? styles.badgeRed
            : styles.badgeYellow;
          const badgeTextStyle = sc.riskLevel === 'green' ? styles.badgeGreenText
            : sc.riskLevel === 'red' ? styles.badgeRedText
            : styles.badgeYellowText;

          return (
            <TouchableOpacity
              key={sc.id}
              style={[styles.scenarioCard, isSelected && styles.scenarioCardSelected]}
              onPress={() => handleRun(sc)}
              activeOpacity={0.7}
              disabled={isProcessing}
            >
              {/* Header */}
              <View style={styles.scenarioHeader}>
                <View style={[
                  styles.scenarioIcon,
                  sc.riskLevel === 'green' ? { backgroundColor: COLORS.successBg }
                    : sc.riskLevel === 'red' ? { backgroundColor: COLORS.dangerBg }
                    : { backgroundColor: COLORS.warningBg },
                ]}>
                  <Ionicons
                    name={sc.icon}
                    size={22}
                    color={sc.riskLevel === 'green' ? COLORS.success : sc.riskLevel === 'red' ? COLORS.danger : COLORS.warning}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scenarioName}>Scenario {sc.id}</Text>
                  <Text style={styles.scenarioTitle}>{sc.name}</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.scenarioDesc}>{sc.description}</Text>

              {/* Meta badges */}
              <View style={styles.badgeRow}>
                <View style={[styles.badge, badgeStyle]}>
                  <Text style={[styles.badgeText, badgeTextStyle]}>{sc.expected}</Text>
                </View>
                <View style={[styles.badge, styles.badgeBlue]}>
                  <Text style={styles.badgeBlueText}>${sc.transaction.amount.toLocaleString()}</Text>
                </View>
              </View>

              {/* Transaction Preview */}
              <View style={styles.txnPreview}>
                <View style={styles.txnPreviewRow}>
                  <Text style={styles.txnKey}>Sender</Text>
                  <Text style={styles.txnVal}>{sc.transaction.sender_name} ({sc.transaction.sender_id})</Text>
                </View>
                <View style={styles.txnPreviewRow}>
                  <Text style={styles.txnKey}>Receiver</Text>
                  <Text style={styles.txnVal}>{sc.transaction.receiver_name} ({sc.transaction.receiver_id})</Text>
                </View>
                <View style={styles.txnPreviewRow}>
                  <Text style={styles.txnKey}>Channel</Text>
                  <Text style={styles.txnVal}>{sc.transaction.channel} | {sc.transaction.ip_address}</Text>
                </View>
              </View>

              {/* Run button */}
              <View style={[styles.runBtn, isProcessing && isSelected && { opacity: 0.6 }]}>
                <Ionicons name={isProcessing && isSelected ? 'hourglass' : 'play'} size={16} color="#fff" />
                <Text style={styles.runBtnText}>
                  {isProcessing && isSelected ? 'Running...' : 'Run Scenario'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

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
  scenarioCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  scenarioCardSelected: {
    borderColor: COLORS.primary,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  scenarioIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioName: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 1,
  },
  scenarioDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeYellow: { backgroundColor: '#FEF3C7' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeBlue: { backgroundColor: '#DBEAFE' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeGreenText: { color: '#065F46' },
  badgeYellowText: { color: '#92400E' },
  badgeRedText: { color: '#991B1B' },
  badgeBlueText: { color: '#1E40AF', fontSize: 11, fontWeight: '700' },
  txnPreview: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginBottom: 12,
  },
  txnPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  txnKey: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  txnVal: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 11,
    gap: 8,
  },
  runBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
