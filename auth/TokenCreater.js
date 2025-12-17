import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';
import dotenv from "dotenv";
import UsersSchema from '../model/UsersSchema.js';
import bcrypt from 'bcrypt';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";


export const createToken = ( user ) => {
    const token = jwt.sign( { id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } );
    return token;
}
export const verifyToken = ( token ) => {
    try {
        const decoded = jwt.verify( token, JWT_SECRET );
        return decoded;
    } catch ( err ) {
        console.error("Token verification failed:", err);
        return null;
    }
}

