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
} from "../controllers/auction.Controller.js";
import verifyToken from "../middlewares/auth.middleware.js"; // Asegúrate de que la ruta sea correcta

const router = Router();

// Rutas que requieren autenticación
router.post("/products", verifyToken, createProduct);
router.put("/products/:id", verifyToken, updateProduct);
router.delete("/products/:id", verifyToken, deleteProduct);
router.post("/bids", verifyToken, placeBid);
router.post("/c/:auction_id/close", verifyToken, closeAuction);
// Rutas públicas
router.get("/products", getAllProducts);
router.get("/products/:id", getProductById);
router.get("/auctions/active", getAllActiveAuctions);

export default router;
