import { implement } from "@orpc/server";
import { desc, eq, sql } from "drizzle-orm";

import { API_MESSAGES } from "@/constants/apiMessage";
import { CashClosingTable, UserTable } from "@/db/schemas";
import { buildPaginateOptions, buildPaginationMeta } from "@/db/utils";
import { apiResponse } from "@/lib/apiResponse";
import {
  authMiddleware,
  userPermissionMiddleware,
} from "@/server/middleware/auth.middleware";
import { errorMiddleware } from "@/server/middleware/error.middleware";
import type { ORPCContext } from "@/types/orpc.types";

import { cashClosingContract } from "./cashClosing.contract";

export const cashClosingImpl = implement(cashClosingContract)
  .$context<ORPCContext>()
  .use(authMiddleware)
  .use(errorMiddleware);

export const listCashClosingProcedure = cashClosingImpl.list
  .use(
    userPermissionMiddleware([
      { level: "system", resource: "report", action: "manage" },
      { level: "system", resource: "report", action: "list" },
    ])
  )
  .handler(async ({ context, input }) => {
    const { where, page, orderBy, offset, limit } = buildPaginateOptions(
      {
        periodStart: CashClosingTable.periodStart,
        periodEnd: CashClosingTable.periodEnd,
        openingCash: CashClosingTable.openingCash,
        totalSales: CashClosingTable.totalSales,
        totalReturns: CashClosingTable.totalReturns,
        cashReceived: CashClosingTable.cashReceived,
        vendorPaid: CashClosingTable.vendorPaid,
        totalExpenses: CashClosingTable.totalExpenses,
        totalSalary: CashClosingTable.totalSalary,
        expectedCash: CashClosingTable.expectedCash,
        countedCash: CashClosingTable.countedCash,
        difference: CashClosingTable.difference,
        closedByName: UserTable.name,
        note: CashClosingTable.note,
        createdAt: CashClosingTable.createdAt,
      },
      input
    );

    const [totalCountResult, cashClosings] = await Promise.all([
      context.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(CashClosingTable)
        .leftJoin(UserTable, eq(CashClosingTable.closedBy, UserTable.id))
        .where(where),
      context.db
        .select({
          id: CashClosingTable.id,
          periodStart: CashClosingTable.periodStart,
          periodEnd: CashClosingTable.periodEnd,
          openingCash: CashClosingTable.openingCash,
          totalSales: CashClosingTable.totalSales,
          totalReturns: CashClosingTable.totalReturns,
          cashReceived: CashClosingTable.cashReceived,
          vendorPaid: CashClosingTable.vendorPaid,
          totalExpenses: CashClosingTable.totalExpenses,
          totalSalary: CashClosingTable.totalSalary,
          expectedCash: CashClosingTable.expectedCash,
          countedCash: CashClosingTable.countedCash,
          difference: CashClosingTable.difference,
          closedBy: CashClosingTable.closedBy,
          closedByName: UserTable.name,
          note: CashClosingTable.note,
          createdAt: CashClosingTable.createdAt,
        })
        .from(CashClosingTable)
        .leftJoin(UserTable, eq(CashClosingTable.closedBy, UserTable.id))
        .where(where)
        .orderBy(
          input.orderField && input.order
            ? orderBy
            : desc(CashClosingTable.periodStart)
        )
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);

    return apiResponse(API_MESSAGES.CASH_CLOSING.GET_ALL, {
      meta: buildPaginationMeta(totalCount, cashClosings.length, page, limit),
      data: cashClosings,
    });
  });
