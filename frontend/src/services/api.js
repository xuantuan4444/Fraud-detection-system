// ====================================================================
// API SERVICE - Kết nối frontend React Native với FastAPI backend
// ====================================================================
// Backend chạy trên máy tính (localhost:8000)
// Từ điện thoại thật => cần dùng IP LAN của máy tính
// ====================================================================

// *** THAY ĐỔI IP NÀY thành IP LAN của máy tính bạn ***
// Chạy `ipconfig` (Windows) hoặc `ifconfig` (Mac) để lấy
// Ví dụ: 192.168.1.100
const BACKEND_HOST = "192.168.1.6";
const BACKEND_PORT = 8000;
const BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

/**
 * Gửi giao dịch đến backend để xử lý qua fraud detection pipeline
 */
export async function processTransaction(transaction) {
  try {
    const response = await fetch(`${BASE_URL}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server error ${response.status}: ${errText}`);
    }

    return await response.json();
  } catch (err) {
    // Nếu không gọi được backend => trả mock data để demo UI
    console.warn('Backend unreachable, using mock response:', err.message);
    return generateMockResponse(transaction);
  }
}

/**
 * Check backend health
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${BASE_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Cập nhật backend host (gọi từ Settings)
 */
let _host = BACKEND_HOST;
export function setBackendHost(host) {
  _host = host;
}
export function getBackendHost() {
  return _host;
}

// ====================================================================
// MOCK DATA - Cho phép demo UI khi chưa có backend
// ====================================================================

function generateMockResponse(transaction) {
  const amount = transaction.amount || 0;
  const senderId = transaction.sender_id || '';
  const receiverId = transaction.receiver_id || '';

  // Simple rule: simulate backend logic
  let decision, riskLevel, riskScore;

  if (senderId === 'ACC_001' && amount < 1000) {
    decision = 'allow';
    riskLevel = 'green';
    riskScore = 0.05;
  } else if (receiverId === 'ACC_666' || amount > 20000) {
    decision = 'block';
    riskLevel = 'red';
    riskScore = 0.95;
  } else {
    decision = 'block';
    riskLevel = 'yellow';
    riskScore = 0.55;
  }

  const triggeredRules = [];
  if (amount > 10000) triggeredRules.push({ rule: 'LARGE_AMOUNT', severity: 'high', detail: `Amount $${amount.toLocaleString()} > $10,000 threshold` });
  if (amount >= 900 && amount < 1000) triggeredRules.push({ rule: 'STRUCTURING_SUSPICION', severity: 'high', detail: `Amount $${amount} just below $1,000 reporting threshold` });
  if (receiverId === 'ACC_666') triggeredRules.push({ rule: 'RECEIVER_BLACKLISTED', severity: 'critical', detail: `Receiver ${receiverId} is on blacklist` });
  if (transaction.ip_address?.includes('Tor') || transaction.ip_address?.includes('VPN')) {
    triggeredRules.push({ rule: 'VPN_TOR_DETECTED', severity: 'high', detail: `IP flagged as VPN/Tor` });
  }
  if (transaction.device_id?.startsWith('DEV_UNKNOWN')) {
    triggeredRules.push({ rule: 'UNKNOWN_DEVICE', severity: 'medium', detail: `Unknown device detected` });
  }

  return {
    decision,
    message: decision === 'allow'
      ? `Transaction ${transaction.transaction_id} ALLOWED. Low risk sender.`
      : decision === 'block'
        ? `Transaction ${transaction.transaction_id} BLOCKED. ${riskLevel === 'red' ? 'Critical risk detected.' : 'Investigation found suspicious patterns.'}`
        : `Transaction ${transaction.transaction_id} ESCALATED for human review.`,
    phase1: {
      risk_level: riskLevel,
      risk_score: riskScore,
      triggered_rules: triggeredRules,
      context_summary: `Transaction $${amount.toLocaleString()} from ${senderId} to ${receiverId}. ${triggeredRules.length} rules triggered.`,
    },
    investigation: riskLevel === 'yellow' ? {
      steps: 2,
      evidence_count: 5,
      confidence: 0.82,
    } : null,
    report: riskLevel === 'yellow' ? {
      summary: `Investigation of suspicious transaction $${amount} from ${senderId}. Pattern analysis suggests potential ${amount < 1000 ? 'structuring' : 'money laundering'} behavior.`,
      risk_factors: triggeredRules.map(r => `[${r.severity.toUpperCase()}] ${r.rule}: ${r.detail}`),
      detailed_analysis: `Multi-agent investigation conducted:\n\n1. Graph Analysis (Neo4j): Sender has ${amount < 1000 ? '15' : '3'} connections, ${amount < 1000 ? 'high frequency small transfers detected' : 'large transfer to flagged entity'}.\n\n2. Historical Data (MongoDB): ${amount < 1000 ? 'Pattern of repeated near-threshold transactions' : 'First large transaction from new account'}.\n\n3. Knowledge Base (ChromaDB): Pattern matches known ${amount < 1000 ? 'structuring' : 'money laundering'} typology.\n\nConclusion: Transaction exhibits ${amount < 1000 ? 'structuring' : 'high-risk'} characteristics and should be blocked.`,
    } : null,
    detail: {
      confidence: riskLevel === 'green' ? 0.95 : riskLevel === 'red' ? 0.99 : 0.82,
      reasoning: decision === 'allow'
        ? 'Sender whitelisted, low risk score, small amount'
        : riskLevel === 'red'
          ? 'Critical risk: blacklisted receiver and/or extreme risk score'
          : `Investigation reveals suspicious patterns. ${triggeredRules.length} risk factors identified.`,
      actions: decision === 'block' ? ['Transaction blocked', 'Sender flagged for review', 'Risk score updated'] : [],
    },
  };
}
