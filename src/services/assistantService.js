import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

/**
 * The dental assistant's surface.
 *
 * Its own service rather than more functions on `clinicalService` and
 * `inventoryService`, because what this role does chairside — turn a chair
 * over, log a load, take something off the shelf for the patient in front of
 * you — is one job rather than three, and the screens that do it want one
 * import.
 *
 * The board is the piece that matters. It replaces four list reads the
 * dashboard used to make (today's visits, every room, every sterilisation cycle
 * ever recorded, every stock line) and the `.filter().length` counting that
 * followed them. Two of those tables grow forever and the register is never
 * pruned, so the old dashboard got more expensive every month while the numbers
 * on it stayed four characters wide.
 */

/**
 * Everything the dashboard renders, in one request.
 *
 * `{ kpis, rooms, upcoming, sterilisation, stock, generatedAt }`.
 */
export const getBoard = (params) => api.get(endpoints.assistant.board, params);

/* ------------------------------------------------------------------ chairs */

export const getRooms = () => api.get(endpoints.rooms.list);

/**
 * Move a chair to a new state.
 *
 * `expectedStatus` is the guard worth passing: it makes the transition
 * conditional on what the screen was showing, so a tab left open since this
 * morning cannot reopen a chair somebody has just taken out of service. It is
 * deliberately not an etag — two people both pressing "mark ready" agree with
 * each other, and a conflict dialog about that would be a dialog about nothing.
 */
export const setRoomStatus = (roomId, status, body) =>
  api.patch(endpoints.rooms.room(roomId), { status, ...body });

export const markRoomReady = (roomId, expectedStatus) =>
  setRoomStatus(roomId, "ready", expectedStatus ? { expectedStatus } : undefined);

/* ----------------------------------------------------------- infection control */

export const getCycles = (params) => api.get(endpoints.sterilization.cycles, params);

/**
 * The tile strip and the spore-test warning.
 *
 * Folded server-side. The screen counting this itself means fetching the
 * register, and the register is the one table in the practice that is never
 * allowed to be pruned.
 */
export const getSterilisationSummary = () => api.get(endpoints.sterilization.summary);

/** The autoclaves, for the cycle form. Not the equipment register — see the
    endpoint's note on why a dentist would 403 on that one. */
export const getSterilizers = () => api.get(endpoints.sterilization.sterilizers);

/**
 * Record a load.
 *
 * Note what is *not* sent: `cycleNumber` and `result`. Both used to be decided
 * here — the number as `Math.floor(Math.random() * 1000) + 8800`, the result as
 * `chemical === "fail" ? "fail" : "pending"` — and both are the server's now.
 * A register numbered at random has duplicates and gaps, and "cycle 8814" is
 * the identifier a load of instruments is traced back by; a result the client
 * sets is a result the client can overrule.
 *
 * `sporeTest` is the flag that decides whether an unread biological indicator
 * means "pending" or means nothing at all.
 */
export const logCycle = (body) => api.post(endpoints.sterilization.cycles, body);

/**
 * Read an indicator that came back later.
 *
 * `startedAt` is required because a cycle lives in its own month's partition
 * and the server builds the key from it.
 */
export const recordIndicator = (cycleId, body) =>
  api.patch(endpoints.sterilization.cycle(cycleId), body);

/* ------------------------------------------------------------------ the store */

export const getStocks = (params) => api.get(endpoints.inventory.stocks, params);

export const getStockSummary = () => api.get(endpoints.inventory.stocksSummary);

/** What to order, and what is about to expire. */
export const getReorderList = (params) => api.get(endpoints.inventory.stocksReorder, params);

/**
 * Take stock off the shelf for the patient in the chair.
 *
 * Relative, not absolute: the server applies a delta, so two assistants
 * consuming from the same box in the same second both land. Passing an
 * appointment is what makes the movement explicable later — a quantity that
 * went down tells you nothing about why.
 *
 * Resolves with `{ stock, consumed, shortfall, status }`. `shortfall` is not an
 * error: an assistant who asked for five and could only take three has taken
 * three, because the physical act already happened at the chair.
 */
export const consumeStock = (stockId, quantity, context) =>
  api.post(endpoints.inventory.consumeStock(stockId), { quantity, ...context });

export const getStockOrders = (params) => api.get(endpoints.inventory.stockOrders, params);

/** Flag something to be ordered. A draft — somebody with a budget promotes it. */
export const requestStock = (body) => api.post(endpoints.inventory.stockOrders, body);
