import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

/**
 * The clinic owner's surface.
 *
 * Its own service rather than more verbs on `analyticsService`, for the same
 * reason the server gives the board its own prefix: the owner's board is not a
 * dashboard parameterised by role, it is one screen with one payload, and
 * putting it behind `getDashboard("owner")` is what made the role a parameter
 * in the first place.
 *
 * `analyticsService.getDashboard` still works and still reaches the right
 * board — the server resolves it from the session and ignores the role in the
 * path — but new code should call this.
 */

/**
 * The whole board in one request.
 *
 * @param {"30"|"90"|"365"} range the window, and the only thing it takes.
 *
 * A fixed set rather than an arbitrary day count: each value is its own cache
 * entry on the server, so an unbounded parameter would turn a warm cache cold
 * for everybody and make the most-refreshed screen in the product the most
 * expensive one.
 */
export const getBoard = (range = "30") => api.get(endpoints.owner.board, { range });

/**
 * Who owes what, oldest debt first.
 *
 * The board draws the ageing as four bars; this is the list behind them, and it
 * is a separate call because nobody needs it until they are actually chasing
 * somebody — it is the part of the payload that grows with the size of the
 * problem.
 */
export const getReceivables = (limit = 50) => api.get(endpoints.owner.receivables, { limit });
