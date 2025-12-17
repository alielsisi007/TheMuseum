import mongoose from 'mongoose';

const UsersSchema = new mongoose.Schema( {
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    role: { type: String, default: "user" },
    ticket: {
       type: [ {
            name: String,
            day: Date,
        } ] , default:null
    }
} );

export default mongoose.model( "User", UsersSchema );