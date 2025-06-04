import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const verifyToken = async (req, res, next) => {
    const authHeader =
        req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Formato de autorización inválido. Use: Bearer <token>",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token Payload:", decoded);

        const userId = decoded.userId || decoded.id;
        if (!userId) {
            return res.status(403).json({
                success: false,
                message:
                    'Token no contiene ID de usuario (se esperaba "userId" o "id")',
            });
        }

        const session = await Session.findOne({
            where: { token, user_id: userId },
            include: [{ model: User }],
        });

        if (!session || session.expires_at < new Date()) {
            if (session) await session.destroy();
            return res.status(401).json({
                success: false,
                message: "Sesión inválida o expirada",
            });
        }

        const timeLeft = session.expires_at - new Date();
        if (timeLeft < 5 * 60 * 1000) {
            const newToken = generateToken(
                session.User.id,
                session.User.email,
                session.User.nombre,
                session.User.role
            );
            const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            session.token = newToken;
            session.issued_at = new Date();
            session.expires_at = newExpiresAt;
            await session.save();

            res.setHeader("X-New-Token", newToken);
        }

        req.user = {
            user_id: userId,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
        };
        console.log("Assigned req.user:", req.user);
        next();
    } catch (error) {
        console.error("Error en autenticación:", error);
        return res.status(403).json({
            success: false,
            message: "Token inválido o expirado",
            error: error.message,
        });
    }
};

export default verifyToken;
