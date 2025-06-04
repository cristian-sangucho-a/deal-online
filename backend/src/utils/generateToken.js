import jwt from 'jsonwebtoken';

const generateToken = (userId, email, name, role) => {
    return jwt.sign({ userId, email, name, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRES_IN || '1d',
    });
};

export default generateToken;
