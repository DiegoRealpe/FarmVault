import { useEffect, useState } from "react";
import {
  toDateTimeLocalValue,
  toggleStringSelection,
} from "../../utils/utils";

export interface SelectOption {
  id: string;
  label: string;
}

export type GrantEditorMode = "create" | "edit";

export interface GrantEditorInitialValues {
  userSub?: string;
  username?: string;
  email?: string;
  expiresAt?: string;
  selectedFarmIds?: string[];
  selectedDeviceIds?: string[];
}

export interface GrantEditorFormValues {
  email: string;
  temporaryPassword?: string;
  expiresAt: string;
  selectedFarmIds: string[];
  selectedDeviceIds: string[];
}

interface GrantEditorModalProps {
  isOpen: boolean;
  mode: GrantEditorMode;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: GrantEditorFormValues) => Promise<void>;
  initialValues?: GrantEditorInitialValues | null;
  availableFarmOptions: SelectOption[];
  availableDeviceOptions: SelectOption[];
  loadingFarmOptions: boolean;
  loadingDeviceOptions: boolean;
  optionsError?: string | null;
}

function GrantEditorModal({
  isOpen,
  mode,
  isSubmitting,
  onClose,
  onSubmit,
  initialValues = null,
  availableFarmOptions,
  availableDeviceOptions,
  loadingFarmOptions,
  loadingDeviceOptions,
  optionsError = null,
}: GrantEditorModalProps) {
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedFarmIds, setSelectedFarmIds] = useState<string[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const isCreateMode = mode === "create";
  const isOptionsLoading = loadingFarmOptions || loadingDeviceOptions;
  const isBusy = isSubmitting || isOptionsLoading;

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setTemporaryPassword("");
      setExpiresAt("");
      setSelectedFarmIds([]);
      setSelectedDeviceIds([]);
      setLocalError(null);
      return;
    }

    setEmail(initialValues?.email ?? "");
    setTemporaryPassword("");
    setExpiresAt(
      initialValues?.expiresAt
        ? toDateTimeLocalValue(initialValues.expiresAt)
        : "",
    );
    setSelectedFarmIds(initialValues?.selectedFarmIds ?? []);
    setSelectedDeviceIds(initialValues?.selectedDeviceIds ?? []);
    setLocalError(null);
  }, [isOpen, initialValues]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (isOptionsLoading) {
      setLocalError("Please wait for farms and devices to finish loading.");
      return;
    }

    if (isCreateMode && !email.trim()) {
      setLocalError("Email is required.");
      return;
    }

    if (isCreateMode && !temporaryPassword.trim()) {
      setLocalError("Temporary password is required.");
      return;
    }

    if (!expiresAt) {
      setLocalError("Expiration time is required.");
      return;
    }

    try {
      await onSubmit({
        email: email.trim(),
        temporaryPassword: isCreateMode ? temporaryPassword.trim() : undefined,
        expiresAt: new Date(expiresAt).toISOString(),
        selectedFarmIds,
        selectedDeviceIds,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Failed to save grant.",
      );
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            {isCreateMode ? "Create User + Grant Access" : "Edit Grant Access"}
          </h2>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {isCreateMode ? (
            <>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isBusy}
                />
              </label>

              <label>
                Temporary Password
                <input
                  type="text"
                  value={temporaryPassword}
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                  disabled={isBusy}
                />
              </label>
            </>
          ) : (
            <div className="modal-user-summary">
              <div className="modal-user-summary-row">
                <span className="modal-user-summary-label">Email</span>
                <span className="modal-user-summary-value">
                  {initialValues?.email || "Unknown"}
                </span>
              </div>

              <div className="modal-user-summary-row">
                <span className="modal-user-summary-label">Username</span>
                <span className="modal-user-summary-value">
                  {initialValues?.username || "Unknown"}
                </span>
              </div>

              <div className="modal-user-summary-row">
                <span className="modal-user-summary-label">User Sub</span>
                <span className="modal-user-summary-value">
                  {initialValues?.userSub || "Unknown"}
                </span>
              </div>
            </div>
          )}

          <label>
            Expiration Time
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              disabled={isBusy}
            />
          </label>

          <div className="modal-section">
            <h3>Farm Grants</h3>

            {loadingFarmOptions ? (
              <p className="modal-helper-text">Loading farm options...</p>
            ) : availableFarmOptions.length === 0 ? (
              <p className="modal-helper-text">No farms available to grant.</p>
            ) : (
              availableFarmOptions.map((option) => (
                <label key={option.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedFarmIds.includes(option.id)}
                    onChange={() =>
                      setSelectedFarmIds((currentValues) =>
                        toggleStringSelection(option.id, currentValues),
                      )
                    }
                    disabled={isBusy}
                  />
                  {option.label}
                </label>
              ))
            )}
          </div>

          <div className="modal-section">
            <h3>Device Grants</h3>

            {loadingDeviceOptions ? (
              <p className="modal-helper-text">Loading device options...</p>
            ) : availableDeviceOptions.length === 0 ? (
              <p className="modal-helper-text">No devices available to grant.</p>
            ) : (
              availableDeviceOptions.map((option) => (
                <label key={option.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedDeviceIds.includes(option.id)}
                    onChange={() =>
                      setSelectedDeviceIds((currentValues) =>
                        toggleStringSelection(option.id, currentValues),
                      )
                    }
                    disabled={isBusy}
                  />
                  {option.label}
                </label>
              ))
            )}
          </div>

          {optionsError && <p className="modal-error">{optionsError}</p>}
          {localError && <p className="modal-error">{localError}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isBusy}>
              {isSubmitting
                ? "Saving..."
                : isCreateMode
                  ? "Create User"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GrantEditorModal;