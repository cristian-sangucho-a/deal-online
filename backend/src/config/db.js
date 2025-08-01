import { Sequelize } from 'sequelize';
import dotenv from "dotenv";

//Cargar las variables de entorno
dotenv.config();

const sequelize = new Sequelize (
    process.env.DATABASE_URL,
    {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        logging: false,
    });

export default sequelize;