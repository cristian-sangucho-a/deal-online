import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Auction = sequelize.define('Auction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    },
}, {
    tableName: 'auctions',
    timestamps: true,
    underscored: true,
});

export default Auction;