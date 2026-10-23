import {
  listCashClosingProcedure,
  cashClosingImpl,
  cashClosingCreateProcedure,
} from "./cashClosing.procedure";

export const cashClosingRouter = cashClosingImpl.router({
  list: listCashClosingProcedure,
  create: cashClosingCreateProcedure,
});
