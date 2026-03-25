package com.example.tickets.dto;

public class TicketResponse {
    private String ticketId;
    private String pdfPath;

    public TicketResponse(String ticketId, String pdfPath) {
        this.ticketId = ticketId;
        this.pdfPath = pdfPath;
    }

    public String getTicketId() { return ticketId; }
    public String getPdfPath() { return pdfPath; }
}
