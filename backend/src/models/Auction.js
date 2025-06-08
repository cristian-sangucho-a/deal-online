import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Product from './Product.js';
import Bid from './Bid.js';

const Auction = sequelize.define('Auction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Product,
            key: 'id',
        },
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: [['active', 'closed', 'cancelled']],
        },
    },
    current_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    winning_bid_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Bid,
            key: 'id',
        },
    },
}, {
    tableName: 'auctions',
    timestamps: true,
    underscored: true,
});

Auction.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Auction.belongsTo(Bid, { foreignKey: 'winning_bid_id', as: 'winning_bid' });

export default Auction;