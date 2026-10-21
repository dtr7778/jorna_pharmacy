import { implement, ORPCError } from "@orpc/server";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  isNotNull,
  sql,
  type SQL,
} from "drizzle-orm";

import { API_MESSAGES } from "@/constants/apiMessage";
import { CustomerPaymentTable, CustomerTable, SaleTable } from "@/db/schemas";
import { buildPaginateOptions, buildPaginationMeta } from "@/db/utils";
import { apiResponse } from "@/lib/apiResponse";
import {
  authMiddleware,
  userPermissionMiddleware,
} from "@/server/middleware/auth.middleware";
import { errorMiddleware } from "@/server/middleware/error.middleware";
import type { ORPCContext } from "@/types/orpc.types";

import { customerContract } from "./customer.contract";

export const customerImpl = implement(customerContract)
  .$context<ORPCContext>()
  .use(authMiddleware)
  .use(errorMiddleware);

export const listCustomerProcedure = customerImpl.list
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "customer", action: "manage" },
      { level: "system", resource: "customer", action: "list" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { where, page, orderBy, offset, limit } = buildPaginateOptions(
      {
        name: CustomerTable.name,
        phone: CustomerTable.phone,
        address: CustomerTable.address,
        createdAt: CustomerTable.createdAt,
      },
      input
    );

    const salesByCustomer = context.db
      .select({
        customerId: SaleTable.customerId,
        totalSales: sql<number>`COALESCE(SUM(${SaleTable.totalAmount}), 0)`.as(
          "total_sales"
        ),
        lastPurchaseAt: sql<number | null>`MAX(${SaleTable.createdAt})`.as(
          "last_purchase_at"
        ),
      })
      .from(SaleTable)
      .where(isNotNull(SaleTable.customerId))
      .groupBy(SaleTable.customerId)
      .as("sales_by_customer");

    const paymentsByCustomer = context.db
      .select({
        customerId: CustomerPaymentTable.customerId,
        totalPaid:
          sql<number>`COALESCE(SUM(${CustomerPaymentTable.amount}), 0)`.as(
            "total_paid"
          ),
      })
      .from(CustomerPaymentTable)
      .groupBy(CustomerPaymentTable.customerId)
      .as("payments_by_customer");

    const [totalCountResult, customers] = await Promise.all([
      context.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(CustomerTable)
        .where(where),
      context.db
        .select({
          ...getTableColumns(CustomerTable),
          dueAmount:
            sql<number>`COALESCE(${salesByCustomer.totalSales}, 0) - COALESCE(${paymentsByCustomer.totalPaid}, 0)`.as(
              "due_amount"
            ),
          lastPurchaseAt: salesByCustomer.lastPurchaseAt,
        })
        .from(CustomerTable)
        .leftJoin(
          salesByCustomer,
          eq(salesByCustomer.customerId, CustomerTable.id)
        )
        .leftJoin(
          paymentsByCustomer,
          eq(paymentsByCustomer.customerId, CustomerTable.id)
        )
        .where(where)
        .offset(offset)
        .limit(limit)
        .orderBy(orderBy),
    ]);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);

    const data = customers.map((customer) => ({
      ...customer,
      dueAmount: Number(customer.dueAmount),
      lastPurchaseAt:
        customer.lastPurchaseAt == null
          ? null
          : new Date(Number(customer.lastPurchaseAt)),
    }));

    return apiResponse(API_MESSAGES.CUSTOMER.GET_ALL, {
      meta: buildPaginationMeta(totalCount, data.length, page, limit),
      data,
    });
  });

export const listCustomerForSearchProcedure = customerImpl.listForSearch
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "customer", action: "manage" },
      { level: "system", resource: "customer", action: "list" },
    ])
  )
  .handler(async ({ input, context }) => {
    const { where, limit } = buildPaginateOptions(
      {
        name: CustomerTable.name,
        phone: CustomerTable.phone,
        address: CustomerTable.address,
      },
      input
    );

    const customers = await context.db
      .select({
        id: CustomerTable.id,
        name: CustomerTable.name,
        phone: CustomerTable.phone,
        address: CustomerTable.address,
      })
      .from(CustomerTable)
      .where(and(eq(CustomerTable.isActive, true), where))
      .orderBy(asc(CustomerTable.name))
      .limit(limit);

    return apiResponse(API_MESSAGES.CUSTOMER.GET_ALL_FOR_SEARCH, customers);
  });

export const createCustomerProcedure = customerImpl.create
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "customer", action: "manage" },
      { level: "system", resource: "customer", action: "create" },
    ])
  )
  .handler(async ({ context, input }) => {
    const [customer] = await context.db
      .insert(CustomerTable)
      .values(input)
      .returning();

    if (!customer) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: API_MESSAGES.CUSTOMER.NOT_CREATE,
      });
    }

    return apiResponse(API_MESSAGES.CUSTOMER.CREATE, customer);
  });

export const updateCustomerProcedure = customerImpl.update
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "customer", action: "manage" },
      { level: "system", resource: "customer", action: "update" },
    ])
  )
  .handler(async ({ context, input, errors }) => {
    const { customerId, ...data } = input;

    const [existCustomer] = await context.db
      .select()
      .from(CustomerTable)
      .where(eq(CustomerTable.id, customerId))
      .limit(1);

    if (!existCustomer) {
      throw errors.NOT_FOUND();
    }

    if (Object.keys(data).length === 0) {
      return apiResponse(API_MESSAGES.CUSTOMER.UPDATE, existCustomer);
    }

    const [updatedCustomer] = await context.db
      .update(CustomerTable)
      .set(data)
      .where(eq(CustomerTable.id, customerId))
      .returning();

    if (!updatedCustomer) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: API_MESSAGES.CUSTOMER.NOT_UPDATE,
      });
    }

    return apiResponse(API_MESSAGES.CUSTOMER.UPDATE, updatedCustomer);
  });

export const customerDetailsProcedure = customerImpl.details
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "customer", action: "manage" },
      { level: "system", resource: "customer", action: "read" },
    ])
  )
  .handler(async ({ context, input, errors }) => {
    const [customer] = await context.db
      .select()
      .from(CustomerTable)
      .where(eq(CustomerTable.id, input.customerId))
      .limit(1);

    if (!customer) {
      throw errors.NOT_FOUND();
    }

    const [salesTotals, paymentTotals] = await Promise.all([
      context.db
        .select({
          total: sql<number>`COALESCE(SUM(${SaleTable.totalAmount}), 0)`,
          count: sql<number>`COUNT(*)`,
          lastPurchaseAt: sql<number | null>`MAX(${SaleTable.createdAt})`,
        })
        .from(SaleTable)
        .where(eq(SaleTable.customerId, input.customerId)),
      context.db
        .select({
          total: sql<number>`COALESCE(SUM(${CustomerPaymentTable.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(CustomerPaymentTable)
        .where(eq(CustomerPaymentTable.customerId, input.customerId)),
    ]);

    const totalPurchased = Number(salesTotals[0]?.total ?? 0);
    const totalPaid = Number(paymentTotals[0]?.total ?? 0);
    const lastPurchaseAt = salesTotals[0]?.lastPurchaseAt;

    return apiResponse(API_MESSAGES.CUSTOMER.GET_DETAILS, {
      ...customer,
      summary: {
        totalPurchased,
        totalPaid,
        dueAmount: totalPurchased - totalPaid,
        purchaseCount: Number(salesTotals[0]?.count ?? 0),
        paymentCount: Number(paymentTotals[0]?.count ?? 0),
        lastPurchaseAt:
          lastPurchaseAt == null ? null : new Date(Number(lastPurchaseAt)),
      },
    });
  });

export const listCustomerPaymentsProcedure = customerImpl.payment.list
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "customer_payment", action: "manage" },
      { level: "system", resource: "customer_payment", action: "read" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { customerId, ...paginateInput } = input;

    const { where, page, orderBy, offset, limit } = buildPaginateOptions(
      {
        invoiceNo: SaleTable.invoiceNo,
        createdAt: CustomerPaymentTable.createdAt,
        amount: CustomerPaymentTable.amount,
      },
      paginateInput
    );

    const whereSql: Array<SQL> = [
      eq(CustomerPaymentTable.customerId, customerId),
    ];

    if (where) {
      whereSql.push(where);
    }

    const paymentWhere = and(...whereSql);

    const [totalCountResult, payments] = await Promise.all([
      context.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(CustomerPaymentTable)
        .leftJoin(SaleTable, eq(CustomerPaymentTable.saleId, SaleTable.id))
        .where(paymentWhere),
      context.db
        .select({
          id: CustomerPaymentTable.id,
          customerId: CustomerPaymentTable.customerId,
          saleId: CustomerPaymentTable.saleId,
          invoiceNo: SaleTable.invoiceNo,
          amount: CustomerPaymentTable.amount,
          note: CustomerPaymentTable.note,
          createdAt: CustomerPaymentTable.createdAt,
        })
        .from(CustomerPaymentTable)
        .leftJoin(SaleTable, eq(CustomerPaymentTable.saleId, SaleTable.id))
        .where(paymentWhere)
        .orderBy(desc(CustomerPaymentTable.createdAt), orderBy)
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);

    return apiResponse(API_MESSAGES.CUSTOMER.PAYMENT.GET_ALL, {
      meta: buildPaginationMeta(totalCount, payments.length, page, limit),
      data: payments,
    });
  });

export const createCustomerPaymentProcedure = customerImpl.payment.create
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "customer_payment", action: "manage" },
      { level: "system", resource: "customer_payment", action: "create" },
    ])
  )
  .handler(async ({ context, input, errors }) => {
    const { customerId, saleId, amount, note } = input;

    const [customer] = await context.db
      .select()
      .from(CustomerTable)
      .where(eq(CustomerTable.id, customerId))
      .limit(1);

    if (!customer) {
      throw errors.CUSTOMER_NOT_FOUND();
    }

    if (saleId) {
      const [sale] = await context.db
        .select()
        .from(SaleTable)
        .where(eq(SaleTable.id, saleId))
        .limit(1);

      if (!sale || sale.customerId !== customerId) {
        throw errors.SALE_NOT_FOUND();
      }

      if (amount > sale.totalAmount - sale.paidAmount) {
        throw errors.PAYMENT_EXCEEDS();
      }
    }

    const [payment] = await context.db
      .insert(CustomerPaymentTable)
      .values({
        customerId,
        saleId,
        amount,
        note,
        createdBy: context.user.id,
      })
      .returning();

    if (!payment) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: API_MESSAGES.CUSTOMER.PAYMENT.NOT_CREATE,
      });
    }

    if (saleId) {
      await context.db
        .update(SaleTable)
        .set({ paidAmount: sql`${SaleTable.paidAmount} + ${amount}` })
        .where(eq(SaleTable.id, saleId));
    }

    return apiResponse(API_MESSAGES.CUSTOMER.PAYMENT.CREATE, payment);
  });
