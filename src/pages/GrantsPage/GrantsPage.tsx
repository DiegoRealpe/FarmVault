import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchGrantRecord,
  fetchCreatedGrantRecords,
  createFarmUserThunk,
  upsertGrantRecordThunk,
  type GrantEntry,
} from "../../features/grants/grantRecordSlice";
import GrantsStats from "./GrantsStats";
import GrantsTable from "./GrantsTable";
import CreateUserGrantModal, { CreateUserGrantFormValues } from "./CreateUserGrantModal";
import "./GrantsPage.css";


function GrantsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const user = useSelector((state: RootState) => state.user);
  const {
    grantRecord,
    createdGrantRecords,
    loadingGrantRecord,
    loadingCreatedGrantRecords,
    creatingUser,
    upsertingGrantRecord,
    error,
  } = useSelector((state: RootState) => state.grantRecord);

  const userSub = user.sub;
  const isAdmin = user.isAdmin;

  console.log("[GrantsPage] loaded with userSub:", userSub, "isAdmin:", isAdmin);

  useEffect(() => {
    console.log("[GrantsPage] useEffect invoked");
    if (!userSub) return;

    console.log("[GrantsPage] userSub is available:", userSub);
    
    if (isAdmin) {
      
      console.log("[GrantsPage] admin calling fetchCreatedGrantRecords");
      dispatch(fetchCreatedGrantRecords());
    }
    else {
      dispatch(fetchGrantRecord());
    }
  }, [dispatch, userSub, isAdmin]);

  const handleRefresh = () => {
    if (!userSub) return;

    dispatch(fetchGrantRecord());

    if (isAdmin) {
      dispatch(fetchCreatedGrantRecords());
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateUserAndGrant = async (
    values: CreateUserGrantFormValues,
  ) => {
    const grants: GrantEntry[] = [];

    if (values.selectedFarmIds.length > 0) {
      grants.push({
        grantType: "farm",
        ids: values.selectedFarmIds,
      });
    }

    if (values.selectedDeviceIds.length > 0) {
      grants.push({
        grantType: "device",
        ids: values.selectedDeviceIds,
      });
    }

    const createdUser = await dispatch(
      createFarmUserThunk({
        email: values.email,
        temporaryPassword: values.temporaryPassword,
      }),
    ).unwrap();

    if (!createdUser.userSub) {
      throw new Error("Created user did not return a userSub.");
    }

    await dispatch(
      upsertGrantRecordThunk({
        userSub: createdUser.userSub,
        grants,
        expiresAt: values.expiresAt,
      }),
    ).unwrap();

    handleRefresh();
    handleCloseCreateModal();
  };

  const isSubmitting = creatingUser || upsertingGrantRecord;

  return (
    <div className="grants-container">
      {!isAdmin && (
        <div className="info-banner">
          <p>ℹ️ You are viewing your grant record as a temporary user.</p>
        </div>
      )}

      {isAdmin && (
        <div className="grants-page-actions">
          <button onClick={handleOpenCreateModal}>+ New User</button>
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

      {isAdmin && (
        <CreateUserGrantModal
          isOpen={isCreateModalOpen}
          isSubmitting={isSubmitting}
          onClose={handleCloseCreateModal}
          onSubmit={handleCreateUserAndGrant}
          availableFarmOptions={[
            { id: "farm-1", label: "farm-1" },
            { id: "farm-2", label: "farm-2" },
          ]}
          availableDeviceOptions={[
            { id: "device-1", label: "device-1" },
            { id: "device-2", label: "device-2" },
            { id: "device-3", label: "device-3" },
          ]}
        />
      )}
    </div>
  );
}

export default GrantsPage;