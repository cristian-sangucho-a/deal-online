const API_BASE_URL =
  import.meta.env.PUBLIC_API_URL || "http://localhost:3500/api";
const WS_BASE_URL = import.meta.env.PUBLIC_WS_URL || "ws://localhost:3501";

// Debug: mostrar la URL base que se está usando
console.log(`🔧 API_BASE_URL configurada: ${API_BASE_URL}`);
console.log(`🔧 Variables de entorno:`, {
  PUBLIC_API_URL: import.meta.env.PUBLIC_API_URL,
  PUBLIC_WS_URL: import.meta.env.PUBLIC_WS_URL,
});

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const api = {
  async request(endpoint, method = "GET", body = null, token = null) {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`🌐 API Request: ${method} ${fullUrl}`);
    console.log(`🔧 Headers que se enviarán:`, {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    });

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
      console.log(`📦 Request body:`, body);
      options.body = JSON.stringify(body);
    }

    console.log(`📋 Opciones completas de fetch:`, {
      url: fullUrl,
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    try {
      console.log(`⏱️ Iniciando fetch request...`);
      const response = await fetch(fullUrl, options);

      console.log(`📥 Respuesta recibida:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      let data;
      try {
        data = await response.json();
        console.log(`📄 Datos de respuesta parseados:`, data);
      } catch (jsonError) {
        console.log(`❌ Error al parsear JSON:`, jsonError);
        console.log(`📄 Respuesta raw:`, await response.text());
        throw new ApiError(
          "Error al procesar respuesta del servidor",
          response.status,
          null
        );
      }

      if (!response.ok) {
        console.log(`❌ API Error: ${response.status} - ${fullUrl}`, data);
        throw new ApiError(
          data.message || "Error en la solicitud",
          response.status,
          data
        );
      }

      console.log(`✅ API Success: ${response.status} - ${fullUrl}`, data);
      return data;
    } catch (error) {
      console.log(`🔍 Análisis detallado del error:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        isApiError: error instanceof ApiError,
      });

      if (error instanceof ApiError) {
        console.log(`❌ Error en API ${endpoint}:`, error);
        throw error;
      }

      // Análisis específico de errores de conexión
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        console.log(`🚫 Error de fetch detectado. Posibles causas:`);
        console.log(`   - Servidor no disponible en: ${fullUrl}`);
        console.log(`   - Problemas de CORS`);
        console.log(`   - Red no disponible`);
        console.log(`   - SSL/TLS issues`);
      }

      console.log(`❌ Error de conexión en ${fullUrl}:`, error);
      throw new ApiError("Error de conexión", 0, null);
    }
  },

  // Authentication endpoints
  async register(userData) {
    return this.request("/auth/register", "POST", {
      nombre: userData.nombre,
      email: userData.email,
      password: userData.password,
      celular: userData.celular,
    });
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

  //Auction endpoints
  async createAuction(auctionData, token) {
    return this.request(
      "/auctions",
      "POST",
      {
        productName: auctionData.productName,
        productDescription: auctionData.productDescription,
        imageUrl: auctionData.imageUrl,
        startPrice: auctionData.startPrice,
        endTime: auctionData.endTime,
      },
      token
    );
  },

  async getAllAuctions() {
    return this.request("/auctions");
  },

  async getAuctionById(id) {
    return this.request(`/auctions/${id}`);
  },

  async placeBid(auctionId, amount, token) {
    return this.request(
      `/auctions/${auctionId}/bids`,
      "POST",
      { amount },
      token
    );
  },

  async closeAuction(auctionId, token) {
    return this.request(`/auctions/${auctionId}/close`, "POST", null, token);
  },

  async getActiveAuctions(page = 1, limit = 12) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    try {
      // Primero intentar el endpoint de subastas activas
      return await this.request(`/auctions/active?${params.toString()}`);
    } catch (error) {
      console.log(
        `⚠️ Endpoint /auctions/active falló, intentando /auctions...`
      );
      // Si falla, intentar con el endpoint genérico de subastas
      return await this.request(`/auctions?${params.toString()}`);
    }
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
  async getChatMessages(auctionId, token) {
    return this.request(`/chat/${auctionId}`, "GET", null, token);
  },

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

  // User endpoints
  async getUserProfile(token) {
    return this.request("/users/profile", "GET", null, token);
  },

  async updateUserProfile(userData, token) {
    return this.request("/users/profile", "PUT", userData, token);
  },
};
