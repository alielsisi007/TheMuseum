import Ticket from '../model/TicketSchema.js';
import UsersSchema from '../model/UsersSchema.js';

// create booking (user must be authenticated via verifyUser middleware in index.js)
export const createBooking = async (req, res) => {
  try {
    // expect: { ticketType, quantity, visitDate, totalPrice } (frontend may vary)
    const { ticketType, quantity, visitDate, totalPrice } = req.body;
    if (!req.user) return res.status(401).json({ message: 'No user' });

    const booking = await Ticket.create({
      user: req.user._id,
      eventName: ticketType || 'Ticket',
      eventDate: visitDate ? new Date(visitDate) : new Date(),
      ticketPrice: totalPrice || 0,
      ticketCount: quantity || 1,
    });

    // Also add a lightweight entry into the user's document for quick lookup in profile
    try {
      await UsersSchema.findByIdAndUpdate(req.user._id, {
        $push: {
          ticket: { name: ticketType || 'Ticket', day: visitDate ? new Date(visitDate) : new Date() }
        }
      });
    } catch (uErr) {
      console.error('Failed to update user.ticket array:', uErr);
      // don't fail the booking if user update fails; still return booking
    }

    return res.status(201).json({ message: 'Booking created', booking });
  } catch (err) {
    console.error('Create Booking Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// get bookings for current user
export const getUserBookings = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No user' });
    const raw = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });
    // normalize shape for frontend: { _id, ticketType: { name, price }, quantity, visitDate, totalPrice, status, createdAt }
    const bookings = raw.map(b => ({
      _id: b._id,
      ticketType: { name: b.eventName, price: b.ticketPrice },
      quantity: b.ticketCount,
      visitDate: b.eventDate,
      totalPrice: b.ticketPrice,
      status: 'confirmed',
      createdAt: b.createdAt,
    }));
    return res.json({ bookings });
  } catch (err) {
    console.error('Get User Bookings Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// update a booking (only owner or admin)
export const updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Ticket.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // allow if owner or admin
    if (!req.user) return res.status(401).json({ message: 'No user' });
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not allowed' });

    const { quantity, visitDate, totalPrice, ticketType } = req.body;
    if (quantity !== undefined) booking.ticketCount = quantity;
    if (visitDate) booking.eventDate = new Date(visitDate);
    if (totalPrice !== undefined) booking.ticketPrice = totalPrice;
    if (ticketType) booking.eventName = ticketType;

    await booking.save();
    return res.json({ message: 'Booking updated', booking });
  } catch (err) {
    console.error('Update Booking Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// delete/cancel booking (only owner or admin)
export const deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Ticket.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (!req.user) return res.status(401).json({ message: 'No user' });
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not allowed' });

    await booking.deleteOne();
    return res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error('Delete Booking Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin: get all bookings with optional pagination
export const getAllBookings = async (req, res) => {
  try {
    // expect verifyAdmin middleware to have run before this handler
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Ticket.countDocuments();
    const raw = await Ticket.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('user', 'userName email');
    const bookings = raw.map(b => ({
      _id: b._id,
      user: b.user,
      ticketType: { name: b.eventName, price: b.ticketPrice },
      quantity: b.ticketCount,
      visitDate: b.eventDate,
      totalPrice: b.ticketPrice,
      status: 'confirmed',
      createdAt: b.createdAt,
    }));
    return res.json({ bookings, total, page: Number(page) });
  } catch (err) {
    console.error('Get All Bookings Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

  // Provide ticket types (simple static list for now)
  export const getTicketTypes = async (req, res) => {
    try {
      const types = [
        { _id: '1', name: 'Adult', price: 25, description: 'Ages 18+' },
        { _id: '2', name: 'Child', price: 12, description: 'Ages 3-17' },
        { _id: '3', name: 'Senior', price: 18, description: 'Ages 65+' },
        { _id: '4', name: 'Student', price: 15, description: 'With valid ID' },
      ];
      return res.json(types);
    } catch (err) {
      console.error('Get Ticket Types Error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  };
