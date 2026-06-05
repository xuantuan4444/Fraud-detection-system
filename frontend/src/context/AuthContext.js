// ====================================================================
// AUTH CONTEXT - Quản lý trạng thái đăng nhập
// ====================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// Danh sách tài khoản synthetic
export const SYNTHETIC_ACCOUNTS = [
  {
    id: 'C1003668831',
    name: 'Huỳnh Vinh Hải',
    balance: 101844.98,
    accountType: 'savings',
    status: 'whitelisted',
    yearsActive: 4.6, // 1704 days
  },
  {
    id: 'C1004838919',
    name: 'Bùi Uyên An',
    balance: 8526.19,
    accountType: 'savings',
    status: 'normal',
    yearsActive: 3, // 1096 days
  },
  {
    id: 'C1260026789',
    name: 'Hồ Yến Thảo',
    balance: 8000000.00,
    accountType: 'checking',
    status: 'kyc_pending',
    yearsActive: 0.03, // 13 days
  },
  {
    id: 'C1102413633',
    name: 'Lê Hải Vinh',
    balance: 26000.00,
    accountType: 'checking',
    status: 'high_velocity',
    yearsActive: 0.18, // 69 days
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Track all account balances (for simulation)
  const [accountBalances, setAccountBalances] = useState(() => {
    const balances = {};
    SYNTHETIC_ACCOUNTS.forEach(acc => {
      balances[acc.id] = acc.balance;
    });
    return balances;
  });

  const login = useCallback((accountId, password) => {
    // Tìm tài khoản theo ID
    let account = SYNTHETIC_ACCOUNTS.find(
      acc => acc.id.toLowerCase() === accountId.toLowerCase()
    );

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Chấp nhận mật khẩu bất kỳ (miễn là không rỗng)
    if (!password || password.trim().length === 0) {
      return { success: false, error: 'Please enter password' };
    }

    // Set user with current balance from accountBalances
    setUser({
      ...account,
      balance: accountBalances[account.id] ?? account.balance,
    });
    setIsAuthenticated(true);
    return { success: true };
  }, [accountBalances]);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Update balance after successful transfer
  const updateBalance = useCallback((senderId, receiverId, amount) => {
    const numAmount = parseFloat(amount);

    setAccountBalances(prev => {
      const newBalances = { ...prev };

      // Deduct from sender
      const senderOrig = newBalances[senderId] !== undefined ? newBalances[senderId] : 10000000.0;
      newBalances[senderId] = Math.max(0, senderOrig - numAmount);

      // Add to receiver
      const recOrig = newBalances[receiverId] !== undefined ? newBalances[receiverId] : 10000000.0;
      newBalances[receiverId] = recOrig + numAmount;

      return newBalances;
    });

    // Update current user's balance if they are the sender
    setUser(prev => {
      if (prev && prev.id === senderId) {
        return {
          ...prev,
          balance: Math.max(0, prev.balance - numAmount),
        };
      }
      // If user is the receiver
      if (prev && prev.id === receiverId) {
        return {
          ...prev,
          balance: prev.balance + numAmount,
        };
      }
      return prev;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      updateBalance,
      accounts: SYNTHETIC_ACCOUNTS,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
