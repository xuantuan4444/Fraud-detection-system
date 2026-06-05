// ====================================================================
// PIPELINE SCREEN - Full screen pipeline flow + result view
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../constants/theme';
import PipelineFlow from '../components/PipelineFlow';
import ResultCard from '../components/ResultCard';
import { useTransaction } from '../context/TransactionContext';

export default function PipelineScreen() {
  const { result, error } = useTransaction();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Processing Pipeline</Text>
        <Text style={styles.headerSub}>Real-time fraud detection flow</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pipeline Flow */}
        <PipelineFlow />

        {/* Result */}
        <ResultCard result={result} error={error} />

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
});
