import UsersSchema from '../model/UsersSchema.js';
import Ticket from '../model/TicketSchema.js';
import PostsSchema from '../model/PostsSchema.js';
import mongoose from 'mongoose';

// Get basic stats: total users, bookings, revenue, exhibits
export const getStats = async (req, res) => {
  try {
    const totalUsers = await UsersSchema.countDocuments();
    const totalBookings = await Ticket.countDocuments();
    // sum revenue: ticketPrice * ticketCount
    const revenueAgg = await Ticket.aggregate([
      { $group: { _id: null, revenue: { $sum: { $multiply: [ '$ticketPrice', '$ticketCount' ] } } } }
    ]);
    const totalRevenue = (revenueAgg[0] && revenueAgg[0].revenue) || 0;
    const totalExhibits = await PostsSchema.countDocuments();

    return res.json({ totalUsers, totalBookings, totalRevenue, totalExhibits });
  } catch (err) {
    console.error('Get Stats Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Simple analytics: monthly revenue (last 6 months), weekly visitors (tickets per day), ticket type distribution
export const getAnalytics = async (req, res) => {
  try {
    // monthly revenue for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const revenueByMonth = await Ticket.aggregate([
      { $match: { createdAt: { $gte: new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1) } } },
      { $project: { month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $multiply: [ '$ticketPrice', '$ticketCount' ] } } },
      { $group: { _id: '$month', revenue: { $sum: '$revenue' } } },
      { $sort: { _id: 1 } },
    ]);

    const revenue = revenueByMonth.map(r => ({ month: r._id, revenue: r.revenue }));

    // visitors last 7 days (count bookings per day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const visitorsAgg = await Ticket.aggregate([
      { $match: { createdAt: { $gte: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate()) } } },
      { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
      { $group: { _id: '$day', visitors: { $sum: '$ticketCount' } } },
      { $sort: { _id: 1 } },
    ]);
    const visitors = visitorsAgg.map(v => ({ day: v._id, visitors: v.visitors }));

    // ticket type distribution (top ticket names)
    const ticketsSoldAgg = await Ticket.aggregate([
      { $group: { _id: '$eventName', value: { $sum: '$ticketCount' } } },
      { $sort: { value: -1 } },
    ]);
    const ticketsSold = ticketsSoldAgg.map(t => ({ name: t._id || 'Ticket', value: t.value }));

    // quick stats (strings for UI)
    const totalRevenueAgg = revenue.reduce((sum, r) => sum + (r.revenue || 0), 0);
    const totalVisitors = visitors.reduce((sum, v) => sum + (v.visitors || 0), 0);
    const totalTicketsSold = ticketsSold.reduce((sum, t) => sum + (t.value || 0), 0);

    const stats = [
      { revenue: `$${totalRevenueAgg.toLocaleString()}`, visitors: `${totalVisitors.toLocaleString()}`, ticketsSold: `${totalTicketsSold.toLocaleString()}`, growth: 'N/A' }
    ];

    return res.json({ revenue, visitors, ticketsSold, stats });
  } catch (err) {
    console.error('Get Analytics Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export default { getStats, getAnalytics };
