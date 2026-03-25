// ================================================================
// services/bookingService.js — Booking Business Logic
// ================================================================
const bookingRepo = require('../repositories/bookingRepo');
const flightRepo = require('../repositories/flightRepo');
const ticketRepo = require('../repositories/ticketRepo');
const AppError = require('../utils/AppError');
const { generateBookingRef, generateTicketNumber, paginate } = require('../utils/helpers');
const axios = require('axios');

const bookingService = {
    /**
     * Create booking:
     * 1. Validate flight exists and is scheduled
     * 2. Validate seat count matches passenger count
     * 3. Atomically lock seats (pessimistic lock, 30 min TTL)
     * 4. Create booking record
     * 5. Create passenger records
     */
    async createBooking(userId, { flightId, passengers }) {
        // 1. Validate flight
        const flight = await flightRepo.findById(flightId);
        if (!flight) throw new AppError('Flight not found.', 404);
        if (flight.status !== 'Scheduled') {
            throw new AppError(`Cannot book a ${flight.status.toLowerCase()} flight.`, 400);
        }

        const departureTime = new Date(flight.departure_time);
        if (departureTime <= new Date()) {
            throw new AppError('Cannot book a flight that has already departed.', 400);
        }

        // 2. Validate passengers
        if (!passengers || passengers.length === 0) {
            throw new AppError('At least one passenger is required.', 400);
        }
        if (passengers.length > 9) {
            throw new AppError('Maximum 9 passengers per booking.', 400);
        }

        // 3. Validate seats provided
        const seatIds = passengers
            .map(p => p.seatId)
            .filter(id => id !== null && id !== undefined);

        if (seatIds.length > 0 && seatIds.length !== passengers.length) {
            throw new AppError('Seat must be provided for every passenger or none.', 400);
        }

        // 4. Lock seats atomically
        if (seatIds.length > 0) {
            const locked = await flightRepo.lockSeats(flightId, seatIds, userId);
            if (locked !== seatIds.length) {
                throw new AppError(
                    'One or more selected seats are no longer available. Please re-select seats.',
                    409
                );
            }
        }

        // 5. Calculate total amount from flight_seats prices
        let totalAmount = 0;
        if (seatIds.length > 0) {
            const seats = await flightRepo.getSeats(flightId);
            const selectedSeats = seats.filter(s => seatIds.includes(s.flight_seat_id));
            totalAmount = selectedSeats.reduce((sum, s) => sum + parseFloat(s.price), 0);
        } else {
            // Fallback: base price × passenger count
            totalAmount = parseFloat(flight.base_price) * passengers.length;
        }

        // 6. Create booking
        const bookingRef = generateBookingRef();
        const bookingId = await bookingRepo.create({
            bookingRef,
            userId,
            flightId,
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            numPassengers: passengers.length
        });

        // 7. Create passengers
        for (const pax of passengers) {
            await bookingRepo.addPassenger({
                bookingId,
                firstName: pax.firstName,
                lastName: pax.lastName,
                gender: pax.gender,
                dateOfBirth: pax.dateOfBirth,
                nationality: pax.nationality,
                passportNumber: pax.passportNumber,
                flightSeatId: pax.seatId || null
            });
        }

        const booking = await bookingRepo.findById(bookingId);
        const paxList = await bookingRepo.getPassengers(bookingId);

        return { booking, passengers: paxList };
    },

    /**
     * Confirm booking after payment:
     * 1. Mark seats as booked (is_available = FALSE)
     * 2. Update booking status to Confirmed
     * 3. Generate tickets
     */
    async confirmBooking(bookingId) {
        const booking = await bookingRepo.findById(bookingId);
        if (!booking) throw new AppError('Booking not found.', 404);
        if (booking.status === 'Confirmed') return { booking, tickets: [] }; // Idempotent

        // Mark seats booked
        const seatIds = await bookingRepo.getSeatIds(bookingId);
        if (seatIds.length > 0) {
            await flightRepo.bookSeats(booking.flight_id, seatIds);
        }

        // Update booking status
        await bookingRepo.updateStatus(bookingId, 'Confirmed');

        // Generate tickets
        const passengers = await bookingRepo.getPassengers(bookingId);
        const tickets = [];
        for (const pax of passengers) {
            const ticketNumber = generateTicketNumber();
            const qrCodeData = JSON.stringify({
                ticketNumber,
                bookingRef: booking.booking_ref,
                passenger: `${pax.first_name} ${pax.last_name}`,
                flight: booking.flight_number,
                origin: booking.origin_code,
                dest: booking.dest_code,
                departure: booking.departure_time,
                seat: pax.seat_number || 'N/A'
            });

            // Call Java microservice for PDF generation
            let pdfPath = null;
            try {
                const ticketServiceUrl = process.env.TICKET_SERVICE_URL || 'http://localhost:8081';
                const javaResponse = await axios.post(`${ticketServiceUrl}/api/tickets/generate`, {
                    passengerName: `${pax.first_name} ${pax.last_name}`,
                    seatNumber: pax.seat_number || 'N/A'
                });
                pdfPath = javaResponse.data.pdfPath;
            } catch (error) {
                console.error("Java ticket service error:", error.message);
                // Non-blocking: continue even if Java service is down
            }

            const ticketId = await ticketRepo.create({
                bookingId,
                passengerId: pax.id,
                ticketNumber,
                qrCodeData,
                pdfPath
            });
            tickets.push({ ticketId, ticketNumber, passengerId: pax.id });
        }

        return { booking: await bookingRepo.findById(bookingId), tickets };
    },

    async getHistory(userId, query) {
        const { page, limit, offset } = paginate(query);
        const result = await bookingRepo.findByUser(userId, { limit, offset });
        return { ...result, page, limit };
    },

    async getDetails(bookingId, userId, role) {
        const booking = await bookingRepo.findById(bookingId);
        if (!booking) throw new AppError('Booking not found.', 404);

        // Users can only see their own bookings
        if (role !== 'admin' && booking.user_id !== userId) {
            throw new AppError('Access denied.', 403);
        }

        const passengers = await bookingRepo.getPassengers(bookingId);
        return { booking, passengers };
    },

    /**
     * Cancel booking:
     * - Cannot cancel within 2 hours of departure
     * - Releases seat locks
     * - Cancels tickets
     * - Refund trigger is handled by payment service
     */
    async cancelBooking(bookingId, userId, role, reason) {
        const booking = await bookingRepo.findById(bookingId);
        if (!booking) throw new AppError('Booking not found.', 404);

        if (role !== 'admin' && booking.user_id !== userId) {
            throw new AppError('Access denied.', 403);
        }
        if (booking.status === 'Cancelled') {
            throw new AppError('Booking is already cancelled.', 400);
        }
        if (booking.status === 'Completed') {
            throw new AppError('Cannot cancel a completed booking.', 400);
        }

        // 2-hour departure buffer
        const departure = new Date(booking.departure_time);
        const now = new Date();
        const hoursUntilDeparture = (departure - now) / (1000 * 60 * 60);
        if (hoursUntilDeparture < 2 && role !== 'admin') {
            throw new AppError(
                'Cancellation not allowed within 2 hours of departure.',
                400
            );
        }

        // Release seat locks / availability
        const seatIds = await bookingRepo.getSeatIds(bookingId);
        if (seatIds.length > 0) {
            await flightRepo.releaseSeats(booking.flight_id, seatIds);
        }

        // Cancel tickets
        const { ticketRepo: tRepo } = require('../repositories/ticketRepo');
        await (require('../repositories/ticketRepo')).cancelByBookingId(bookingId);

        // Update booking status
        await bookingRepo.updateStatus(bookingId, 'Cancelled', { reason });

        return bookingRepo.findById(bookingId);
    }
};

module.exports = bookingService;
