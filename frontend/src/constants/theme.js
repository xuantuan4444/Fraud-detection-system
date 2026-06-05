// ====================================================================
// THEME CONSTANTS - Banking app color palette & typography
// ====================================================================

export const COLORS = {
  // Primary brand
  primary: '#1A56DB',
  primaryDark: '#1E3A8A',
  primaryLight: '#3B82F6',
  primaryBg: '#EFF6FF',

  // Status
  success: '#059669',
  successBg: '#ECFDF5',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  warning: '#D97706',
  warningBg: '#FFFBEB',

  // Neutral
  white: '#FFFFFF',
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  dark: '#0F172A',

  // Pipeline phases
  phaseInput: '#6366F1',
  phase1: '#3B82F6',
  phase2: '#F59E0B',
  phase3: '#EC4899',
};

export const FONTS = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
