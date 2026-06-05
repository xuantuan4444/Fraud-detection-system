// ====================================================================
// TRANSACTION CONTEXT - Global state với WebSocket real-time events
// ====================================================================

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { processTransaction as apiProcessTransaction, getBackendHost } from '../services/api';
import { PIPELINE_STEPS } from '../constants/scenarios';

const TransactionContext = createContext(null);

// Map step ID từ backend → index trong PIPELINE_STEPS
const STEP_MAP = {
  submit: 0,
  phase1: 1,
  routing: 2,
  planner: 3,
  executor: 4,
  vision: 5,
  evaluate: 6,
  report: 7,
  detective: 8,
  decision: 9,
};

export function TransactionProvider({ children }) {
  const [pipelineSteps, setPipelineSteps] = useState(
    PIPELINE_STEPS.map(s => ({ ...s, status: 'pending', detail: '' }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  // Phase 2 OTP SMS state
  const [needsPhase2Otp, setNeedsPhase2Otp] = useState(false);
  const [phase2OtpVerified, setPhase2OtpVerified] = useState(false);
  const [currentRiskLevel, setCurrentRiskLevel] = useState(null);

  const wsRef = useRef(null);
  const currentTxnRef = useRef(null);
  const phase2ResolveRef = useRef(null);

  const resetPipeline = useCallback(() => {
    setPipelineSteps(PIPELINE_STEPS.map(s => ({ ...s, status: 'pending', detail: '' })));
    setCurrentStepIndex(-1);
    setResult(null);
    setError(null);
    setNeedsPhase2Otp(false);
    setPhase2OtpVerified(false);
    setCurrentRiskLevel(null);
  }, []);

  const updateStepByName = useCallback((stepName, status, detail = '') => {
    const index = STEP_MAP[stepName];
    if (index === undefined) return;

    setPipelineSteps(prev => prev.map((s, i) =>
      i === index ? { ...s, status, detail } : s
    ));

    if (status === 'active') {
      setCurrentStepIndex(index);
    }
  }, []);

  // Kết nối WebSocket để nhận real-time events
  const connectWebSocket = useCallback((transactionId) => {
    const host = getBackendHost();
    const wsUrl = `ws://${host}:8000/ws/pipeline/${transactionId}`;

    console.log(`[WS] Connecting to ${wsUrl}`);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WS] Connected');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] Event:', data.step, data.status, data.detail);

          // Update pipeline step
          updateStepByName(data.step, data.status, data.detail);

          // Trigger OTP khi routing = yellow (Phase 2 bắt đầu)
          // OTP form sẽ hiển thị song song với quá trình investigation
          if (data.step === 'routing' && data.status === 'done') {
            const riskLevel = data.data?.risk_level ||
              (data.detail?.toLowerCase().includes('yellow') ? 'yellow' : null);
            if (riskLevel === 'yellow') {
              setNeedsPhase2Otp(true);
              setCurrentRiskLevel('yellow');
            } else if (riskLevel) {
              setCurrentRiskLevel(riskLevel);
            }
          }

          // Nếu là final decision, lưu data
          if (data.step === 'decision' && data.status === 'done' && data.data) {
            // Result sẽ được set sau khi API trả về
          }
        } catch (e) {
          console.warn('[WS] Parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        setWsConnected(false);
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setWsConnected(false);
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('[WS] Connection failed:', e);
    }
  }, [updateStepByName]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Submit Phase 2 OTP (gọi khi user nhập xong OTP SMS)
  const submitPhase2Otp = useCallback((otpCode) => {
    // Chấp nhận bất kỳ 6 số
    if (otpCode && otpCode.length === 6) {
      setPhase2OtpVerified(true);
      setNeedsPhase2Otp(false);
      // Resume processing nếu có
      if (phase2ResolveRef.current) {
        phase2ResolveRef.current();
        phase2ResolveRef.current = null;
      }
      return true;
    }
    return false;
  }, []);

  const processTransaction = useCallback(async (transaction) => {
    resetPipeline();
    setIsProcessing(true);
    setError(null);
    currentTxnRef.current = transaction;

    // Kết nối WebSocket trước
    connectWebSocket(transaction.transaction_id);

    // Đợi 1 chút để WebSocket kết nối
    await new Promise(r => setTimeout(r, 300));

    try {
      // Gọi API - backend sẽ emit events qua WebSocket
      const data = await apiProcessTransaction(transaction);

      // Nếu mock (không có WS), animate như cũ
      if (!wsConnected) {
        await animateFallback(transaction, data);
      }

      setResult(data);

      // Add to history
      const riskLevel = data.phase1?.risk_level || 'unknown';
      setTransactionHistory(prev => [
        {
          id: transaction.transaction_id,
          timestamp: new Date().toISOString(),
          sender: transaction.sender_id,
          senderName: transaction.sender_name,
          receiver: transaction.receiver_id,
          receiverName: transaction.receiver_name,
          amount: transaction.amount,
          decision: data.decision,
          riskLevel,
          data,
        },
        ...prev,
      ]);

    } catch (err) {
      setError(err.message);
      updateStepByName('decision', 'error', err.message);
    } finally {
      setIsProcessing(false);
      // Đợi thêm chút để nhận hết events rồi disconnect
      setTimeout(() => {
        disconnectWebSocket();
      }, 1000);
    }
  }, [resetPipeline, connectWebSocket, disconnectWebSocket, updateStepByName, wsConnected]);

  const updateTransactionHistory = useCallback((txnId, updates) => {
    setTransactionHistory(prev => prev.map(txn => 
      txn.id === txnId ? { ...txn, ...updates } : txn
    ));
  }, []);

  // Fallback animation khi không có WebSocket (mock mode)
  const animateFallback = async (transaction, data) => {
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    // Submit
    updateStepByName('submit', 'done',
      `${transaction.sender_id} → ${transaction.receiver_id}: $${Number(transaction.amount).toLocaleString()}`);

    // Phase 1
    updateStepByName('phase1', 'active', 'Checking rules...');
    await delay(400);

    const riskLevel = data.phase1?.risk_level || 'yellow';
    const riskScore = data.phase1?.risk_score || 0;
    setCurrentRiskLevel(riskLevel);

    updateStepByName('phase1', 'done', `Score: ${riskScore.toFixed(3)}`);

    // Routing
    updateStepByName('routing', 'done', `${riskLevel.toUpperCase()}`);
    await delay(300);

    // Yellow case - yêu cầu OTP ngay sau routing
    if (riskLevel === 'yellow') {
      setNeedsPhase2Otp(true);
    }

    if (riskLevel === 'green' || riskLevel === 'red') {
      // Skip investigation
      ['planner', 'executor', 'vision', 'evaluate', 'report', 'detective'].forEach(s => {
        updateStepByName(s, 'skipped', `Skipped (${riskLevel.toUpperCase()})`);
      });
      await delay(300);
      updateStepByName('decision', 'done', data.decision?.toUpperCase());
    } else {
      // Yellow case - Phase 2 investigation (OTP đã được yêu cầu ở trên)
      const steps = ['planner', 'executor', 'vision', 'evaluate', 'report', 'detective'];
      for (const step of steps) {
        updateStepByName(step, 'active', `Running ${step}...`);
        await delay(500);
        updateStepByName(step, 'done', `${step} complete`);
      }
      updateStepByName('decision', 'done', data.decision?.toUpperCase());
    }
  };

  return (
    <TransactionContext.Provider value={{
      pipelineSteps,
      currentStepIndex,
      isProcessing,
      result,
      error,
      transactionHistory,
      wsConnected,
      needsPhase2Otp,
      phase2OtpVerified,
      currentRiskLevel,
      processTransaction,
      resetPipeline,
      submitPhase2Otp,
      updateTransactionHistory,
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransaction must be used within TransactionProvider');
  return ctx;
}
