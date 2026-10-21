import {
  createCustomerPaymentProcedure,
  createCustomerProcedure,
  customerDetailsProcedure,
  customerImpl,
  listCustomerForSearchProcedure,
  listCustomerPaymentsProcedure,
  listCustomerProcedure,
  updateCustomerProcedure,
} from "./customer.procedure";

export const customerRouter = customerImpl.router({
  list: listCustomerProcedure,
  listForSearch: listCustomerForSearchProcedure,
  create: createCustomerProcedure,
  update: updateCustomerProcedure,
  details: customerDetailsProcedure,
  payment: {
    list: listCustomerPaymentsProcedure,
    create: createCustomerPaymentProcedure,
  },
});
