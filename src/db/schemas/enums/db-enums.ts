import { text } from "drizzle-orm/sqlite-core";

import {
  ADDRESS_TYPE,
  MEDICINE_TYPE,
  ROLES,
  STOCK_MOVEMENT_TYPE,
  USER_EVENT_TYPE,
} from "./enum-values";

export const RoleEnum = (name: string) => text(name, { enum: ROLES });

export const AddressTypeEnum = (name: string) =>
  text(name, { enum: ADDRESS_TYPE });

export const UserEventTypeEnum = (name: string) =>
  text(name, { enum: USER_EVENT_TYPE });

export const MedicineTypeEnum = (name: string) =>
  text(name, { enum: MEDICINE_TYPE });

export const StockMovementTypeEnum = (name: string) =>
  text(name, { enum: STOCK_MOVEMENT_TYPE });
