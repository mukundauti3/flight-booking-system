// ================================================================
// services/ticketService.js — Ticket Retrieval + PDF Generation
// ================================================================
const ticketRepo = require('../repositories/ticketRepo');
const bookingRepo = require('../repositories/bookingRepo');
const generatePdf = require('../utils/ticketPdf');
const emailService = require('../utils/emailService');
const AppError = require('../utils/AppError');
const userRepo = require('../repositories/userRepo');

const ticketService = {
    /**
     * Get formatted tickets for a booking.
     * Validates ownership and booking status.
     */
    async getTicketsForBooking(bookingId, userId, role) {
        const booking = await bookingRepo.findById(bookingId);
        if (!booking) throw new AppError('Booking not found.', 404);
        if (role !== 'admin' && booking.user_id !== userId) throw new AppError('Access denied.', 403);
        if (!['Confirmed', 'Completed'].includes(booking.status)) {
            throw new AppError('Tickets are only available for confirmed bookings.', 400);
        }

        const rawTickets = await ticketRepo.findByBookingId(bookingId);
        if (rawTickets.length === 0) throw new AppError('No tickets found for this booking.', 404);

        const tickets = rawTickets.map(t => ({
            ticketNumber: t.ticket_number,
            status: t.status,
            issuedAt: t.issued_at,
            pdfPath: t.pdf_path,
            qrData: t.qr_code_data,
            passenger: {
                firstName: t.first_name,
                lastName: t.last_name,
                gender: t.gender,
                passportNumber: t.passport_number
            },
            seat: {
                number: t.seat_number || 'Not Assigned',
                class: t.seat_class || 'Economy',
                price: t.seat_price
            },
            flight: {
                flightNumber: booking.flight_number,
                airline: booking.airline_name,
                origin: booking.origin_code,
                destination: booking.dest_code,
                departure: booking.departure_time,
                arrival: booking.arrival_time,
                duration: booking.duration_minutes
            }
        }));

        return {
            booking: {
                bookingRef: booking.booking_ref,
                status: booking.status,
                totalAmount: booking.total_amount,
                confirmedAt: booking.confirmed_at
            },
            tickets
        };
    },

    /**
     * Generate PDF for a specific ticket.
     * - Generates PDF using pdfkit
     * - Saves path to DB
     * Returns the absolute file path.
     */
    async generateTicketPdf(ticketId, ticketData) {
        const {
            ticketNumber, bookingRef, passengerName, gender,
            passportNumber, flightNumber, airline,
            originCode, originCity, destCode, destCity,
            departureTime, arrivalTime, durationMinutes,
            seatNumber, seatClass, amount, currency
        } = ticketData;

        const pdfPath = await generatePdf({
            ticketNumber, bookingRef, passengerName, gender, passportNumber,
            flightNumber, airline, originCode, originCity, destCode, destCity,
            departureTime, arrivalTime, durationMinutes,
            seatNumber, seatClass, amount, currency
        });

        // Save PDF path to database
        await ticketRepo.updatePdfPath(ticketId, pdfPath);
        return pdfPath;
    },

    /**
     * After booking confirmation:
     * - Generate PDFs for all passengers
     * - Send confirmation email with attached PDFs
     * (called from bookingService.confirmBooking)
     */
    async sendConfirmationWithTickets({ bookingId, tickets, booking, userId }) {
        try {
            const user = await userRepo.findById(userId);
            const rawTickets = await ticketRepo.findByBookingId(bookingId);

            const pdfPaths = [];

            for (const t of rawTickets) {
                const pdfPath = await generatePdf({
                    ticketNumber: t.ticket_number,
                    bookingRef: booking.booking_ref,
                    passengerName: `${t.first_name} ${t.last_name}`,
                    gender: t.gender,
                    passportNumber: t.passport_number,
                    flightNumber: booking.flight_number,
                    airline: booking.airline_name,
                    originCode: booking.origin_code,
                    originCity: booking.origin_city,
                    destCode: booking.dest_code,
                    destCity: booking.dest_city,
                    departureTime: booking.departure_time,
                    arrivalTime: booking.arrival_time,
                    durationMinutes: booking.duration_minutes,
                    seatNumber: t.seat_number,
                    seatClass: t.seat_class || 'Economy',
                    amount: booking.total_amount,
                    currency: 'INR'
                });
                await ticketRepo.updatePdfPath(t.id, pdfPath);
                pdfPaths.push(pdfPath);
            }

            // Send confirmation email (non-fatal — never block booking confirmation)
            if (user?.email) {
                emailService.sendBookingConfirmation({
                    to: user.email,
                    toName: `${user.first_name} ${user.last_name}`,
                    bookingRef: booking.booking_ref,
                    flightNumber: booking.flight_number,
                    originCity: booking.origin_city,
                    destCity: booking.dest_city,
                    departureTime: booking.departure_time,
                    arrivalTime: booking.arrival_time,
                    totalAmount: booking.total_amount,
                    pdfPaths
                }).catch(err => console.error('[Email] Confirmation send failed:', err.message));
            }

            return pdfPaths;
        } catch (err) {
            // Non-fatal: log but don't fail the booking flow
            console.error('[Ticket] PDF/Email generation failed:', err.message);
            return [];
        }
    }
};

module.exports = ticketService;
