import { useEffect, useState } from "react";

export interface SelectOption {
  id: string;
  label: string;
}

export interface CreateUserGrantFormValues {
  email: string;
  temporaryPassword: string;
  expiresAt: string;
  selectedFarmIds: string[];
  selectedDeviceIds: string[];
}

interface CreateUserGrantModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CreateUserGrantFormValues) => Promise<void>;
  availableFarmOptions: SelectOption[];
  availableDeviceOptions: SelectOption[];
}

function CreateUserGrantModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  availableFarmOptions,
  availableDeviceOptions,
}: CreateUserGrantModalProps) {
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedFarmIds, setSelectedFarmIds] = useState<string[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setTemporaryPassword("");
      setExpiresAt("");
      setSelectedFarmIds([]);
      setSelectedDeviceIds([]);
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const toggleSelection = (
    value: string,
    currentValues: string[],
    setter: (next: string[]) => void,
  ) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter((item) => item !== value));
      return;
    }

    setter([...currentValues, value]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Email is required.");
      return;
    }

    if (!temporaryPassword.trim()) {
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
        temporaryPassword: temporaryPassword.trim(),
        expiresAt: new Date(expiresAt).toISOString(),
        selectedFarmIds,
        selectedDeviceIds,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Failed to create user.",
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
          <h2>Create User + Grant Access</h2>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label>
            Temporary Password
            <input
              type="text"
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label>
            Expiration Time
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <div className="modal-section">
            <h3>Farm Grants</h3>
            {availableFarmOptions.map((option) => (
              <label key={option.id} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={selectedFarmIds.includes(option.id)}
                  onChange={() =>
                    toggleSelection(
                      option.id,
                      selectedFarmIds,
                      setSelectedFarmIds,
                    )
                  }
                  disabled={isSubmitting}
                />
                {option.label}
              </label>
            ))}
          </div>

          <div className="modal-section">
            <h3>Device Grants</h3>
            {availableDeviceOptions.map((option) => (
              <label key={option.id} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={selectedDeviceIds.includes(option.id)}
                  onChange={() =>
                    toggleSelection(
                      option.id,
                      selectedDeviceIds,
                      setSelectedDeviceIds,
                    )
                  }
                  disabled={isSubmitting}
                />
                {option.label}
              </label>
            ))}
          </div>

          {localError && <p className="modal-error">{localError}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUserGrantModal;