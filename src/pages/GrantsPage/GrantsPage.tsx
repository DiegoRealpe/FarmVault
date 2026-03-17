import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "../../app/store";
import { fetchUserGrants } from "../../features/grants/userAccessSlice";

import GrantsStats from "./GrantsStats";
import GrantsTable from "./GrantsTable";

import "./GrantsPage.css";

function GrantsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.user);
  const { grants, loading, error } = useSelector(
    (state: RootState) => state.userAccess
  );

  const userSub = user.sub;
  const isAdmin = user.isAdmin;

  useEffect(() => {
    if (!userSub) return;
    dispatch(fetchUserGrants(userSub));
  }, [dispatch, userSub]);

  const handleRefresh = () => {
    if (!userSub) return;
    dispatch(fetchUserGrants(userSub));
  };

  return (
    <div className="grants-container">
      {!isAdmin && (
        <div className="info-banner">
          <p>ℹ️ You are viewing grants as a temporary user.</p>
        </div>
      )}

      <GrantsStats grants={grants} />

      <GrantsTable
        grants={grants}
        loading={loading}
        error={error}
        isAdmin={isAdmin}
        currentUserSub={userSub}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

export default GrantsPage;