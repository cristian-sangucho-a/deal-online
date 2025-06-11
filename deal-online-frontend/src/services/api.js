const API_BASE_URL =
  import.meta.env.PUBLIC_API_URL || "http://localhost:3500/api";
const WS_BASE_URL = import.meta.env.PUBLIC_WS_URL || "ws://localhost:3501";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const api = {
  async request(endpoint, method = "GET", body = null, token = null) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || "Error en la solicitud",
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // For connection errors, throw a specific error that can be caught
      throw new ApiError("Error de conexión", 0, null);
    }
  },

  // Authentication endpoints
  async register(userData) {
    return this.request("/auth/register", "POST", userData);
  },

  async verifyRegistration(email, verificationCode) {
    return this.request("/auth/verify", "POST", { email, verificationCode });
  },

  async login(email, password) {
    return this.request("/auth/login", "POST", { email, password });
  },

  async refreshToken(token) {
    return this.request("/auth/refresh-token", "POST", { token });
  },

  async logout(token) {
    return this.request("/auth/logout", "POST", null, token);
  },

  async requestPasswordReset(email) {
    return this.request("/auth/forgot-password", "POST", { email });
  },

  async resetPassword(token, newPassword) {
    return this.request("/auth/reset-password", "POST", { token, newPassword });
  },

  // Product endpoints
  async createProduct(productData, token) {
    return this.request("/products", "POST", productData, token);
  },

  async getAllProducts(page = 1, limit = 12, search = "", category = "") {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category }),
    });
    return this.request(`/products?${params.toString()}`);
  },

  async getProductById(id) {
    return this.request(`/products/${id}`);
  },

  async updateProduct(id, productData, token) {
    return this.request(`/products/${id}`, "PUT", productData, token);
  },

  async deleteProduct(id, token) {
    return this.request(`/products/${id}`, "DELETE", null, token);
  },

  async getUserProducts(token) {
    return this.request("/products/my-products", "GET", null, token);
  },

  async getAuctionById(id) {
    return this.request(`/auctions/${id}`);
  },

  async closeAuction(auctionId, token) {
    return this.request(`/auctions/${auctionId}/close`, "POST", null, token);
  },

  async getActiveAuctions(page = 1, limit = 12) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request(`/auctions/active?${params.toString()}`);
  },

  // Bid endpoints
  async placeBid(auctionId, amount, message = "", token) {
    return this.request(
      "/bids",
      "POST",
      {
        auction_id: auctionId,
        amount,
        message,
      },
      token
    );
  },

  async getUserBids(token) {
    return this.request("/bids/my-bids", "GET", null, token);
  },

  async getAuctionBids(auctionId) {
    return this.request(`/bids/auction/${auctionId}`);
  },

  // User endpoints
  // Chat endpoints
  async getChatMessages(auctionId) {
    return this.request(`/chat/${auctionId}`);
  },

  async sendChatMessage(token, { auction_id, message, bid_amount = null, is_bid = false }) {
    return this.request(
      "/chat",
      "POST",
      {
        auction_id,
        message,
        bid_amount,
        is_bid,
      },
      token
    );
  },

  async getUserProfile(token) {
    return this.request("/users/profile", "GET", null, token);
  },

  async updateUserProfile(userData, token) {
    return this.request("/users/profile", "PUT", userData, token);
  },
};
