import { useEffect, useState } from "react";
import "./GrantEditorModal.css";
import { toggleStringSelection } from "../../utils/utils";

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

function toDateInputValue(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
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
  const [expiresDate, setExpiresDate] = useState("");
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
      setExpiresDate("");
      setSelectedFarmIds([]);
      setSelectedDeviceIds([]);
      setLocalError(null);
      return;
    }

    setEmail(initialValues?.email ?? "");
    setTemporaryPassword("");
    setExpiresDate(toDateInputValue(initialValues?.expiresAt));
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

    if (!expiresDate) {
      setLocalError("Expiration date is required.");
      return;
    }

    try {
      await onSubmit({
        email: email.trim(),
        temporaryPassword: isCreateMode ? temporaryPassword.trim() : undefined,
        expiresAt: new Date(`${expiresDate}T00:00:00.000Z`).toISOString(),
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
    <div className="grant-editor-backdrop" onClick={onClose}>
      <div
        className="grant-editor-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grant-editor-header">
          <div>
            <h2 className="grant-editor-title">
              {isCreateMode ? "Create User + Grant Access" : "Edit Grant Access"}
            </h2>
            <p className="grant-editor-subtitle">
              {isCreateMode
                ? "Create a new user and assign farm or device visibility."
                : "Update the user’s expiration date and access grants."}
            </p>
          </div>

          <button
            type="button"
            className="grant-editor-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grant-editor-form">
          {isCreateMode ? (
            <div className="grant-editor-top-grid">
              <label className="grant-editor-field">
                <span className="grant-editor-label">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isBusy}
                  className="grant-editor-input"
                />
              </label>

              <label className="grant-editor-field">
                <span className="grant-editor-label">Temporary Password</span>
                <input
                  type="text"
                  value={temporaryPassword}
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                  disabled={isBusy}
                  className="grant-editor-input"
                />
              </label>
            </div>
          ) : (
            <section className="grant-editor-identity-card">
              <div className="grant-editor-identity-main">
                <div className="grant-editor-identity-email">
                  {initialValues?.email || "Unknown email"}
                </div>
                <div className="grant-editor-identity-username">
                  {initialValues?.username || "Unknown username"}
                </div>
              </div>

              <div className="grant-editor-identity-meta">
                <span className="grant-editor-meta-pill">
                  User Sub: {initialValues?.userSub || "Unknown"}
                </span>
              </div>
            </section>
          )}

          <section className="grant-editor-section grant-editor-section-compact">
            <label className="grant-editor-field grant-editor-date-field">
              <span className="grant-editor-label">Expiration Date</span>
              <input
                type="date"
                value={expiresDate}
                onChange={(event) => setExpiresDate(event.target.value)}
                disabled={isBusy}
                className="grant-editor-input"
              />
              <span className="grant-editor-helper-text">
                Saved automatically as midnight for the selected date.
              </span>
            </label>
          </section>

          <div className="grant-editor-grants-grid">
            <section className="grant-editor-section">
              <div className="grant-editor-section-header">
                <h3>Farm Grants</h3>
                <span className="grant-editor-count">
                  {selectedFarmIds.length} selected
                </span>
              </div>

              {loadingFarmOptions ? (
                <p className="grant-editor-helper-text">Loading farm options...</p>
              ) : availableFarmOptions.length === 0 ? (
                <p className="grant-editor-helper-text">No farms available to grant.</p>
              ) : (
                <div className="grant-editor-option-list">
                  {availableFarmOptions.map((option) => (
                    <label key={option.id} className="grant-editor-option-row">
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
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <section className="grant-editor-section">
              <div className="grant-editor-section-header">
                <h3>Device Grants</h3>
                <span className="grant-editor-count">
                  {selectedDeviceIds.length} selected
                </span>
              </div>

              {loadingDeviceOptions ? (
                <p className="grant-editor-helper-text">Loading device options...</p>
              ) : availableDeviceOptions.length === 0 ? (
                <p className="grant-editor-helper-text">
                  No devices available to grant.
                </p>
              ) : (
                <div className="grant-editor-option-list">
                  {availableDeviceOptions.map((option) => (
                    <label key={option.id} className="grant-editor-option-row">
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
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>
          </div>

          {optionsError && <p className="grant-editor-error">{optionsError}</p>}
          {localError && <p className="grant-editor-error">{localError}</p>}

          <div className="grant-editor-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="grant-editor-button grant-editor-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="grant-editor-button grant-editor-button-primary"
            >
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