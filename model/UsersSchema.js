import mongoose from 'mongoose';

const UsersSchema = new mongoose.Schema( {
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    role: { type: String, default: "user" },
        // store a list of the user's bookings for quick access in profile
        tickets: {
            type: [
                {
                    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
                    ticketType: { type: String },
                    quantity: { type: Number, default: 1 },
                    visitDate: { type: Date },
                    totalPrice: { type: Number, default: 0 },
                    status: { type: String, default: 'confirmed' },
                    createdAt: { type: Date, default: Date.now },
                },
            ],
            default: [],
        },
} );

export default mongoose.model( "User", UsersSchema );