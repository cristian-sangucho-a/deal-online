import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Bid = sequelize.define('Bid', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    auction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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

export default Bid;