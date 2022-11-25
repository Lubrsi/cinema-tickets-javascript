import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // throws InvalidPurchaseException
    
    // Assumption: All accounts with an id greater than zero are valid.

    // Cannot use only "<=" as that would coerce accountId to a number where Number.isInteger doesn't, making values such as `true` and `{ valueOf() { return 1; }}` be considered valid.
    // In the object case, it can also run arbitrary code.
    if (!Number.isInteger(accountId))
      throw new InvalidPurchaseException("Account ID is not an integer");

    if (accountId <= 0)
      throw new InvalidPurchaseException("Account ID must be greater than zero");

    // Business rules:
    // - Multiple tickets can be purchased at any given time.
    // - Only a maximum of 20 tickets that can be purchased at a time.

    if (ticketTypeRequests.length === 0)
      throw new InvalidPurchaseException("Must make at least one ticket type request");

    // This assumes that each TicketTypeRequest has `noOfTickets` set to at least 1, which will be validated later on. This saves iterating over the requests in this case.
    if (ticketTypeRequests.length > 20)
      throw new InvalidPurchaseException("Only a maximum of 20 tickets can be purchased at a time");

    // Business rule:
    // - There are 3 types of tickets i.e. Infant, Child, and Adult.
    // This is used to reconstuct the total number of tickets per ticket type.
    // For example, ticketTypeRequests could contain a single TicketTypeRequest with `type` "ADULT" and `noOfTickets` set to 5,
    // or 5 TicketTypeRequest objects with `type` "ADULT" and `noOfTickets` set to 1.
    const ticketTypeTotals = {
      // This relies on TicketTypeRequest already validating the type, as it can't be constructed with an invalid type.
      INFANT: 0,
      CHILD: 0,
      ADULT: 0,
    };

    // Business rule:
    // - The ticket purchaser declares how many and what type of tickets they want to buy.
    for (const request of ticketTypeRequests) {
      if (!(request instanceof TicketTypeRequest))
        throw new InvalidPurchaseException("The ticket requests contain a non-request value");

      const numberOfTickets = request.getNoOfTickets();

      // TicketTypeRequest has already validated that numberOfTickets is an integer, as it can't be constructed otherwise, so we only have to check its range here.
      if (numberOfTickets <= 0)
        throw new InvalidPurchaseException("A ticket request is requesting zero or less tickets");

      // This relies on TicketTypeRequest already validating the type, as it can't be constructed with an invalid type.
      ticketTypeTotals[request.getTicketType()] += numberOfTickets;
    }

    const totalAmountOfTickets = ticketTypeTotals.INFANT + ticketTypeTotals.CHILD + ticketTypeTotals.ADULT;

    // We don't have to check if there's zero or less tickets here, as we would have thrown above if a request had zero or less tickets.
    if (totalAmountOfTickets > 20)
      throw new InvalidPurchaseException("Only a maximum of 20 tickets can be purchased at a time");

    // Business rule:
    // - Child and Infant tickets cannot be purchased without purchasing an Adult ticket.
    if (ticketTypeTotals.ADULT === 0 && (ticketTypeTotals.INFANT > 0 || ticketTypeTotals.CHILD > 0))
      throw new InvalidPurchaseException("Child and Infant tickets cannot be purchased without purchasing an Adult ticket");

    // Business rule:
    // - The ticket prices are based on the type of ticket (see table below).
    // |   Ticket Type    |     Price   |
    // | ---------------- | ----------- |
    // |    INFANT        |    £0       |
    // |    CHILD         |    £10      |
    // |    ADULT         |    £20      |
    const INFANT_TICKET_PRICE_GBP = 0;
    const CHILD_TICKET_PRICE_GBP = 10;
    const ADULT_TICKET_PRICE_GBP = 20;

    // Task:
    // - Calculates the correct amount for the requested tickets and makes a payment request to the `TicketPaymentService`.
    const totalPrice = (INFANT_TICKET_PRICE_GBP * ticketTypeTotals.INFANT)
                     + (CHILD_TICKET_PRICE_GBP * ticketTypeTotals.CHILD)
                     + (ADULT_TICKET_PRICE_GBP * ticketTypeTotals.ADULT);
    
    // Task:
    // - Calculates the correct no of seats to reserve and makes a seat reservation request to the `SeatReservationService`.  
    // Business rule:
    // - Infants do not pay for a ticket and are not allocated a seat. They will be sitting on an Adult's lap.
    const totalSeats = ticketTypeTotals.CHILD + ticketTypeTotals.ADULT;

    // Business rule:
    // - There is an existing `TicketPaymentService` responsible for taking payments.
    // Assumptions:
    // - The `TicketPaymentService` implementation is an external provider with no defects. You do not need to worry about how the actual payment happens.
    // - The payment will always go through once a payment request has been made to the `TicketPaymentService`.
    // - [Accounts] also have sufficient funds to pay for any no of tickets.
    const ticketPaymentService = new TicketPaymentService();
    ticketPaymentService.makePayment(accountId, totalPrice);

    // Business rule:
    // - There is an existing `SeatReservationService` responsible for reserving seats.
    // Assumptions:
    // - The `SeatReservationService` implementation is an external provider with no defects. You do not need to worry about how the seat reservation algorithm works.
    // - The seat will always be reserved once a reservation request has been made to the `SeatReservationService`.
    const seatReservationService = new SeatReservationService();
    seatReservationService.reserveSeat(accountId, totalSeats);
  }
}
