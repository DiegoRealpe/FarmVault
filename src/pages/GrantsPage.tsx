import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "../app/store";
import { fetchUserGrants } from "../features/grants/userAccessSlice";

// import GrantsHeader from "../components/GrantsHeader";
// import GrantsStats from "../components/GrantsStats";
// import GrantsTable from "../components/GrantsTable";

import "./GrantsPage.css";

function GrantsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { sub: userSub, isAdmin } = useSelector(
    (state: RootState) => state.user
  );

  // const { grants, loading, error } = useSelector(
  //   (state: RootState) => state.userAccess
  // );

  useEffect(() => {
    if (!userSub) {
      return;
    }

    dispatch(fetchUserGrants(userSub));
  }, [dispatch, userSub]);

  const handleRefresh = () => {
    if (!userSub) {
      return;
    }

    dispatch(fetchUserGrants(userSub));
  };

  return (
    <div className="grants-container">
      {/* <GrantsHeader isAdmin={isAdmin} /> */}

      {!isAdmin && (
        <div className="info-banner">
          <p>ℹ️ You are viewing only the grants assigned to your account.</p>
        </div>
      )}

      {/* <GrantsStats grants={grants} /> */}

      {/* <GrantsTable
        grants={grants}
        loading={loading}
        error={error}
        isAdmin={isAdmin}
        currentUserSub={userSub}
        onRefresh={handleRefresh}
      /> */}
    </div>
  );
}

export default GrantsPage;