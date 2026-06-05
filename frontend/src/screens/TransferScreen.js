// ====================================================================
// TRANSFER SCREEN - Form nhập giao dịch + xác nhận + password + processing
// ====================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useTransaction } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import PipelineFlow from '../components/PipelineFlow';
import ResultCard from '../components/ResultCard';

export default function TransferScreen({ navigation }) {
  const {
    processTransaction, isProcessing, result, error, resetPipeline,
    needsPhase2Otp, submitPhase2Otp, currentRiskLevel, phase2OtpVerified,
    updateTransactionHistory,
  } = useTransaction();
  const { user, updateBalance, accounts } = useAuth();

  // Form state - sender is from logged-in user
  const [receiverName, setReceiverName] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Flow states: form -> confirm -> password -> processing
  const [step, setStep] = useState('form'); // form | confirm | password | processing
  const [passwordCode, setPasswordCode] = useState('');
  const passwordInputRef = useRef(null);

  // Phase 2 OTP SMS state
  const [otpSmsCode, setOtpSmsCode] = useState('');
  const phase2OtpInputRef = useRef(null);

  // Dev mode toggle
  const [devMode, setDevMode] = useState(false);

  // Current transaction info for display
  const [currentTxnInfo, setCurrentTxnInfo] = useState(null);

  // Escalate confirmation state
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
  const [finalDecision, setFinalDecision] = useState(null); // 'allow' | 'block' | null
  const [balanceUpdated, setBalanceUpdated] = useState(false); // Track if balance was updated

  // Auto-fill receiver name if ID matches a known account
  useEffect(() => {
    if (receiverId && accounts) {
      const match = accounts.find(acc => acc.id.toLowerCase() === receiverId.trim().toLowerCase());
      if (match) {
        setReceiverName(match.name);
      } else {
        setReceiverName('');
      }
    } else if (!receiverId) {
      setReceiverName('');
    }
  }, [receiverId, accounts]);

  const handleContinue = () => {
    if (!receiverId.trim() || !amount.trim()) {
      Alert.alert('Missing Info', 'Please enter receiver account and amount.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = () => {
    setStep('password');
  };

  const handlePasswordSubmit = () => {
    if (passwordCode.length < 6) {
      Alert.alert('Invalid Password', 'Please enter your 6-digit password.');
      return;
    }

    // Build transaction object using logged-in user info
    const txn = {
      transaction_id: `TXN_${Date.now().toString(36).toUpperCase()}`,
      sender_id: user?.id || 'ACC_001',
      sender_name: user?.name || 'Unknown',
      sender_account_type: user?.accountType || 'savings',
      receiver_id: receiverId,
      receiver_name: receiverName || receiverId,
      amount: parseFloat(amount),
      currency: 'USD',
      transaction_type: 'transfer',
      timestamp: new Date().toISOString(),
      device_id: 'DEV_MOBILE_001',
      ip_address: '14.161.42.100',
      channel: 'mobile',
      location: 'Ho Chi Minh City',
      description: description || 'Transfer',
    };

    // Save transaction info for display
    setCurrentTxnInfo(txn);

    // Switch to processing view and process
    setStep('processing');
    processTransaction(txn);
  };

  const handlePhase2OtpSubmit = () => {
    if (otpSmsCode.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP code sent to your phone.');
      return;
    }
    const success = submitPhase2Otp(otpSmsCode);
    if (!success) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit code.');
    }
  };

  const handleBack = () => {
    if (step === 'password') setStep('confirm');
    else if (step === 'confirm') setStep('form');
  };

  const handleNewTransfer = () => {
    resetPipeline();
    setReceiverName('');
    setReceiverId('');
    setAmount('');
    setDescription('');
    setPasswordCode('');
    setOtpSmsCode('');
    setCurrentTxnInfo(null);
    setDevMode(false);
    setShowEscalateConfirm(false);
    setFinalDecision(null);
    setBalanceUpdated(false);
    setStep('form');
  };

  const handleGoHome = () => {
    resetPipeline();
    navigation.goBack();
  };

  // Handle escalate confirmation
  const handleEscalateConfirm = (proceed) => {
    setShowEscalateConfirm(false);
    if (proceed) {
      // User chose to proceed with transfer
      setFinalDecision('allow');
      if (currentTxnInfo && !balanceUpdated) {
        updateBalance(currentTxnInfo.sender_id, currentTxnInfo.receiver_id, currentTxnInfo.amount);
        setBalanceUpdated(true);
      }
      if (currentTxnInfo) {
        updateTransactionHistory(currentTxnInfo.transaction_id, { finalDecision: 'allow' });
      }
    } else {
      // User chose to cancel
      setFinalDecision('block');
      if (currentTxnInfo) {
        updateTransactionHistory(currentTxnInfo.transaction_id, { finalDecision: 'block' });
      }
    }
  };

  // Detect when result is escalate and show confirmation
  useEffect(() => {
    if (result?.decision === 'escalate' && !showEscalateConfirm && finalDecision === null) {
      // Wait for OTP to be verified first (if needed)
      if (!needsPhase2Otp || phase2OtpVerified) {
        setShowEscalateConfirm(true);
      }
    }
  }, [result, needsPhase2Otp, phase2OtpVerified, showEscalateConfirm, finalDecision]);

  // Update balance when transaction is allowed
  useEffect(() => {
    if (result?.decision === 'allow' && currentTxnInfo && !balanceUpdated) {
      updateBalance(currentTxnInfo.sender_id, currentTxnInfo.receiver_id, currentTxnInfo.amount);
      setBalanceUpdated(true);
    }
  }, [result, currentTxnInfo, updateBalance, balanceUpdated]);

  // ─── PROCESSING SCREEN ───
  if (step === 'processing') {
    const isDone = result || error;
    // For escalate, use finalDecision if user has confirmed
    const effectiveDecision = result?.decision === 'escalate' && finalDecision
      ? finalDecision
      : result?.decision;
    const isSuccess = effectiveDecision === 'allow';
    const isBlocked = effectiveDecision === 'block';
    const isEscalated = result?.decision === 'escalate' && finalDecision === null;

    // Trích xuất "phần đề xuất" (câu cuối của report.detailed_analysis)
    let suggestionMessage = result?.message;
    if (result?.report?.detailed_analysis) {
      const lines = result.report.detailed_analysis.split('\n').filter(line => line.trim() !== '');
      if (lines.length > 0) {
        let lastLine = lines[lines.length - 1];
        lastLine = lastLine.replace(/^\*\*.*?\*\*:?\s*/, '');
        lastLine = lastLine.replace(/^(Đề xuất|Kết luận|Conclusion|Recommendation|Decision|Lý do):\s*/i, '');
        lastLine = lastLine.replace(/^(ALLOW|BLOCK|ESCALATE)[\.\s]+/i, '');
        suggestionMessage = lastLine.trim();
      }
    } else if (result?.detail?.reasoning) {
      suggestionMessage = result.detail.reasoning;
    }

    return (
      <View style={styles.container}>
        <View style={styles.screenHeader}>
          <View style={{ width: 32 }} />
          <Text style={styles.screenTitle}>
            {isDone ? (isSuccess ? 'Transfer Complete' : isBlocked ? 'Transfer Cancelled' : 'Transfer Result') : 'Processing'}
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Processing / Transaction Info Card */}
          <View style={styles.txnInfoCard}>
            {/* Status Icon */}
            <View style={[
              styles.statusIconContainer,
              isDone
                ? (isSuccess ? styles.statusSuccess : isBlocked ? styles.statusBlocked : styles.statusEscalated)
                : styles.statusProcessing
            ]}>
              {isDone ? (
                <Ionicons
                  name={isSuccess ? "checkmark-circle" : isBlocked ? "close-circle" : "alert-circle"}
                  size={48}
                  color={isSuccess ? COLORS.success : isBlocked ? COLORS.danger : COLORS.warning}
                />
              ) : (
                <ActivityIndicator size="large" color={COLORS.success} />
              )}
            </View>

            {/* Status Text */}
            <Text style={styles.statusText}>
              {isDone
                ? (isSuccess ? 'Transaction Successful'
                  : isBlocked ? (result?.decision === 'escalate' ? 'Transfer Cancelled by User' : 'Transaction Blocked')
                    : 'Awaiting Your Decision')
                : 'Processing Transaction...'}
            </Text>

            {isDone && suggestionMessage && !isEscalated && (
              <Text style={styles.statusMessage}>{suggestionMessage}</Text>
            )}

            {isEscalated && (
              <Text style={styles.statusMessage}>
                Our system flagged this transaction for review. Please confirm if you want to proceed.
              </Text>
            )}

            {error && (
              <Text style={styles.errorMessage}>{error}</Text>
            )}

            {/* Transaction Details */}
            {currentTxnInfo && (
              <View style={styles.txnDetails}>
                <View style={styles.txnDetailRow}>
                  <Text style={styles.txnDetailLabel}>Transaction ID</Text>
                  <Text style={styles.txnDetailValue}>{currentTxnInfo.transaction_id}</Text>
                </View>
                <View style={styles.txnDetailRow}>
                  <Text style={styles.txnDetailLabel}>From</Text>
                  <Text style={styles.txnDetailValue}>{currentTxnInfo.sender_name}</Text>
                </View>
                <View style={styles.txnDetailRow}>
                  <Text style={styles.txnDetailLabel}>To</Text>
                  <Text style={styles.txnDetailValue}>{currentTxnInfo.receiver_name}</Text>
                </View>
                <View style={styles.txnDetailRow}>
                  <Text style={styles.txnDetailLabel}>Amount</Text>
                  <Text style={[styles.txnDetailValue, styles.txnAmount]}>
                    ${parseFloat(currentTxnInfo.amount).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.txnDetailRow}>
                  <Text style={styles.txnDetailLabel}>Time</Text>
                  <Text style={styles.txnDetailValue}>
                    {new Date(currentTxnInfo.timestamp).toLocaleString()}
                  </Text>
                </View>
                {currentTxnInfo.description && (
                  <View style={styles.txnDetailRow}>
                    <Text style={styles.txnDetailLabel}>Note</Text>
                    <Text style={styles.txnDetailValue}>{currentTxnInfo.description}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Phase 2 OTP Modal - popup ở nửa trên màn hình */}
          <Modal
            visible={needsPhase2Otp && !phase2OtpVerified}
            transparent={true}
            animationType="slide"
            onRequestClose={() => { }}
          >
            <KeyboardAvoidingView
              style={styles.modalOverlay}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View style={styles.modalContent}>
                <View style={styles.phase2OtpIcon}>
                  <Ionicons name="phone-portrait" size={24} color={COLORS.warning} />
                </View>
                <Text style={styles.phase2OtpTitle}>Additional Verification</Text>
                <Text style={styles.phase2OtpSubtitle}>
                  Enter the 6-digit OTP sent to your phone.
                </Text>

                <View style={styles.phase2OtpInputWrapper}>
                  <View style={styles.phase2OtpInputRow}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <View key={i} style={[styles.phase2OtpBox, otpSmsCode.length > i && styles.phase2OtpBoxFilled]}>
                        <Text style={styles.phase2OtpDigit}>{otpSmsCode[i] || ''}</Text>
                      </View>
                    ))}
                  </View>
                  <TextInput
                    ref={phase2OtpInputRef}
                    style={styles.otpOverlayInput}
                    value={otpSmsCode}
                    onChangeText={(t) => setOtpSmsCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    caretHidden={true}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.verifyOtpBtn, otpSmsCode.length < 6 && styles.primaryBtnDisabled]}
                  onPress={handlePhase2OtpSubmit}
                  disabled={otpSmsCode.length < 6}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Verify OTP</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Escalate Confirmation Modal */}
          <Modal
            visible={showEscalateConfirm}
            transparent={true}
            animationType="fade"
            onRequestClose={() => { }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.escalateModalContent}>
                <View style={styles.escalateIcon}>
                  <Ionicons name="warning" size={32} color={COLORS.warning} />
                </View>
                <Text style={styles.escalateTitle}>Transaction Flagged</Text>
                <Text style={styles.escalateSubtitle}>
                  Our AI system has flagged this transaction as potentially risky.
                </Text>

                {currentTxnInfo && (
                  <View style={styles.escalateDetails}>
                    <Text style={styles.escalateDetailText}>
                      Transfer <Text style={styles.escalateAmount}>${parseFloat(currentTxnInfo.amount).toLocaleString()}</Text> to
                    </Text>
                    <Text style={styles.escalateReceiver}>
                      {currentTxnInfo.receiver_name}
                    </Text>
                  </View>
                )}

                <Text style={styles.escalateQuestion}>
                  Do you still want to proceed with this transfer?
                </Text>

                <View style={styles.escalateButtons}>
                  <TouchableOpacity
                    style={[styles.escalateBtn, styles.escalateBtnNo]}
                    onPress={() => handleEscalateConfirm(false)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={18} color={COLORS.danger} />
                    <Text style={styles.escalateBtnNoText}>No, Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.escalateBtn, styles.escalateBtnYes]}
                    onPress={() => handleEscalateConfirm(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.escalateBtnYesText}>Yes, Proceed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* OTP Verified Badge */}
          {needsPhase2Otp && phase2OtpVerified && (
            <View style={styles.otpVerifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.otpVerifiedText}>OTP Verified</Text>
            </View>
          )}

          {/* Dev Mode Toggle - always available */}
          <TouchableOpacity
            style={styles.devModeBtn}
            onPress={() => setDevMode(!devMode)}
            activeOpacity={0.7}
          >
            <Ionicons name="code-slash" size={18} color={devMode ? COLORS.success : COLORS.textMuted} />
            <Text style={[styles.devModeBtnText, devMode && { color: COLORS.success }]}>
              {devMode ? 'Hide Dev Mode' : 'Dev Mode'}
            </Text>
            <Ionicons
              name={devMode ? "chevron-up" : "chevron-down"}
              size={16}
              color={devMode ? COLORS.success : COLORS.textMuted}
            />
          </TouchableOpacity>

          {/* Dev Mode Content - Pipeline Flow & Result Details */}
          {devMode && (
            <View style={styles.devModeContent}>
              <Text style={styles.devModeTitle}>Pipeline Flow</Text>
              <PipelineFlow />
              {(result || error) && (
                <>
                  <Text style={styles.devModeTitle}>Decision Details</Text>
                  <ResultCard result={result} error={error} />
                </>
              )}
            </View>
          )}

          {/* Action Buttons - show when done, OTP verified (if needed), and escalate confirmed (if needed) */}
          {isDone && (!needsPhase2Otp || phase2OtpVerified) && (result?.decision !== 'escalate' || finalDecision !== null) && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={handleGoHome}
                activeOpacity={0.8}
              >
                <Ionicons name="home" size={18} color={COLORS.success} />
                <Text style={styles.actionBtnSecondaryText}>Go Home</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={handleNewTransfer}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.actionBtnPrimaryText}>New Transfer</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ─── CONFIRM SCREEN ───
  if (step === 'confirm') {
    return (
      <View style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Confirm Transfer</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmLabel}>You are sending</Text>
            <Text style={styles.confirmAmount}>${parseFloat(amount).toLocaleString()}</Text>
            <Text style={styles.confirmCurrency}>USD</Text>
          </View>

          <View style={styles.confirmDetails}>
            <View style={styles.confirmRow}>
              <View style={styles.confirmDot}>
                <Ionicons name="person" size={16} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.confirmDetailLabel}>From</Text>
                <Text style={styles.confirmDetailValue}>{user?.name}</Text>
                <Text style={styles.confirmDetailSub}>{user?.id}</Text>
              </View>
            </View>

            <View style={styles.confirmArrow}>
              <Ionicons name="arrow-down" size={18} color={COLORS.textMuted} />
            </View>

            <View style={styles.confirmRow}>
              <View style={styles.confirmDot}>
                <Ionicons name="person-outline" size={16} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.confirmDetailLabel}>To</Text>
                <Text style={styles.confirmDetailValue}>{receiverName || receiverId}</Text>
                <Text style={styles.confirmDetailSub}>{receiverId}</Text>
              </View>
            </View>
          </View>

          {description ? (
            <View style={styles.descBox}>
              <Text style={styles.descLabel}>Description</Text>
              <Text style={styles.descValue}>{description}</Text>
            </View>
          ) : null}

          <View style={styles.warningBox}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.success} />
            <Text style={styles.warningText}>
              This transaction will be screened by our AI Fraud Detection system in real-time.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── PASSWORD SCREEN (6-digit) ───
  if (step === 'password') {
    return (
      <View style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Enter Password</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.otpContainer}>
          <View style={styles.otpIcon}>
            <Ionicons name="lock-closed" size={32} color={COLORS.success} />
          </View>
          <Text style={styles.otpTitle}>Transaction Password</Text>
          <Text style={styles.otpSubtitle}>
            Enter your 6-digit transaction password{'\n'}to confirm this transfer.
          </Text>

          <TouchableOpacity
            style={styles.otpInputRow}
            activeOpacity={0.8}
            onPress={() => passwordInputRef.current?.focus()}
          >
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View key={i} style={[styles.otpBox, passwordCode.length > i && styles.otpBoxFilled]}>
                <Text style={styles.otpDigit}>{passwordCode[i] ? '*' : ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          <TextInput
            ref={passwordInputRef}
            style={styles.hiddenInput}
            value={passwordCode}
            onChangeText={(t) => setPasswordCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryBtn, passwordCode.length < 6 && styles.primaryBtnDisabled]}
            onPress={handlePasswordSubmit}
            disabled={passwordCode.length < 6 || isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <Text style={styles.primaryBtnText}>Processing...</Text>
            ) : (
              <Text style={styles.primaryBtnText}>Confirm Transfer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── MAIN FORM SCREEN ───
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>New Transfer</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Receiver */}
        <Text style={styles.groupLabel}>To Account</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Account ID</Text>
          <TextInput
            style={styles.input}
            value={receiverId}
            onChangeText={setReceiverId}
            placeholder="e.g. ACC_002 or ACC_666"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Receiver Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: COLORS.bg }]}
            value={receiverName}
            editable={false}
            placeholder="Auto-filled if valid"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {!!receiverName && (
          <>
            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (USD)</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountPrefix}>$</Text>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Quick amounts */}
            <View style={styles.quickAmounts}>
              {['250', '950', '5000', '25000'].map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.quickBtn, amount === a && styles.quickBtnActive]}
                  onPress={() => setAmount(a)}
                >
                  <Text style={[styles.quickBtnText, amount === a && styles.quickBtnTextActive]}>
                    ${Number(a).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Transfer note (optional)"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  senderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  senderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  senderId: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  senderBadge: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  senderBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountPrefix: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  quickBtnActive: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.success,
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  quickBtnTextActive: {
    color: COLORS.success,
  },
  primaryBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Confirm screen
  confirmCard: {
    backgroundColor: COLORS.success,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  confirmAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  confirmCurrency: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  confirmDetails: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confirmDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDetailLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  confirmDetailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  confirmDetailSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  confirmArrow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  descBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  descLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  descValue: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#064E3B',
    lineHeight: 18,
  },
  // Password screen
  otpContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  otpIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  otpSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  otpInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
    marginBottom: 8,
  },
  otpBox: {
    width: 42,
    height: 50,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  otpBoxFilled: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successBg,
  },
  otpDigit: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  demoHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    marginBottom: 16,
  },
  // Processing screen
  txnInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusProcessing: {
    backgroundColor: COLORS.successBg,
  },
  statusSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusBlocked: {
    backgroundColor: '#FEE2E2',
  },
  statusEscalated: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  errorMessage: {
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
    marginTop: 8,
  },
  txnDetails: {
    width: '100%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  txnDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnDetailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  txnDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  // Phase 2 OTP Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 120,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 16,
    textAlign: 'center',
  },
  phase2OtpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  phase2OtpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  phase2OtpSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  phase2OtpNote: {
    fontSize: 11,
    color: COLORS.warning,
    marginTop: 2,
    fontWeight: '600',
  },
  phase2OtpInputRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
    marginBottom: 4,
  },
  phase2OtpBox: {
    width: 38,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  phase2OtpBoxFilled: {
    borderColor: COLORS.warning,
    backgroundColor: '#FEF3C7',
  },
  phase2OtpDigit: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  phase2OtpInputWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpOverlayInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 18,
  },
  // Dev mode
  devModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  devModeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  devModeContent: {
    marginTop: 16,
  },
  devModeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.success,
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  // Verify OTP button
  verifyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 6,
    marginTop: 12,
    width: '100%',
  },
  // OTP Verified badge
  otpVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  otpVerifiedText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  // Escalate Confirmation Modal
  escalateModalContent: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  escalateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  escalateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  escalateSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  escalateDetails: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  escalateDetailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  escalateAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.danger,
  },
  escalateReceiver: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  escalateQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 16,
  },
  escalateButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  escalateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  escalateBtnNo: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  escalateBtnNoText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
  escalateBtnYes: {
    backgroundColor: COLORS.success,
  },
  escalateBtnYesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
