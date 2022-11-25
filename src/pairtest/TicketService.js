import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';

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
  }
}
