import { cashClosingRouter } from "@/features/cash-closing/api/cashClosing.router";
import { customerRouter } from "@/features/customer/api/customer.router";
import { medicineRouter } from "@/features/medicine/api/medicine.router";
import { purchaseRouter } from "@/features/purchase/api/purchase.router";
import { roleRouter } from "@/features/role/api/role.router";
import { saleRouter } from "@/features/sale/api/sale.router";
import { userRouter } from "@/features/user/api/user.router";
import { vendorRouter } from "@/features/vendors/api/vendor.router";

export const router = {
  user: userRouter,
  role: roleRouter,
  vendor: vendorRouter,
  customer: customerRouter,
  sale: saleRouter,
  purchase: purchaseRouter,
  medicine: medicineRouter,
  cashClosing: cashClosingRouter,
};
