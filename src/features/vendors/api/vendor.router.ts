import {
  createVendorProcedure,
  listVendorForSearchProcedure,
  listVendorProcedure,
  updateVendorProcedure,
  vendorDetailsProcedure,
  vendorImpl,
} from "./vendor.procedure";
import {
  createVendorPaymentProcedure,
  listVendorPaymentsProcedure,
  vendorPaymentStatsProcedure,
} from "./vendorPayment.procedure";

export const vendorRouter = vendorImpl.router({
  list: listVendorProcedure,
  listForSearch: listVendorForSearchProcedure,
  create: createVendorProcedure,
  update: updateVendorProcedure,
  details: vendorDetailsProcedure,
  payment: {
    create: createVendorPaymentProcedure,
    list: listVendorPaymentsProcedure,
    stats: vendorPaymentStatsProcedure,
  },
});
