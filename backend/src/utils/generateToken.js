import jwt from 'jsonwebtoken';

const generateToken = (userId, email, name) => {
    return jwt.sign({ userId, email, name }, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRES_IN || '1d',
    });
};

export default generateToken;