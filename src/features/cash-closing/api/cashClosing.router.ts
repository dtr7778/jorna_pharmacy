import {
  listCashClosingProcedure,
  cashClosingImpl,
} from "./cashClosing.procedure";

export const cashClosingRouter = cashClosingImpl.router({
  list: listCashClosingProcedure,
});
