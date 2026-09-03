import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const getStocks = (params) => api.get(endpoints.inventory.stocks, params);
export const updateStock = (id, body) =>
  api.patch(endpoints.inventory.stocks + "/" + id, body);

/** Chairside consumption — decrements the on-hand count. */
export const consumeStock = (id, quantity, onHand) =>
  api.patch(endpoints.inventory.stocks + "/" + id, {
    quantity: Math.max(onHand - quantity, 0),
  });

export const getStockOrders = () => api.get(endpoints.inventory.stockOrders);
export const createStockOrder = (body) => api.post(endpoints.inventory.stockOrders, body);

export const getPeripherals = (params) => api.get(endpoints.inventory.peripherals, params);
