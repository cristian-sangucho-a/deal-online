import AuctionService from "../services/auctionService.js";
import { handleHttpError } from "../utils/errorHandler.js";

export const createProduct = async (req, res) => {
  try {
    const { name, description, starting_price, image_url, end_time } = req.body;
    if (!name || !starting_price || !end_time) {
      return handleHttpError(
        res,
        "BAD_REQUEST",
        new Error("Nombre, precio inicial y fecha de finalización requeridos"),
        400
      );
    }

    const { product, auction } = await AuctionService.createProduct(
      req.user.user_id,
      {
        name,
        description,
        starting_price,
        image_url,
        end_time,
      }
    );

    res.status(201).json({
      message: "Producto y subasta creados exitosamente",
      product,
      auction,
    });
  } catch (error) {
    handleHttpError(res, "CREATE_PRODUCT_ERROR", error, error.status || 500);
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await AuctionService.getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    handleHttpError(res, "GET_PRODUCTS_ERROR", error, error.status || 500);
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await AuctionService.getProductById(id);
    res.status(200).json(product);
  } catch (error) {
    handleHttpError(res, "GET_PRODUCT_ERROR", error, error.status || 500);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url } = req.body;
    const product = await AuctionService.updateProduct(req.user.user_id, id, {
      name,
      description,
      image_url,
    });
    res
      .status(200)
      .json({ message: "Producto actualizado exitosamente", product });
  } catch (error) {
    handleHttpError(res, "UPDATE_PRODUCT_ERROR", error, error.status || 500);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AuctionService.deleteProduct(req.user.user_id, id);
    res.status(200).json(result);
  } catch (error) {
    handleHttpError(res, "DELETE_PRODUCT_ERROR", error, error.status || 500);
  }
};

export const placeBid = async (req, res) => {
  try {
    const { auction_id, amount, message } = req.body;
    if (!auction_id || !amount) {
      return handleHttpError(
        res,
        "BAD_REQUEST",
        new Error("ID de subasta y monto requeridos"),
        400
      );
    }

    const { bid, auction } = await AuctionService.placeBid(
      req.user.user_id,
      auction_id,
      amount,
      message
    );
    res
      .status(201)
      .json({ message: "Oferta realizada exitosamente", bid, auction });
  } catch (error) {
    handleHttpError(res, "PLACE_BID_ERROR", error, error.status || 500);
  }
};

export const closeAuction = async (req, res) => {
  try {
    const { auction_id } = req.params;
    const { auction, winningBid } = await AuctionService.closeAuction(
      auction_id
    );
    res
      .status(200)
      .json({ message: "Subasta cerrada exitosamente", auction, winningBid });
  } catch (error) {
    handleHttpError(res, "CLOSE_AUCTION_ERROR", error, error.status || 500);
  }
};

export const getAllActiveAuctions = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const auctions = await AuctionService.getAllActiveAuctions(
      parseInt(page),
      parseInt(limit)
    );

    // Formatear la respuesta como espera el frontend
    const response = {
      auctions: auctions,
      total: auctions.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(auctions.length / parseInt(limit)),
    };

    res.status(200).json(response);
  } catch (error) {
    handleHttpError(
      res,
      "GET_ACTIVE_AUCTIONS_ERROR",
      error,
      error.status || 500
    );
  }
};

export const getUserProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const products = await Product.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Auction,
          as: "auction",
          attributes: [
            "id",
            "status",
            "current_price",
            "end_time",
            "winning_bid_id",
            "start_time"
          ],
          include: [
            {
              model: Bid,
              as: "bids",
              attributes: ["id", "amount", "createdAt"],
              include: [
                { model: User, as: "bidder", attributes: ["id", "nombre"] }
              ]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(products);
  } catch (error) {
    console.error("Error getting user products:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getUserBids = async (req, res) => {
  try {
    const userId = req.user.id;
    const bids = await Bid.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Auction,
          as: "auction",
          attributes: ["id", "status", "current_price", "end_time", "winning_bid_id"],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url", "description"]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(bids);
  } catch (error) {
    console.error("Error getting user bids:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener productos del usuario
    const userProducts = await Product.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Auction,
          as: "auction",
          attributes: ["id", "status", "current_price", "end_time", "winning_bid_id"]
        }
      ]
    });

    // Obtener ofertas del usuario
    const userBids = await Bid.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Auction,
          as: "auction",
          attributes: ["id", "status", "winning_bid_id"],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name"]
            }
          ]
        }
      ]
    });

    // Calcular estadísticas
    const stats = {
      totalProducts: userProducts.length,
      activeAuctions: userProducts.filter(p => p.auction?.status === 'active').length,
      totalBids: userBids.length,
      wonAuctions: userBids.filter(bid => 
        bid.auction?.status === 'closed' && 
        bid.auction?.winning_bid_id === bid.id
      ).length,
      recentActivity: []
    };

    // Agregar actividad reciente
    const recentProducts = userProducts.slice(0, 3).map(product => ({
      type: 'product',
      date: product.createdAt,
      content: `Publicaste "${product.name}"`,
      link: `/products/${product.id}`
    }));

    const recentBids = userBids.slice(0, 3).map(bid => ({
      type: 'bid',
      date: bid.createdAt,
      content: `Ofertaste $${bid.amount.toLocaleString()} en "${bid.auction?.product?.name || 'Producto'}"`,
      link: `/products/${bid.auction?.product?.id}`
    }));

    stats.recentActivity = [...recentProducts, ...recentBids]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.json(stats);
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
