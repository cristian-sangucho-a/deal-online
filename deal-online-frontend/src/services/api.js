import { io } from "socket.io-client";
// 1. IMPORTAMOS EL STORE DEL TOKEN Y LAS ACCIONES DE AUTH
// Esto nos permite leer el token y llamar a la función de logout.
import { $token, authActions } from "../stores/authStore.js";

// --- Variables de Entorno y Debugging (sin cambios) ---
// Se asume que estas variables se resuelven correctamente en tu entorno de compilación (ej. Vite, Astro).
const API_GATEWAY_URL =
  import.meta.env.PUBLIC_API_URL || "http://localhost:3000";
const WS_GATEWAY_URL = import.meta.env.PUBLIC_WS_URL || "http://localhost:3000";

console.log(`🔧 API Gateway URL configurada: ${API_GATEWAY_URL}`);
console.log(`🔧 WebSocket Gateway URL configurada: ${WS_GATEWAY_URL}`);
console.log(`🔧 Variables de entorno import.meta.env:`, {
  PUBLIC_API_URL: import.meta.env.PUBLIC_API_URL,
  PUBLIC_WS_URL: import.meta.env.PUBLIC_WS_URL,
  PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
});

if (typeof process !== "undefined" && process.env) {
  console.log(`🔧 Variables de entorno process.env:`, {
    PUBLIC_API_URL: process.env.PUBLIC_API_URL,
    PUBLIC_WS_URL: process.env.PUBLIC_WS_URL,
    PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}

// --- Clase de Error Personalizada (sin cambios) ---
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// ================================================================
// Cliente de API (Peticiones HTTP) - REFACTORIZADO
// ================================================================

/**
 * Función base para realizar peticiones a la API.
 * @param {string} endpoint - El endpoint de la API (ej. '/auth/login').
 * @param {string} method - El método HTTP (ej. 'GET', 'POST').
 * @param {object|null} body - El cuerpo de la petición para POST, PUT, etc.
 * @param {boolean} requiresAuth - Si es `true`, se adjuntará el token JWT a la petición.
 */
const request = async (
  endpoint,
  method = "GET",
  body = null,
  requiresAuth = false
) => {
  const fullUrl = `${API_GATEWAY_URL}/api${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
  };

  // 2. LÓGICA CENTRALIZADA PARA AÑADIR EL TOKEN
  // Si la petición requiere autenticación, obtenemos el token del store.
  if (requiresAuth) {
    const token = $token.get(); // Obtenemos el token actual de nanostores.
    if (!token) {
      // Evitamos una llamada a la API que sabemos que fallará.
      const errorMessage = `Acceso no autorizado. La ruta ${endpoint} requiere iniciar sesión.`;
      console.error(errorMessage);
      throw new ApiError(errorMessage, 401, null);
    }
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

    // 3. MEJORA: CIERRE DE SESIÓN AUTOMÁTICO
    // Si la respuesta es 401, el token es inválido o ha expirado.
    // Limpiamos la sesión en el frontend para evitar más errores.
    if (response.status === 401 && requiresAuth) {
      console.warn(
        "Token inválido o expirado detectado. Cerrando sesión localmente."
      );
      authActions.logout(); // Usamos la acción de logout para limpiar el token y el usuario.
    }

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
    // Error genérico para problemas de red o si `response.json()` falla.
    throw new ApiError("Error de conexión con el servidor.", 0, null);
  }
};

// ================================================================
// Endpoints Disponibles - SIMPLIFICADOS
// ================================================================
// 4. MÉTODOS DE API LIMPIOS
// Ya no es necesario pasar el token manualmente. Solo se indica si la ruta requiere autenticación.
export const api = {
  // --- Auth Service (no requieren token) ---
  register(userData) {
    return request("/auth/register", "POST", userData, false);
  },
  verify(email, code) {
    return request("/auth/verify", "POST", { email, code }, false);
  },
  login(email, password) {
    return request("/auth/login", "POST", { email, password }, false);
  },

  // --- Auction Service ---
  createAuction(auctionData) {
    return request("/auctions", "POST", auctionData, true); // Requiere auth
  },
  getActiveAuctions() {
    return request("/auctions", "GET", null, false); // Pública
  },
  getAuctionById(id) {
    return request(`/auctions/${id}`, "GET", null, false); // Pública
  },
  placeBid(auctionId, amount) {
    return request(`/auctions/${auctionId}/bids`, "POST", { amount }, true); // Requiere auth
  },
  getMyAuctions() {
    return request("/auctions/my-auctions", "GET", null, true); // Requiere auth
  },

  // --- AÑADE ESTA NUEVA FUNCIÓN ---
  getUserBids() {
    return request("/auctions/bids/my-bids", "GET", null, true); // Ruta protegida
  },

  // --- Chat Service ---
  getChatHistory(auctionId) {
    return request(`/chat/${auctionId}/history`, "GET", null, true); // Requiere auth
  },
};

// ================================================================
// Cliente de WebSockets - ACTUALIZADO para coincidir con el backend
// ================================================================
export const socket = {
  chat: null,
  auction: null,

  connect(token) {
    if (!token) {
      console.error("Se necesita un token para conectar los WebSockets.");
      return;
    }

    // Configuración común para ambos servicios
    const commonOptions = (path) => ({
      path,
      auth: { token },
      cors: { origin: "*" },
      transports: ["polling"], // ¡Cambia a 'polling' para probar!
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 100,
    });

    // Conectar al Chat Service
    if (!this.chat) {
      this.chat = io(WS_GATEWAY_URL, commonOptions("/chat/socket.io"));
      this.chat.on("connect", () =>
        console.log("✅ Conectado al Chat Service:", this.chat.id)
      );
      this.chat.on("connect_error", (err) =>
        console.error("❌ Error de conexión al Chat:", err.message)
      );
      this.chat.on("disconnect", (reason) =>
        console.log("❌ Desconectado del Chat:", reason)
      );
    }

    // Conectar al Auction Service
    if (!this.auction) {
      this.auction = io(WS_GATEWAY_URL, commonOptions("/auction/socket.io"));
      this.auction.on("connect", () =>
        console.log("✅ Conectado al Auction Service:", this.auction.id)
      );
      this.auction.on("connect_error", (err) =>
        console.error("❌ Error de conexión a Auction:", err.message)
      );
      this.auction.on("disconnect", (reason) =>
        console.log("❌ Desconectado del Auction:", reason)
      );
    }
  },

  disconnect() {
    if (this.chat) {
      this.chat.disconnect();
      this.chat = null;
      console.log("🔌 Desconectado del Chat Service");
    }
    if (this.auction) {
      this.auction.disconnect();
      this.auction = null;
      console.log("🔌 Desconectado del Auction Service");
    }
  },
};
