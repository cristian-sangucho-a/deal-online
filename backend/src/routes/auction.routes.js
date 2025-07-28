import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  placeBid,
  closeAuction,
  getAllActiveAuctions,
  getUserProducts,
  getUserBids,
  getUserStats,
  getAuctionById
} from "../controllers/auction.Controller.js";
import verifyToken from "../middlewares/auth.middleware.js";

const router = Router();

// Rutas que requieren autenticación
router.post("/product", verifyToken, createProduct);
router.put("/products/:id", verifyToken, updateProduct);
router.delete("/products/:id", verifyToken, deleteProduct);
router.post("/bids", verifyToken, placeBid);
router.post("/auctions/:auction_id/close", verifyToken, closeAuction);

// Nuevas rutas para datos del usuario
router.get("/my-products", verifyToken, getUserProducts);
router.get("/my-bids", verifyToken, getUserBids);
router.get("/my-stats", verifyToken, getUserStats);

// Rutas públicas
router.get("/products", getAllProducts);
router.get("/products/:id", getProductById);
router.get("/auctions/active", getAllActiveAuctions);
// Agregar esta línea con las demás rutas públicas
router.get("/auctions/:id", getAuctionById);

export default router;