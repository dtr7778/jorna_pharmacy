import {
  createMedicineProcedure,
  listMedicineForSearchProcedure,
  listMedicineProcedure,
  medicineImpl,
  updateMedicineProcedure,
} from "./medicine.procedure";

export const medicineRouter = medicineImpl.router({
  list: listMedicineProcedure,
  listForSearch: listMedicineForSearchProcedure,
  create: createMedicineProcedure,
  update: updateMedicineProcedure,
});
