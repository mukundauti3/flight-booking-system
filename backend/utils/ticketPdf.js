// ================================================================
// utils/ticketPdf.js — PDF Ticket Generator (pdfkit + qrcode)
// ================================================================
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Generates a print-ready PDF e-ticket for a single passenger.
 * Returns the absolute path to the saved PDF file.
 *
 * @param {Object} opts
 * @param {string} opts.ticketNumber
 * @param {string} opts.bookingRef
 * @param {string} opts.passengerName
 * @param {string} opts.gender
 * @param {string} opts.passportNumber
 * @param {string} opts.flightNumber
 * @param {string} opts.airline
 * @param {string} opts.originCode
 * @param {string} opts.originCity
 * @param {string} opts.destCode
 * @param {string} opts.destCity
 * @param {string} opts.departureTime   ISO string
 * @param {string} opts.arrivalTime     ISO string
 * @param {number} opts.durationMinutes
 * @param {string} opts.seatNumber
 * @param {string} opts.seatClass
 * @param {number} opts.amount
 * @param {string} opts.currency
 * @returns {Promise<string>} Absolute path to generated PDF
 */
async function generateTicketPdf(opts) {
    // ---- QR Code (base64 PNG) ----
    const qrPayload = JSON.stringify({
        tn: opts.ticketNumber,
        ref: opts.bookingRef,
        fn: opts.flightNumber,
        pax: opts.passengerName,
        dep: opts.departureTime,
        s: opts.seatNumber || 'N/A'
    });
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 120, margin: 1,
        color: { dark: '#00b4d8', light: '#0a0e1a' }
    });
    // Buffer from data URL
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    // ---- Output path ----
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'tickets');
    fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `ticket_${opts.ticketNumber.replace(/\//g, '-')}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: [595, 240],   // Custom: A4-width × boarding-pass height (pts)
            margin: 0,
            info: {
                Title: `SkyBooker E-Ticket — ${opts.ticketNumber}`,
                Author: 'SkyBooker',
                Subject: `Flight ${opts.flightNumber}`,
                Keywords: opts.bookingRef
            }
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // ---- Background ----
        doc.rect(0, 0, 595, 240).fill('#0a0e1a');

        // ---- Accent bar (left) ----
        doc.rect(0, 0, 4, 240).fill('#00b4d8');

        // ---- Top gradient band ----
        doc.rect(0, 0, 595, 3).fill('#00b4d8');

        // ---- AIRLINE / BRAND ----
        doc.fontSize(18).font('Helvetica-Bold')
            .fillColor('#00b4d8').text('SkyBooker', 20, 20);

        doc.fontSize(9).font('Helvetica')
            .fillColor('#64748b').text('Electronic Boarding Pass', 20, 42);

        // ---- Ticket Number ----
        doc.fontSize(8).fillColor('#94a3b8').text('TICKET NO.', 420, 20);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#f0f4ff')
            .text(opts.ticketNumber, 420, 32);

        // ---- Divider line ----
        doc.moveTo(20, 58).lineTo(575, 58).strokeColor('#1e2942').lineWidth(1).stroke();

        // ---- ROUTE ----
        // Origin
        doc.fontSize(32).font('Helvetica-Bold').fillColor('#f0f4ff').text(opts.originCode, 20, 70);
        doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(opts.originCity, 20, 108);

        const dep = new Date(opts.departureTime);
        const arr = new Date(opts.arrivalTime);
        const fmtT = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
        const fmtD = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        doc.fontSize(18).font('Helvetica-Bold').fillColor('#00b4d8').text(fmtT(dep), 20, 120);
        doc.fontSize(9).fillColor('#64748b').text(fmtD(dep), 20, 143);

        // Duration / Arrow in center
        const dur = `${Math.floor(opts.durationMinutes / 60)}h ${opts.durationMinutes % 60}m`;
        doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(dur, 225, 88, { width: 80, align: 'center' });
        doc.fontSize(22).fillColor('#00b4d8').text('✈', 238, 98);
        doc.moveTo(165, 102).lineTo(240, 102).strokeColor('#1e4a6e').lineWidth(1).stroke();
        doc.moveTo(310, 102).lineTo(385, 102).strokeColor('#1e4a6e').lineWidth(1).stroke();

        // Destination
        doc.fontSize(32).font('Helvetica-Bold').fillColor('#f0f4ff').text(opts.destCode, 385, 70);
        doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(opts.destCity, 385, 108);
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#00b4d8').text(fmtT(arr), 385, 120);
        doc.fontSize(9).fillColor('#64748b').text(fmtD(arr), 385, 143);

        // ---- Dashed divider ----
        doc.moveTo(20, 160).lineTo(475, 160).dash(4, { space: 4 }).strokeColor('#1e2942').lineWidth(1).stroke();
        doc.undash();

        // ---- Passenger Details Row ----
        const fields = [
            ['PASSENGER', opts.passengerName],
            ['SEAT', opts.seatNumber || 'N/A'],
            ['CLASS', opts.seatClass || 'Economy'],
            ['BOOKING', opts.bookingRef],
            ['FLIGHT', opts.flightNumber],
            ['AMOUNT', `${opts.currency} ${parseFloat(opts.amount).toLocaleString('en-IN')}`]
        ];

        let colX = 20;
        fields.forEach(([label, value]) => {
            doc.fontSize(7).font('Helvetica').fillColor('#475569').text(label, colX, 170);
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#f0f4ff').text(value, colX, 182);
            colX += 80;
        });

        // ---- QR Code ----
        doc.image(qrBuffer, 490, 65, { width: 85, height: 85 });
        doc.fontSize(7).font('Helvetica').fillColor('#475569').text('Scan at gate', 490, 155, { width: 85, align: 'center' });

        // ---- Footer ----
        doc.rect(0, 220, 595, 20).fill('#060a14');
        doc.fontSize(7).font('Helvetica').fillColor('#334155')
            .text('SkyBooker · support@skybooker.com · This is a valid digital boarding pass. Present at check-in.',
                20, 226, { width: 555, align: 'center' });

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

module.exports = generateTicketPdf;
