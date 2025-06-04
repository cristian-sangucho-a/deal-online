import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

const Session = sequelize.define('Session', {
    session_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    issued_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'sessions',
    timestamps: false,
    underscored: true,
});

// Relación 1:N entre User y Session
User.hasMany(Session, { foreignKey: 'user_id' });
Session.belongsTo(User, { foreignKey: 'user_id' });

export default Session; 