import { io } from "socket.io-client";

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

// ================================================================
// Cliente de API (Peticiones HTTP)
// ================================================================
const request = async (endpoint, method = "GET", body = null, token = null) => {
  const fullUrl = `${API_GATEWAY_URL}/api${endpoint}`;

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
    const response = await fetch(fullUrl, options);
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
    console.error(`❌ Error en la petición a ${fullUrl}:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Error de conexión con el servidor.", 0, null);
  }
};

// ================================================================
// Endpoints Disponibles
// ================================================================
export const api = {
  // --- Auth Service ---
  register(userData) {
    return request("/auth/register", "POST", userData);
  },

  verify(email, code) {
    return request("/auth/verify", "POST", { email, code });
  },

  login(email, password) {
    return request("/auth/login", "POST", { email, password });
  },

  // --- Auction Service ---
  createAuction(auctionData, token) {
    return request("/auctions", "POST", auctionData, token);
  },

  getActiveAuctions() {
    return request("/auctions", "GET");
  },

  getAuctionById(id) {
    return request(`/auctions/${id}`, "GET");
  },

  placeBid(auctionId, amount, token) {
    return request(`/auctions/${auctionId}/bids`, "POST", { amount }, token);
  },

  // --- INICIO DE LA CORRECCIÓN ---
  // NUEVO MÉTODO para llamar al nuevo endpoint del backend
  getMyAuctions(token) {
    return request('/auctions/my-auctions', 'GET', null, token);
  },
  // --- FIN DE LA CORRECCIÓN ---

  // --- Chat Service ---
  getChatHistory(auctionId, token) {
    return request(`/chat/${auctionId}/history`, "GET", null, token);
  },
};

// ================================================================
// Cliente de WebSockets
// ================================================================
export const socket = {
  chat: null,
  auction: null,

  connect(token) {
    if (!token) {
      console.error("Se necesita un token para conectar los WebSockets.");
      return;
    }

    // --- Conexión al Chat ---
    if (!this.chat) {
      this.chat = io(WS_GATEWAY_URL, {
        path: "/chat/socket.io/", // Ruta única para el chat
        auth: { token }
      });

      this.chat.on('connect', () => console.log('✅ Conectado al WebSocket de Chat'));
      this.chat.on('connect_error', (err) => console.error('❌ Error de conexión al Chat:', err.message));
    }

    // --- Conexión a Subastas ---
    if (!this.auction) {
      this.auction = io(WS_GATEWAY_URL, {
        path: "/auction/socket.io/", // Ruta única para las subastas
        auth: { token }
      });

      this.auction.on('connect', () => console.log('✅ Conectado al WebSocket de Subastas'));
      this.auction.on('connect_error', (err) => console.error('❌ Error de conexión a Subastas:', err.message));
    }
  },

  disconnect() {
    if (this.chat) {
      this.chat.disconnect();
      this.chat = null;
      console.log('🔌 Desconectado del WebSocket de Chat');
    }
    if (this.auction) {
      this.auction.disconnect();
      this.auction = null;
      console.log('🔌 Desconectado del WebSocket de Subastas');
    }
  }
};
