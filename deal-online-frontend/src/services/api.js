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

  async resendVerificationCode(email) {
    return this.request("/auth/resend-verification", "POST", { email });
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
    return this.request("/auth/request-password-reset", "POST", { email });
  },

  async verifyResetCode(email, verificationCode) {
    return this.request("/auth/verify-reset-code", "POST", {
      email,
      verificationCode,
    });
  },

  async resetPassword(email, verificationCode, newPassword) {
    return this.request("/auth/reset-password", "POST", {
      email,
      verificationCode,
      newPassword,
    });
  },

  // Product endpoints
  async createProduct(productData, token) {
    return this.request("/product", "POST", productData, token);
  },

  async getAllProducts(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.category) queryParams.append("category", params.category);
    if (params.status) queryParams.append("status", params.status);
    const endpoint = `/products${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    try {
      const response = await this.request(endpoint, "GET");
      if (Array.isArray(response)) {
        return {
          products: response,
          total: response.length,
          page: params.page || 1,
        };
      }
      return response;
    } catch (error) {
      console.error("❌ Error en API /products:", {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      throw error;
    }
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

  async getAuctionById(id) {
    return this.request(`/auctions/${id}`);
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

  // User data endpoints - NUEVOS MÉTODOS
  async getUserProducts(token) {
    return this.request("/my-products", "GET", null, token);
  },

  async getUserBids(token) {
    return this.request("/my-bids", "GET", null, token);
  },

  async getUserStats(token) {
    return this.request("/my-stats", "GET", null, token);
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

  // Chat endpoints
  async sendChatMessage(
    auctionId,
    message,
    isBid = false,
    bidAmount = null,
    token
  ) {
    return this.request(
      "/chat",
      "POST",
      {
        auction_id: auctionId,
        message,
        is_bid: isBid,
        bid_amount: bidAmount,
      },
      token
    );
  },

  async sendChatMessage(
    token,
    { auction_id, message, bid_amount = null, is_bid = false }
  ) {
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

  // User endpoints
  async getUserProfile(token) {
    return this.request("/users/profile", "GET", null, token);
  },

  async updateUserProfile(userData, token) {
    return this.request("/users/profile", "PUT", userData, token);
  },
};
