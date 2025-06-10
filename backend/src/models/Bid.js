import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';
import Auction from './Auction.js';

const Bid = sequelize.define('Bid', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    auction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Auction,
            key: 'id',
        },
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
}, {
    tableName: 'bids',
    timestamps: true,
    underscored: true,
});

Bid.belongsTo(User, { foreignKey: 'user_id', as: 'bidder' });
Bid.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });

export default Bid;