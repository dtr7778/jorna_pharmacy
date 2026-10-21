import {
  createVendorPurchaseProcedure,
  listPurchaseForSearchProcedure,
  listVendorPurchasesProcedure,
  purchaseImpl,
  vendorPurchaseDetailsProcedure,
  nextPurchaseInvoiceNoProcedure,
  vendorPurchaseStatsProcedure,
} from "./purchase.procedure";

export const purchaseRouter = purchaseImpl.router({
  list: listVendorPurchasesProcedure,
  listForSearch: listPurchaseForSearchProcedure,
  details: vendorPurchaseDetailsProcedure,
  stats: vendorPurchaseStatsProcedure,
  nextInvoiceNo: nextPurchaseInvoiceNoProcedure,
  create: createVendorPurchaseProcedure,
});
