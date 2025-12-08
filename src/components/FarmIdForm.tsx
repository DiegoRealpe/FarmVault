// components/FarmIdForm.tsx
import { useState } from 'react';
import '../pages/DeviceTable.css';

interface FarmIdFormProps {
  currentFarmId: string;
  onFarmIdChange: (farmId: string) => void;
  isLoading: boolean;
}

function FarmIdForm({ currentFarmId, onFarmIdChange, isLoading }: FarmIdFormProps) {
  const [inputValue, setInputValue] = useState(currentFarmId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && inputValue.trim() !== currentFarmId) {
      onFarmIdChange(inputValue.trim());
    }
  };

  return (
    <form className="farm-id-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="farmId" className="form-label">
          Farm ID
        </label>
        <div className="form-input-group">
          <input
            id="farmId"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="form-input"
            placeholder="Enter farm ID..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn btn-submit"
            disabled={isLoading || !inputValue.trim() || inputValue.trim() === currentFarmId}
          >
            {isLoading ? 'Loading...' : 'View Devices'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default FarmIdForm;
