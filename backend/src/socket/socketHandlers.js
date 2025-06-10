import jwt from "jsonwebtoken";
import ChatService from "../services/chatService.js";
import AuctionService from "../services/auctionService.js";
import { logger } from "../utils/logger.js";

// Almacenar usuarios conectados por subasta
const connectedUsers = new Map(); // auctionId -> Set de userIds

export const setupSocketHandlers = (io) => {
  console.log("🔌 Configurando manejadores de Socket.IO...");

  // Middleware de autenticación para Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];
      if (!token) {
        return next(new Error("Token de autenticación requerido"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId || decoded.id;
      socket.userEmail = decoded.email;
      socket.userName = decoded.name;
      socket.userRole = decoded.role;

      logger.info(`Usuario autenticado en WebSocket: ${socket.userEmail}`);
      next();
    } catch (error) {
      logger.error("Error de autenticación WebSocket:", error);
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `✅ Cliente conectado: ${socket.id} - Usuario: ${socket.userName}`
    );

    // Unirse a una sala de subasta
    socket.on("join_auction", async (data) => {
      try {
        const { auctionId } = data;
        const room = `auction_${auctionId}`;

        // Verificar que la subasta existe y está activa
        const auction = await AuctionService.getAuctionById(auctionId);
        if (!auction || auction.status !== "active") {
          socket.emit("error", { message: "Subasta no disponible" });
          return;
        }

        // Unirse a la sala
        socket.join(room);
        socket.auctionId = auctionId;

        // Agregar usuario al Map de usuarios conectados
        if (!connectedUsers.has(auctionId)) {
          connectedUsers.set(auctionId, new Set());
        }
        connectedUsers.get(auctionId).add(socket.userId);

        console.log(
          `👤 Usuario ${socket.userName} se unió a la subasta ${auctionId}`
        );

        // Notificar a todos en la sala
        socket.to(room).emit("user_joined", {
          userId: socket.userId,
          username: socket.userName,
          message: `${socket.userName} se unió al chat`,
          timestamp: new Date().toISOString(),
          connectedCount: connectedUsers.get(auctionId).size,
        });

        // Confirmar al usuario que se unió
        socket.emit("joined_auction", {
          auctionId,
          room,
          connectedCount: connectedUsers.get(auctionId).size,
          auction: {
            id: auction.id,
            current_price: auction.current_price,
            end_time: auction.end_time,
            status: auction.status,
          },
        });

        // Enviar mensajes existentes del chat
        const messages = await ChatService.getMessages(auctionId);
        socket.emit("chat_history", messages);
      } catch (error) {
        logger.error("Error en join_auction:", error);
        socket.emit("error", { message: "Error al unirse a la subasta" });
      }
    });

    // Enviar mensaje en el chat de la subasta
    socket.on("send_message", async (data) => {
      try {
        const { auctionId, message } = data;
        const room = `auction_${auctionId}`;

        if (!socket.auctionId || socket.auctionId != auctionId) {
          socket.emit("error", {
            message: "Debes unirte a la subasta primero",
          });
          return;
        }

        // Usar el servicio para enviar el mensaje (lo guarda en BD)
        const chatMessage = await ChatService.sendMessage(
          socket.userId,
          auctionId,
          message,
          false,
          null
        );

        const messageData = {
          id: chatMessage.id,
          userId: socket.userId,
          username: socket.userName,
          message,
          timestamp: chatMessage.created_at,
          auctionId,
          type: "message",
        };

        console.log(
          `💬 Mensaje en subasta ${auctionId} de ${socket.userName}: ${message}`
        );

        // Enviar mensaje a todos en la sala (incluyendo al remitente)
        io.to(room).emit("new_message", messageData);
      } catch (error) {
        logger.error("Error en send_message:", error);
        socket.emit("error", {
          message: error.message || "Error al enviar mensaje",
        });
      }
    });

    // Realizar una puja
    socket.on("place_bid", async (data) => {
      try {
        const { auctionId, bidAmount } = data;
        const room = `auction_${auctionId}`;

        if (!socket.auctionId || socket.auctionId != auctionId) {
          socket.emit("error", {
            message: "Debes unirte a la subasta primero",
          });
          return;
        }

        // Usar el servicio para procesar la puja (valida y guarda en BD)
        const { bid, auction } = await AuctionService.placeBid(
          socket.userId,
          auctionId,
          bidAmount
        );

        // También guardar como mensaje de chat
        await ChatService.sendMessage(
          socket.userId,
          auctionId,
          `Puja de $${bidAmount}`,
          true,
          bidAmount
        );

        const bidData = {
          id: bid.id,
          auctionId,
          userId: socket.userId,
          username: socket.userName,
          bidAmount,
          timestamp: bid.created_at,
          currentPrice: auction.current_price,
        };

        console.log(
          `💰 Nueva puja en subasta ${auctionId}: $${bidAmount} por ${socket.userName}`
        );

        // Enviar puja a todos en la sala
        io.to(room).emit("new_bid", bidData);

        // También enviar como mensaje del sistema
        io.to(room).emit("new_message", {
          id: Date.now(),
          userId: "system",
          username: "Sistema",
          message: `${socket.userName} hizo una puja de $${bidAmount}`,
          timestamp: new Date().toISOString(),
          auctionId,
          type: "bid",
        });

        // Actualizar precio actual para todos
        io.to(room).emit("price_update", {
          auctionId,
          currentPrice: auction.current_price,
          lastBidder: socket.userName,
        });
      } catch (error) {
        logger.error("Error en place_bid:", error);
        socket.emit("error", {
          message: error.message || "Error al realizar puja",
        });
      }
    });

    // Salir de una sala de subasta
    socket.on("leave_auction", (data) => {
      const { auctionId } = data;
      const room = `auction_${auctionId}`;

      socket.leave(room);

      // Remover usuario del Map
      if (connectedUsers.has(auctionId)) {
        connectedUsers.get(auctionId).delete(socket.userId);
        if (connectedUsers.get(auctionId).size === 0) {
          connectedUsers.delete(auctionId);
        }
      }

      console.log(
        `👋 Usuario ${socket.userName} salió de la subasta ${auctionId}`
      );

      // Notificar a otros usuarios
      socket.to(room).emit("user_left", {
        userId: socket.userId,
        username: socket.userName,
        message: `${socket.userName} salió del chat`,
        timestamp: new Date().toISOString(),
        connectedCount: connectedUsers.has(auctionId)
          ? connectedUsers.get(auctionId).size
          : 0,
      });

      socket.auctionId = null;
    });

    // Manejar desconexión
    socket.on("disconnect", () => {
      console.log(`❌ Cliente desconectado: ${socket.id} - ${socket.userName}`);

      if (socket.auctionId && socket.userId) {
        const auctionId = socket.auctionId;
        const room = `auction_${auctionId}`;

        // Remover usuario del Map
        if (connectedUsers.has(auctionId)) {
          connectedUsers.get(auctionId).delete(socket.userId);
          if (connectedUsers.get(auctionId).size === 0) {
            connectedUsers.delete(auctionId);
          }
        }

        // Notificar a otros usuarios
        socket.to(room).emit("user_left", {
          userId: socket.userId,
          username: socket.userName,
          message: `${socket.userName} se desconectó`,
          timestamp: new Date().toISOString(),
          connectedCount: connectedUsers.has(auctionId)
            ? connectedUsers.get(auctionId).size
            : 0,
        });
      }
    });

    // Obtener lista de usuarios conectados
    socket.on("get_connected_users", (data) => {
      const { auctionId } = data;
      const users = connectedUsers.get(auctionId) || new Set();

      socket.emit("connected_users", {
        auctionId,
        users: Array.from(users),
        count: users.size,
      });
    });
  });

  console.log("✅ Manejadores de Socket.IO configurados correctamente");
};

// Función para obtener estadísticas (opcional, para uso interno)
export const getAuctionStats = () => {
  const stats = [];
  connectedUsers.forEach((users, auctionId) => {
    stats.push({
      auctionId,
      connectedUsers: users.size,
      users: Array.from(users),
    });
  });
  return stats;
};

// Función para emitir eventos desde otros servicios
export const emitToAuction = (io, auctionId, event, data) => {
  io.to(`auction_${auctionId}`).emit(event, data);
};
