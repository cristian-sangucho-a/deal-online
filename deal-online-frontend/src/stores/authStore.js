import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { api } from '../services/api.js';

// Persistent stores for authentication
export const $token = persistentAtom('authToken', null);
export const $user = persistentAtom('user', null, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Regular stores for UI state
export const $authLoading = atom(false);
export const $authError = atom(null);

// Auth actions
export const authActions = {
  async login(email, password) {
    $authLoading.set(true);
    $authError.set(null);

    try {
      const { user, token } = await api.login(email, password);
      $token.set(token);
      $user.set(user);
      return { success: true };
    } catch (error) {
      $authError.set(error.message);
      return { success: false, error: error.message };
    } finally {
      $authLoading.set(false);
    }
  },

  async register(userData) {
    $authLoading.set(true);
    $authError.set(null);

    try {
      const result = await api.register(userData);
      return { success: true, data: result };
    } catch (error) {
      $authError.set(error.message);
      return { success: false, error: error.message };
    } finally {
      $authLoading.set(false);
    }
  },

  async verifyRegistration(email, code) {
    $authLoading.set(true);
    $authError.set(null);

    try {
      const { user, token } = await api.verifyRegistration(email, code);
      $token.set(token);
      $user.set(user);
      return { success: true };
    } catch (error) {
      $authError.set(error.message);
      return { success: false, error: error.message };
    } finally {
      $authLoading.set(false);
    }
  },

  async logout() {
    const token = $token.get();
    if (token) {
      try {
        await api.logout(token);
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }
    
    $token.set(null);
    $user.set(null);
    $authError.set(null);
  },

  async refreshToken() {
    const token = $token.get();
    if (!token) return false;

    try {
      const { token: newToken } = await api.refreshToken(token);
      $token.set(newToken);
      return true;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      this.logout();
      return false;
    }
  },

  clearError() {
    $authError.set(null);
  }
};

// Auto-refresh token logic
let refreshInterval;

function startTokenRefresh() {
  clearInterval(refreshInterval);
  
  refreshInterval = setInterval(async () => {
    const token = $token.get();
    if (!token) return;

    try {
      // Parse JWT to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      
      // Refresh if token expires in less than 5 minutes
      if (now > exp - 5 * 60 * 1000) {
        await authActions.refreshToken();
      }
    } catch (error) {
      console.warn('Token parsing failed:', error);
      authActions.logout();
    }
  }, 60000); // Check every minute
}

// Initialize token refresh on client side
if (typeof window !== 'undefined') {
  startTokenRefresh();
  
  // Listen for token changes
  $token.subscribe((token) => {
    if (token) {
      startTokenRefresh();
    } else {
      clearInterval(refreshInterval);
    }
  });
}