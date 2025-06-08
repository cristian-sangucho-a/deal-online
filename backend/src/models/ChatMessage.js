import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';
import Auction from './Auction.js';

const ChatMessage = sequelize.define('ChatMessage', {
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
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    is_bid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    bid_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
}, {
    tableName: 'chat_messages',
    timestamps: true,
    underscored: true,
});

ChatMessage.belongsTo(User, { foreignKey: 'user_id', as: 'sender' });
ChatMessage.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });

export default ChatMessage;