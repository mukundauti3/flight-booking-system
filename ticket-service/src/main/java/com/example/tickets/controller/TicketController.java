package com.example.tickets.controller;

import com.example.tickets.dto.TicketRequest;
import com.example.tickets.dto.TicketResponse;
import com.example.tickets.service.TicketService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/generate")
    public TicketResponse generateTicket(@RequestBody TicketRequest request) {
        return ticketService.generateTicket(request);
    }
}
