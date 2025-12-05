import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../app/store";
import { logout } from "./userSlice";

export function useUser() {
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();

  return {
    ...user,
    logout: () => dispatch(logout()),
  };
}