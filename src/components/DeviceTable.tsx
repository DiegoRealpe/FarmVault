import type { Schema } from '../../amplify/data/resource';
import '../pages/DevicePage.css';

type Device = Schema['IoTDeviceView']['type'];

interface DeviceTableProps {
  devices: Device[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

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

function DeviceTable({ devices, loading, error, onRefresh }: DeviceTableProps) {
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
          onClick={onRefresh}
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
          onClick={onRefresh}
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

export default DeviceTable;