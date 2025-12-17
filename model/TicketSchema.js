import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    eventName: { type: String, required: true },
    eventDate: { type: Date, required: true },
    ticketPrice: { type: Number, required: true },
    ticketCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", TicketSchema);
