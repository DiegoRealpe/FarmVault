import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchGrantRecord,
  fetchCreatedGrantRecords,
  createFarmUserThunk,
  upsertGrantRecordThunk,
  toggleSort,
  setShowExpired,
} from "../../features/grants/grantRecordSlice";
import type { Schema } from "../../../amplify/data/resource";
import {
  fetchVisibleDevices,
  fetchVisibleFarms,
} from "../../features/devices/deviceSlice";
import GrantsStats from "./GrantsStats";
import GrantsTable from "./GrantsTable";
import GrantEditorModal, {
  GrantEditorFormValues,
  GrantEditorInitialValues,
  GrantEditorMode,
} from "./GrantEditorModal";
import "./GrantsPage.css";

type GrantRecordSortBy =
  | "userSub"
  | "expiresAt"
  | "ttl"
  | "createdBySub"
  | "createdAt"
  | "updatedAt";

type GrantRecord = Schema["GrantRecord"]["type"];
type GrantEntry = Schema["GrantEntry"]["type"];

function GrantsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [isGrantEditorOpen, setIsGrantEditorOpen] = useState(false);
  const [grantEditorMode, setGrantEditorMode] =
    useState<GrantEditorMode>("create");
  const [grantEditorInitialValues, setGrantEditorInitialValues] =
    useState<GrantEditorInitialValues | null>(null);
  const [editingUserSub, setEditingUserSub] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.user);

  const {
    grantRecord,
    createdGrantRecords,
    loadingGrantRecord,
    loadingCreatedGrantRecords,
    creatingUser,
    upsertingGrantRecord,
    error,
    filters,
  } = useSelector((state: RootState) => state.grantRecord);

  const {
    visibleDevices,
    visibleFarms,
    loadingVisibleDevices,
    loadingVisibleFarms,
    visibleDevicesError,
    visibleFarmsError,
  } = useSelector((state: RootState) => state.devices);

  const userSub = user.sub;
  const isAdmin = user.isAdmin;

  useEffect(() => {
    if (!userSub) return;

    if (isAdmin) {
      dispatch(fetchCreatedGrantRecords());
    } else {
      dispatch(fetchGrantRecord());
    }
  }, [dispatch, userSub, isAdmin]);

  const handleRefresh = () => {
    if (!userSub) return;

    if (isAdmin) {
      dispatch(fetchCreatedGrantRecords());
    } else {
      dispatch(fetchGrantRecord());
    }
  };

  const ensureGrantEditorOptionsLoaded = () => {
    dispatch(fetchVisibleDevices());
    dispatch(fetchVisibleFarms());
  };

  const handleOpenCreateGrantEditor = () => {
    if (!isAdmin) return;

    ensureGrantEditorOptionsLoaded();
    setGrantEditorMode("create");
    setGrantEditorInitialValues(null);
    setEditingUserSub(null);
    setIsGrantEditorOpen(true);
  };

  const handleOpenEditGrantEditor = (record: GrantRecord) => {
    if (!isAdmin) return;

    ensureGrantEditorOptionsLoaded();

    const normalizedGrants = (record.grants ?? []).filter(
      (grant): grant is NonNullable<typeof grant> => grant != null,
    );

    const farmGrantIds = normalizedGrants
      .filter((grant) => grant.grantType === "farm")
      .flatMap((grant) =>
        (grant.ids ?? []).filter((id): id is string => id != null),
      );

    const deviceGrantIds = normalizedGrants
      .filter((grant) => grant.grantType === "device")
      .flatMap((grant) =>
        (grant.ids ?? []).filter((id): id is string => id != null),
      );

    setGrantEditorMode("edit");
    setEditingUserSub(record.userSub);
    setGrantEditorInitialValues({
      userSub: record.userSub ?? undefined,
      username: record.username ?? undefined,
      email: record.email ?? undefined,
      expiresAt: record.expiresAt ?? undefined,
      selectedFarmIds: farmGrantIds,
      selectedDeviceIds: deviceGrantIds,
    });
    setIsGrantEditorOpen(true);
  };

  const handleCloseGrantEditor = () => {
    setIsGrantEditorOpen(false);
    setGrantEditorMode("create");
    setGrantEditorInitialValues(null);
    setEditingUserSub(null);
  };

  const handleSubmitGrantEditor = async (
    values: GrantEditorFormValues,
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

    if (grantEditorMode === "create") {
      if (!values.email.trim()) {
        throw new Error("Email is required.");
      }

      if (!values.temporaryPassword?.trim()) {
        throw new Error("Temporary password is required.");
      }

      const createdUser = await dispatch(
        createFarmUserThunk({
          email: values.email.trim(),
          temporaryPassword: values.temporaryPassword.trim(),
        }),
      ).unwrap();

      if (!createdUser.userSub) {
        throw new Error("Created user did not return a userSub.");
      }

      if (!createdUser.username?.trim()) {
        throw new Error("Created user did not return a username.");
      }

      await dispatch(
        upsertGrantRecordThunk({
          userSub: createdUser.userSub,
          username: createdUser.username.trim(),
          email: values.email.trim(),
          grants,
          expiresAt: values.expiresAt,
        }),
      ).unwrap();
    } else {
      if (!editingUserSub) {
        throw new Error("No user selected for grant editing.");
      }

      if (!grantEditorInitialValues?.username?.trim()) {
        throw new Error("Missing username for grant update.");
      }

      if (!grantEditorInitialValues?.email?.trim()) {
        throw new Error("Missing email for grant update.");
      }

      await dispatch(
        upsertGrantRecordThunk({
          userSub: editingUserSub,
          username: grantEditorInitialValues.username.trim(),
          email: grantEditorInitialValues.email.trim(),
          grants,
          expiresAt: values.expiresAt,
        }),
      ).unwrap();
    }

    handleRefresh();
    handleCloseGrantEditor();
  };

  const handleToggleSort = (sortBy: GrantRecordSortBy) => {
    dispatch(toggleSort(sortBy));
  };

  const handleShowExpiredChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    dispatch(setShowExpired(event.target.checked));
  };

  const isSubmitting = creatingUser || upsertingGrantRecord;

  const availableFarmOptions = visibleFarms
    .filter((farm) => farm?.id && farm?.name)
    .map((farm) => ({
      id: farm.id,
      label: farm.name,
    }));

  const availableDeviceOptions = visibleDevices
    .filter((device) => device?.id)
    .map((device) => ({
      id: device.id,
      label: device.name ?? device.id,
    }));

  return (
    <div className="grants-container">
      <header className="grants-header">
        <div>
          <h1 className="grants-title">Access Grants</h1>
          <p className="grants-subtitle">
            Manage temporary users and review farm or device-level access.
          </p>
        </div>
      </header>

      {!isAdmin && (
        <>
          <div className="info-banner">
            <p>ℹ️ You are viewing your grant record as a temporary user.</p>
          </div>

          <GrantsStats
            givenGrantRecord={grantRecord}
            isAdmin={isAdmin}
            loading={loadingGrantRecord}
            error={error}
          />
        </>
      )}

      {isAdmin && (
        <>
          <div className="grants-page-actions">
            <button onClick={handleOpenCreateGrantEditor}>+ New User</button>
          </div>

          <div className="grants-page-filters">
            <label className="grants-page-checkbox">
              <input
                type="checkbox"
                checked={filters.showExpired}
                onChange={handleShowExpiredChange}
              />
              Show expired grants
            </label>
          </div>

          <GrantsTable
            createdGrantRecords={createdGrantRecords}
            loadingCreatedGrantRecords={loadingCreatedGrantRecords}
            error={error}
            currentUserSub={userSub}
            onRefresh={handleRefresh}
            sortBy={filters.sortBy}
            sortDirection={filters.sortDirection}
            showExpired={filters.showExpired}
            onToggleSort={handleToggleSort}
            onSelectGrantRecord={handleOpenEditGrantEditor}
          />

          <GrantEditorModal
            isOpen={isGrantEditorOpen}
            mode={grantEditorMode}
            isSubmitting={isSubmitting}
            onClose={handleCloseGrantEditor}
            onSubmit={handleSubmitGrantEditor}
            initialValues={grantEditorInitialValues}
            availableFarmOptions={availableFarmOptions}
            availableDeviceOptions={availableDeviceOptions}
            loadingFarmOptions={loadingVisibleFarms}
            loadingDeviceOptions={loadingVisibleDevices}
            optionsError={visibleFarmsError || visibleDevicesError}
          />
        </>
      )}
    </div>
  );
}

export default GrantsPage;