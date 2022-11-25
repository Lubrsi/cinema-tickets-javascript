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
  }
}
