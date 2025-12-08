import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import "./DevicePage.css";

const client = generateClient<Schema>();

// Type for our devices
// type DeviceType = Schema["IoTDeviceView"]["type"];

// ================ FarmIdForm Component ================
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
        <div className="form-hint">
          Enter a Farm ID to view its IoT devices
        </div>
      </div>
    </form>
  );
}

// ================ DeviceTable Component ================
interface DeviceTableProps {
  devices: any[];
  loading: boolean;
  error: string | null;
}

function DeviceTable({ devices, loading, error }: DeviceTableProps) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading devices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="empty-state">
        <p>No devices found for this farm.</p>
        <button 
          onClick={() => window.location.reload()}
          className="refresh-button"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="device-controls">
        <div>
          <span className="device-count">
            {devices.length} device{devices.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="refresh-small"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="device-table-container">
        <table className="device-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Device EUI</th>
              <th>Type</th>
              <th>Location</th>
              <th>Gateway</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>
                  <div className="device-name">
                    {device.name || 'Unnamed Device'}
                  </div>
                  {device.description && (
                    <div className="device-description">
                      {device.description}
                    </div>
                  )}
                </td>
                <td>
                  <code className="device-eui">{device.devEui}</code>
                </td>
                <td>
                  <span className={`type-badge type-${device.type?.toLowerCase() || 'default'}`}>
                    {device.type}
                  </span>
                </td>
                <td>
                  {device.location ? (
                    <span className="device-location">{device.location}</span>
                  ) : (
                    <span className="no-location">Not specified</span>
                  )}
                </td>
                <td>
                  {device.gatewayId ? (
                    <code className="gateway-id">{device.gatewayId}</code>
                  ) : (
                    <span className="no-gateway">N/A</span>
                  )}
                </td>
                <td>
                  <span className="last-updated">
                    {formatDate(device.updatedAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

// ================ Main DevicePage Component ================
function DevicePage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [farmId, setFarmId] = useState("farm-001"); // Default farm ID

  useEffect(() => {
    let isMounted = true;

    async function fetchDevices() {
      if (!farmId || !isMounted) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await client.queries.listAllDevices({
          farmId: farmId
        });
        
        // Handle the response - use nullish coalescing for safety
        if (response.data) {
          setDevices(response.data);
          if (response.data.length === 0) {
            setError(`No devices found for farm: ${farmId}`);
          }
        } else {
          setError("Failed to load devices");
          setDevices([]);
        }
      } catch (err) {
        console.error("Error fetching devices:", err);
        setError(`Failed to load devices for farm: ${farmId}`);
        setDevices([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDevices();

    return () => {
      isMounted = false;
    };
  }, [farmId]);

  return (
    <div className="device-container">
      <header className="device-header">
        <h1 className="device-title">IoT Devices</h1>
        <p className="device-subtitle">Manage and monitor your IoT devices</p>
      </header>
      
      {/* Farm ID Selection Form */}
      <div className="farm-id-section">
        <FarmIdForm 
          currentFarmId={farmId}
          onFarmIdChange={setFarmId}
          isLoading={loading}
        />
      </div>

      {/* Device Table */}
      <DeviceTable 
        devices={devices}
        loading={loading}
        error={error}
      />
    </div>
  );
}

export default DevicePage;