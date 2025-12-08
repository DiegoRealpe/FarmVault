// pages/DevicePage.tsx
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import "./DevicePage.css";

const client = generateClient<Schema>();

function DevicePage() {
  
  // const [devices, setDevices] = useState<Array<Schema["IoTDeviceView"]["type"]>>([]);
  const [devices, setDevices] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // TODO: Replace with actual farmId from your app state/context
  const farmId = "farm-001"; // Replace with actual farm ID logic

  useEffect(() => {
    async function fetchDevices() {
      if (!farmId) {
        setError("No farm ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await client.queries.listAllDevices({
          farmId: farmId
        });
        
        if (response.data) {
          setDevices(response.data);
        } else {
          setError("No devices found");
        }
      } catch (err) {
        console.error("Error fetching devices:", err);
        setError("Failed to load devices. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchDevices();
  }, [farmId]);

  if (loading) {
    return (
      <div className="device-container">
        <header className="device-header">
          <h1 className="device-title">IoT Devices</h1>
        </header>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading devices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="device-container">
        <header className="device-header">
          <h1 className="device-title">IoT Devices</h1>
        </header>
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="device-container">
      <header className="device-header">
        <h1 className="device-title">IoT Devices</h1>
        <p className="device-subtitle">Manage and monitor your IoT devices</p>
      </header>
      
      {devices.length === 0 ? (
        <div className="empty-state">
          <p>No devices found for this farm.</p>
          <button 
            onClick={() => window.location.reload()}
            className="refresh-button"
          >
            Refresh
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

export default DevicePage;