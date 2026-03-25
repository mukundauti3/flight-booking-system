package com.example.tickets.service;

import com.example.tickets.dto.TicketRequest;
import com.example.tickets.dto.TicketResponse;
import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class TicketService {

    public TicketResponse generateTicket(TicketRequest request) {
        String ticketId = UUID.randomUUID().toString();
        String tempDir = System.getProperty("java.io.tmpdir");
        String fileName = "ticket-" + ticketId + ".pdf";
        String filePath = Paths.get(tempDir, fileName).toAbsolutePath().toString();

        try {
            Document document = new Document();
            PdfWriter.getInstance(document, new FileOutputStream(filePath));
            document.open();
            document.add(new Paragraph("Flight E-Ticket"));
            document.add(new Paragraph("Ticket ID: " + ticketId));
            document.add(new Paragraph("Passenger Name: " + request.getPassengerName()));
            document.add(new Paragraph("Seat Number: " + request.getSeatNumber()));
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }

        return new TicketResponse(ticketId, filePath);
    }
}
