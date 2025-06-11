import User from "./User.js";
import Product from "./Product.js";
import Auction from "./Auction.js";
import Bid from "./Bid.js";
import ChatMessage from "./ChatMessage.js";

const setupAssociations = () => {
  // Relaciones de Usuario
  User.hasMany(Product, { foreignKey: "user_id", as: "products" });
  User.hasMany(Bid, { foreignKey: "user_id", as: "bids" });
  User.hasMany(ChatMessage, { foreignKey: "user_id", as: "messages" });

  // Relaciones de Producto
  Product.belongsTo(User, { foreignKey: "user_id", as: "seller" });
  Product.hasOne(Auction, { foreignKey: "product_id", as: "auction" });

  // Relaciones de Subasta
  Auction.belongsTo(Product, { foreignKey: "product_id", as: "product" });
  Auction.hasMany(Bid, { foreignKey: "auction_id", as: "bids" });
  Auction.belongsTo(Bid, { foreignKey: "winning_bid_id", as: "winning_bid" });

  // Relaciones de Oferta
  Bid.belongsTo(User, { foreignKey: "user_id", as: "bidder" });
  Bid.belongsTo(Auction, { foreignKey: "auction_id", as: "auction" });

  // Relaciones de Chat
  ChatMessage.belongsTo(User, { foreignKey: "user_id", as: "sender" });
  ChatMessage.belongsTo(Auction, { foreignKey: "auction_id", as: "auction" });
};

export default setupAssociations;
