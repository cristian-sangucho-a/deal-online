const API_BASE_URL =
  import.meta.env.PUBLIC_API_URL || "http://localhost:3050/api";
const WS_BASE_URL = import.meta.env.PUBLIC_WS_URL || "ws://localhost:3051";

// Debug: mostrar la URL base que se está usando
console.log(`🔧 API_BASE_URL configurada: ${API_BASE_URL}`);
console.log(`🔧 WS_BASE_URL configurada: ${WS_BASE_URL}`);
console.log(`🔧 Variables de entorno import.meta.env:`, {
  PUBLIC_API_URL: import.meta.env.PUBLIC_API_URL,
  PUBLIC_WS_URL: import.meta.env.PUBLIC_WS_URL,
  PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
});

// También verificar process.env para depuración
if (typeof process !== "undefined" && process.env) {
  console.log(`🔧 Variables de entorno process.env:`, {
    PUBLIC_API_URL: process.env.PUBLIC_API_URL,
    PUBLIC_WS_URL: process.env.PUBLIC_WS_URL,
    PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}

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

  // Authentication endpoints (auth-service)
  async register(userData) {
    return this.request("/auth/register", "POST", {
      nombre: userData.nombre,
      email: userData.email,
      password: userData.password,
      celular: userData.celular,
    });
  },

  async verifyRegistration(email, verificationCode) {
    return this.request("/auth/verify", "POST", {
      email,
      code: verificationCode, // Cambiado de 'verificationCode' a 'code'
    });
  },

  async resendVerificationCode(email) {
    // Nota: Este endpoint no está documentado en los nuevos microservicios
    // Puede que necesites implementarlo o usar un método alternativo
    return this.request("/auth/resend-verification", "POST", { email });
  },

  async login(email, password) {
    return this.request("/auth/login", "POST", { email, password });
  },

  async refreshToken(token) {
    // Nota: Este endpoint no está documentado en los nuevos microservicios
    return this.request("/auth/refresh-token", "POST", { token });
  },

  async logout(token) {
    // Nota: Este endpoint no está documentado en los nuevos microservicios
    return this.request("/auth/logout", "POST", null, token);
  },

  async requestPasswordReset(email) {
    // Nota: Este endpoint no está documentado en los nuevos microservicios
    return this.request("/auth/request-password-reset", "POST", { email });
  },

  async verifyResetCode(email, verificationCode) {
    // Nota: Este endpoint no está documentado en los nuevos microservicios
    return this.request("/auth/verify-reset-code", "POST", {
      email,
      verificationCode,
    });
  },

  async resetPassword(email, verificationCode, newPassword) {
    // Nota: Este endpoint no está documentado en los nuevos microservicios
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

  // Product endpoints - Ahora obtenidos desde las subastas
  async getAllProducts(params = {}) {
    // En los microservicios, los productos están asociados a las subastas
    // Usamos el endpoint de subastas y extraemos los productos
    try {
      const auctions = await this.getAllAuctions();
      const products = auctions.map((auction) => ({
        ...auction.product,
        auction_id: auction.id,
        current_price: auction.current_price,
        start_price: auction.start_price,
        end_time: auction.end_time,
      }));

      return {
        products: products,
        total: products.length,
        page: params.page || 1,
      };
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
    // Los productos ahora se obtienen a través de las subastas
    return this.request(`/auctions/${id}`);
  },

  // Métodos de productos individuales ya no están disponibles en microservicios
  // Los productos se manejan a través de las subastas

  // Auction endpoints (auction-service)
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
    // Nota: Este endpoint no está documentado en los nuevos microservicios
    return this.request(`/auctions/${auctionId}/close`, "POST", null, token);
  },

  async getActiveAuctions(page = 1, limit = 12) {
    // Simplificado - el endpoint /auctions ya retorna solo las activas
    try {
      const auctions = await this.getAllAuctions();
      // Aplicar paginación del lado del cliente si es necesario
      const startIndex = (page - 1) * limit;
      const paginatedAuctions = auctions.slice(startIndex, startIndex + limit);

      return {
        auctions: paginatedAuctions,
        total: auctions.length,
        page: page,
        limit: limit,
      };
    } catch (error) {
      console.log(`⚠️ Error obteniendo subastas activas:`, error);
      throw error;
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

  // Chat endpoints (chat-service)
  async getChatMessages(auctionId, token) {
    // Actualizado para usar el nuevo endpoint de microservicios
    return this.request(`/chat/${auctionId}/history`, "GET", null, token);
  },

  async sendChatMessage(auctionId, message, token) {
    // Simplificado - el chat en tiempo real se maneja por WebSocket
    // Este endpoint puede no estar disponible, usar WebSocket en su lugar
    console.log(`⚠️ Chat en tiempo real debe usarse via WebSocket`);
    throw new ApiError(
      "Chat en tiempo real debe usarse via WebSocket",
      501,
      null
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
