import TicketService from "../src/pairtest/TicketService";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";

const ticketService = new TicketService();

describe("valid purchase requests", () => {
    test("valid account id and ticket request", () => {
        const testValues = [
            1,
            2,
            3,
            2 ** 32,
            Number.MAX_SAFE_INTEGER,
        ];

        for (const value of testValues) {
            expect(() => {
                ticketService.purchaseTickets(value, new TicketTypeRequest("ADULT", 1));
            }).not.toThrow();
        }
    });

    test("allows child and infant tickets as long as there's an adult ticket", () => {
        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("ADULT", 1), new TicketTypeRequest("INFANT", 9), new TicketTypeRequest("CHILD", 10));
        }).not.toThrow();
    });
});

const invalidTestValues = [
    undefined,
    null,
    false,
    true,
    1.1,
    NaN,
    Infinity,
    -Infinity,
    "test",
    1n,
    () => {},
    {},
    { valueOf() { return 1; } },
    [],
    [1],
    Symbol.toPrimitive,
];

describe("invalid ticket type requests", () => {
    test("invalid type", () => {
        const testValues = invalidTestValues.concat("", "Adult", "Child", "Infant");

        for (const value of testValues) {
            expect(() => {
                new TicketTypeRequest(value, 1);
            }).toThrow("type must be ADULT, CHILD, or INFANT");
        }
    });

    test("number of tickets must be an integer", () => {
        for (const value of invalidTestValues) {
            expect(() => {
                new TicketTypeRequest("ADULT", value);
            }).toThrow("noOfTickets must be an integer");
        }
    });
});

describe("invalid purchase requests", () => {
    const testValuesForIntegersAboveZero = [
        0,
        -0,
        -1,
    ];

    test("invalid account id type", () => {
        for (const value of invalidTestValues) {
            expect(() => {
                ticketService.purchaseTickets(value);
            }).toThrow("Account ID is not an integer");
        }

        expect(() => {
            ticketService.purchaseTickets();
        }).toThrow("Account ID is not an integer");
    });

    test("invalid account id range", () => {
        for (const value of testValuesForIntegersAboveZero) {
            expect(() => {
                ticketService.purchaseTickets(value);
            }).toThrow("Account ID must be greater than zero");
        }
    });

    test("must make at least one ticket type request", () => {
        expect(() => {
            ticketService.purchaseTickets(1);
        }).toThrow("Must make at least one ticket type request");
    });

    test("can only purchase 20 tickets at a time", () => {
        const requests = [];
        for (let i = 0; i <= 20; i++) {
            requests.push(new TicketTypeRequest("ADULT", 1));
        }

        expect(() => {
            ticketService.purchaseTickets(1, ...requests);
        }).toThrow("Only a maximum of 20 tickets can be purchased at a time");

        // Doesn't depend on type
        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("ADULT", 21));
        }).toThrow("Only a maximum of 20 tickets can be purchased at a time");

        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("INFANT", 21));
        }).toThrow("Only a maximum of 20 tickets can be purchased at a time");

        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("CHILD", 21));
        }).toThrow("Only a maximum of 20 tickets can be purchased at a time");

        // Mixture of types
        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("ADULT", 10), new TicketTypeRequest("CHILD", 10), new TicketTypeRequest("INFANT", 1));
        }).toThrow("Only a maximum of 20 tickets can be purchased at a time");

        // Multiple of same type spread across different requests.
        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("ADULT", 10), new TicketTypeRequest("ADULT", 10), new TicketTypeRequest("ADULT", 1));      
        }).toThrow("Only a maximum of 20 tickets can be purchased at a time");

        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("INFANT", 10), new TicketTypeRequest("INFANT", 10), new TicketTypeRequest("INFANT", 1));      
        }).toThrow("Only a maximum of 20 tickets can be purchased at a time");

        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("CHILD", 10), new TicketTypeRequest("CHILD", 10), new TicketTypeRequest("CHILD", 1));      
        }).toThrow("Only a maximum of 20 tickets can be purchased at a time");
    });

    test("children/infants must be accompanied by an adult", () => {
        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("CHILD", 20));
        }).toThrow("Child and Infant tickets cannot be purchased without purchasing an Adult ticket");

        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("INFANT", 20));
        }).toThrow("Child and Infant tickets cannot be purchased without purchasing an Adult ticket");

        expect(() => {
            ticketService.purchaseTickets(1, new TicketTypeRequest("INFANT", 10), new TicketTypeRequest("CHILD", 10));
        }).toThrow("Child and Infant tickets cannot be purchased without purchasing an Adult ticket");
    });

    test("requests must be of type TicketTypeRequest", () => {
        for (const value of invalidTestValues) {
            expect(() => {
                ticketService.purchaseTickets(1, value);
            }).toThrow("The ticket requests contain a non-request value");
        }
    });

    test("ticket request cannot request zero or less tickets", () => {
        for (const value of testValuesForIntegersAboveZero) {
            expect(() => {
                ticketService.purchaseTickets(1, new TicketTypeRequest("ADULT", value));
            }).toThrow("A ticket request is requesting zero or less tickets");
        }
    });
});
