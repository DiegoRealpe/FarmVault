import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchGrantRecord,
  fetchCreatedGrantRecords,
} from "../../features/grants/grantRecordSlice";

import GrantsStats from "./GrantsStats";
import GrantsTable from "./GrantsTable";

import "./GrantsPage.css";

function GrantsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.user);
  const {
    grantRecord,
    createdGrantRecords,
    loadingGrantRecord,
    loadingCreatedGrantRecords,
    error,
  } = useSelector((state: RootState) => state.grantRecord);

  const userSub = user.sub;
  const isAdmin = user.isAdmin;

  useEffect(() => {
    if (!userSub) return;

    dispatch(fetchGrantRecord());

    if (isAdmin) {
      dispatch(fetchCreatedGrantRecords());
    }
  }, [dispatch, userSub, isAdmin]);

  const handleRefresh = () => {
    if (!userSub) return;

    dispatch(fetchGrantRecord());

    if (isAdmin) {
      dispatch(fetchCreatedGrantRecords());
    }
  };

  return (
    <div className="grants-container">
      {!isAdmin && (
        <div className="info-banner">
          <p>ℹ️ You are viewing your grant record as a temporary user.</p>
        </div>
      )}

      <GrantsStats
        grantRecord={grantRecord}
        createdGrantRecords={createdGrantRecords}
        isAdmin={isAdmin}
      />

      <GrantsTable
        grantRecord={grantRecord}
        createdGrantRecords={createdGrantRecords}
        loadingGrantRecord={loadingGrantRecord}
        loadingCreatedGrantRecords={loadingCreatedGrantRecords}
        error={error}
        isAdmin={isAdmin}
        currentUserSub={userSub}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

export default GrantsPage;