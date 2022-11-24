import TicketService from "../src/pairtest/TicketService";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";

const ticketService = new TicketService();

describe("valid purchase requests", () => {
    test("valid account id", () => {
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
});

describe("invalid purchase requests", () => {
    test("invalid account id type", () => {
        const testValues = [
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

        for (const value of testValues) {
            expect(() => {
                ticketService.purchaseTickets(value);
            }).toThrow("Account ID is not an integer");
        }

        expect(() => {
            ticketService.purchaseTickets();
        }).toThrow("Account ID is not an integer");
    });

    test("invalid account id range", () => {
        const testValues = [
            0,
            -0,
            -1,
        ];

        for (const value of testValues) {
            expect(() => {
                ticketService.purchaseTickets(value);
            }).toThrow("Account ID must be greater than zero");
        }
    });
});