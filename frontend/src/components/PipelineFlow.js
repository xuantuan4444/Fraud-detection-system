// ====================================================================
// PIPELINE FLOW COMPONENT - Real-time flow visualization (mobile)
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useTransaction } from '../context/TransactionContext';

const phaseColors = {
  input: COLORS.phaseInput,
  phase1: COLORS.phase1,
  phase2: COLORS.phase2,
  phase3: COLORS.phase3,
};

const phaseLabels = {
  input: 'INPUT',
  phase1: 'P1',
  phase2: 'P2',
  phase3: 'P3',
};

function StepIcon({ status }) {
  if (status === 'done') {
    return (
      <View style={[styles.icon, styles.iconDone]}>
        <Ionicons name="checkmark" size={14} color="#fff" />
      </View>
    );
  }
  if (status === 'active') {
    return (
      <View style={[styles.icon, styles.iconActive]}>
        <View style={styles.pulseInner} />
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={[styles.icon, styles.iconError]}>
        <Ionicons name="close" size={14} color="#fff" />
      </View>
    );
  }
  if (status === 'skipped') {
    return (
      <View style={[styles.icon, styles.iconSkipped]}>
        <Ionicons name="remove" size={12} color={COLORS.textMuted} />
      </View>
    );
  }
  // pending
  return <View style={[styles.icon, styles.iconPending]} />;
}

export default function PipelineFlow() {
  const { pipelineSteps, isProcessing } = useTransaction();

  const hasActivity = pipelineSteps.some(s => s.status !== 'pending');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pipeline Flow</Text>
        {isProcessing && (
          <View style={styles.processingBadge}>
            <View style={styles.processingDot} />
            <Text style={styles.processingText}>Processing</Text>
          </View>
        )}
      </View>

      {!hasActivity ? (
        <View style={styles.emptyState}>
          <Ionicons name="git-branch-outline" size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Submit a transaction to see the pipeline</Text>
        </View>
      ) : (
        <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
          {pipelineSteps.map((step, i) => (
            <View key={step.id} style={styles.stepRow}>
              {/* Vertical line */}
              <View style={styles.lineColumn}>
                <StepIcon status={step.status} />
                {i < pipelineSteps.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      step.status === 'done' && styles.lineDone,
                      step.status === 'active' && styles.lineActive,
                      step.status === 'error' && styles.lineError,
                    ]}
                  />
                )}
              </View>

              {/* Content */}
              <View style={[styles.stepContent, step.status === 'skipped' && styles.stepContentSkipped]}>
                <View style={styles.stepLabelRow}>
                  <Text
                    style={[
                      styles.stepLabel,
                      step.status === 'active' && styles.stepLabelActive,
                      step.status === 'error' && styles.stepLabelError,
                      step.status === 'skipped' && styles.stepLabelSkipped,
                    ]}
                    numberOfLines={1}
                  >
                    {step.shortLabel || step.label}
                  </Text>
                  <View style={[styles.phaseBadge, { backgroundColor: phaseColors[step.phase] + '20' }]}>
                    <Text style={[styles.phaseBadgeText, { color: phaseColors[step.phase] }]}>
                      {phaseLabels[step.phase]}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.stepDetail,
                    step.status === 'active' && { color: COLORS.primary },
                    step.status === 'error' && { color: COLORS.danger },
                  ]}
                  numberOfLines={2}
                >
                  {step.detail || step.label}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  processingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  processingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  processingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  stepsContainer: {
    maxHeight: 500,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  lineColumn: {
    width: 32,
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPending: {
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  iconDone: {
    backgroundColor: COLORS.success,
  },
  iconActive: {
    backgroundColor: COLORS.primary,
  },
  iconError: {
    backgroundColor: COLORS.danger,
  },
  iconSkipped: {
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  pulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  lineDone: {
    backgroundColor: COLORS.success,
  },
  lineActive: {
    backgroundColor: COLORS.primary,
  },
  lineError: {
    backgroundColor: COLORS.danger,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 12,
  },
  stepContentSkipped: {
    opacity: 0.4,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
  },
  stepLabelActive: {
    color: COLORS.primary,
  },
  stepLabelError: {
    color: COLORS.danger,
  },
  stepLabelSkipped: {
    color: COLORS.textMuted,
  },
  stepDetail: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  phaseBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  phaseBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
