import {
  listUserForSearchProcedure,
  listUserProcedure,
  profileUpdateProcedure,
  updateUserRoleProcedure,
  userDetailsProcedure,
  userImpl,
  userStatsProcedure,
} from "./user.procedure"

export const userRouter = userImpl.router({
  list: listUserProcedure,
  listUserForSearch: listUserForSearchProcedure,
  stats: userStatsProcedure,
  updateRole: updateUserRoleProcedure,
  updateProfile: profileUpdateProcedure,
  details: userDetailsProcedure,
})
