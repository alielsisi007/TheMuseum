import TicketSchema from "../model/TicketSchema.js";
import UsersSchema from "../model/UsersSchema.js";
import { verifyToken } from "../auth/TokenCreater.js";

export const createBooking = async (req, res) => {
  try {
    const { eventName, eventDate, ticketPrice, ticketCount } = req.body;

    if (!eventName || !eventDate || !ticketPrice) {
      return res.status(400).json({ message: "Event name, date, and ticket price are required" });
    }

    const booking = await TicketSchema.create({
      user: req.user._id,
      eventName,
      eventDate,
      ticketPrice,
      ticketCount: ticketCount || 1
    });

    res.status(201).json({ message: "Booking created", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// الحصول على الحجوزات الخاصة بالمستخدم
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await TicketSchema.find({ user: req.user._id }).sort({ eventDate: 1 });
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// تعديل حجز
export const updateBooking = async (req, res) => {
  try {
    if (!req.body) return res.status(400).json({ message: "Request body is required" });

    const booking = await TicketSchema.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only your bookings can be updated" });
    }

    const { eventName, eventDate, ticketPrice, ticketCount } = req.body;

    if (eventName) booking.eventName = eventName;
    if (eventDate) booking.eventDate = eventDate;
    if (ticketPrice) booking.ticketPrice = ticketPrice;
    if (ticketCount) booking.ticketCount = ticketCount;

    await booking.save();
    res.json({ message: "Booking updated", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// حذف حجز
export const deleteBooking = async (req, res) => {
  try {
    const booking = await TicketSchema.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "You can only delete your own bookings" });
    }

    await booking.deleteOne();
    res.json({ message: "Booking deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// جلب كل الحجوزات للأدمن مع معلومات المستخدم
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await TicketSchema.find().populate("user", "name email").sort({ eventDate: 1 });
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};