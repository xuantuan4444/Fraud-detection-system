// ====================================================================
// RESULT CARD COMPONENT - Hiển thị kết quả giao dịch
// ====================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function ResultCard({ result, error }) {
  const [expanded, setExpanded] = useState(false);

  if (error) {
    return (
      <View style={[styles.container, styles.containerEscalate]}>
        <View style={styles.row}>
          <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
          <Text style={styles.decisionText}>Error</Text>
        </View>
        <Text style={styles.message}>{error}</Text>
      </View>
    );
  }

  if (!result) return null;

  const decision = result.decision || 'escalate';
  const containerStyle = decision === 'allow' ? styles.containerAllow
    : decision === 'block' ? styles.containerBlock
    : styles.containerEscalate;
  const iconName = decision === 'allow' ? 'shield-checkmark'
    : decision === 'block' ? 'shield-half'
    : 'alert-circle';
  const iconColor = decision === 'allow' ? COLORS.success
    : decision === 'block' ? COLORS.danger
    : COLORS.warning;
  const label = decision === 'allow' ? 'ALLOWED'
    : decision === 'block' ? 'BLOCKED'
    : 'ESCALATED';

  // Trích xuất "phần đề xuất" (câu cuối của report.detailed_analysis)
  let suggestionMessage = result.message;
  if (result.report?.detailed_analysis) {
    const lines = result.report.detailed_analysis.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
      let lastLine = lines[lines.length - 1];
      
      // Xóa các tiền tố in đậm (vd: **Đề xuất:**)
      lastLine = lastLine.replace(/^\*\*.*?\*\*:?\s*/, '');
      // Xóa các từ khóa thường gặp (vd: Kết luận: )
      lastLine = lastLine.replace(/^(Đề xuất|Kết luận|Conclusion|Recommendation|Decision|Lý do):\s*/i, '');
      // Xóa quyết định ALLOW/BLOCK/ESCALATE ở đầu câu (nếu kèm dấu chấm/khoảng trắng)
      lastLine = lastLine.replace(/^(ALLOW|BLOCK|ESCALATE)[\.\s]+/i, '');
      
      suggestionMessage = lastLine.trim();
    }
  } else if (result.detail?.reasoning) {
    suggestionMessage = result.detail.reasoning;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Decision Header */}
      <View style={styles.row}>
        <Ionicons name={iconName} size={28} color={iconColor} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={[styles.decisionText, { color: iconColor }]}>{label}</Text>
          <Text style={styles.message} numberOfLines={3}>{suggestionMessage}</Text>
        </View>
      </View>

      {/* Phase 1 Summary */}
      {result.phase1 && (
        <View style={styles.phase1Box}>
          <View style={styles.phase1Row}>
            <Text style={styles.phase1Label}>Risk Level</Text>
            <View style={[
              styles.riskBadge,
              result.phase1.risk_level === 'green' ? styles.badgeGreen
                : result.phase1.risk_level === 'red' ? styles.badgeRed
                : styles.badgeYellow,
            ]}>
              <Text style={[
                styles.riskBadgeText,
                result.phase1.risk_level === 'green' ? styles.badgeGreenText
                  : result.phase1.risk_level === 'red' ? styles.badgeRedText
                  : styles.badgeYellowText,
              ]}>
                {result.phase1.risk_level?.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.phase1Row}>
            <Text style={styles.phase1Label}>Risk Score</Text>
            <Text style={styles.phase1Value}>{result.phase1.risk_score?.toFixed(3)}</Text>
          </View>
          <View style={styles.phase1Row}>
            <Text style={styles.phase1Label}>Rules Triggered</Text>
            <Text style={styles.phase1Value}>{result.phase1.triggered_rules?.length || 0}</Text>
          </View>
        </View>
      )}

      {/* Expand Details */}
      <TouchableOpacity
        style={styles.expandBtn}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.expandText}>{expanded ? 'Hide Details' : 'Show Details'}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.detailsSection}>
          {/* Triggered Rules */}
          {result.phase1?.triggered_rules?.length > 0 && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Triggered Rules</Text>
              {result.phase1.triggered_rules.map((r, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={[
                    styles.severityDot,
                    r.severity === 'critical' ? { backgroundColor: COLORS.danger }
                      : r.severity === 'high' ? { backgroundColor: COLORS.warning }
                      : { backgroundColor: COLORS.phase1 },
                  ]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleName}>{r.rule}</Text>
                    {'\n'}{r.detail}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Investigation Report */}
          {result.report && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Investigation Report</Text>
              {result.investigation && (
                <Text style={styles.investigationMeta}>
                  {result.investigation.evidence_count} evidence | confidence: {result.investigation.confidence?.toFixed(2)}
                </Text>
              )}
              {result.report.summary && (
                <Text style={styles.reportText}>{result.report.summary}</Text>
              )}
              {result.report.detailed_analysis && (
                <View style={styles.analysisBox}>
                  <Text style={styles.analysisText}>{result.report.detailed_analysis}</Text>
                </View>
              )}
            </View>
          )}

          {/* Detective Decision */}
          {result.detail && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Detective Reasoning</Text>
              <Text style={styles.reportText}>{result.detail.reasoning}</Text>
              {result.detail.confidence && (
                <Text style={styles.investigationMeta}>
                  Confidence: {result.detail.confidence.toFixed(2)}
                </Text>
              )}
              {result.detail.actions?.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {result.detail.actions.map((a, i) => (
                    <View key={i} style={styles.actionRow}>
                      <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
                      <Text style={styles.actionText}>{a}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  containerAllow: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  containerBlock: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  containerEscalate: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decisionText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  phase1Box: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  phase1Row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phase1Label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  phase1Value: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeYellow: { backgroundColor: '#FEF3C7' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeGreenText: { color: '#065F46', fontSize: 11, fontWeight: '700' },
  badgeYellowText: { color: '#92400E', fontSize: 11, fontWeight: '700' },
  badgeRedText: { color: '#991B1B', fontSize: 11, fontWeight: '700' },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 6,
    gap: 4,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  detailsSection: {
    marginTop: 8,
  },
  detailBlock: {
    marginTop: 12,
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 17,
  },
  ruleName: {
    fontWeight: '700',
  },
  investigationMeta: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  reportText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
  analysisBox: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  analysisText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.text,
  },
});
