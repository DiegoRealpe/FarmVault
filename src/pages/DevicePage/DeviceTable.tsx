import { useMemo, useState } from "react";
import type { Schema } from "../../../amplify/data/resource";
import "./DevicePage.css";
import { formatDate } from "../../utils/utils";

type IoTDevice = Schema["IoTDevice"]["type"];

interface DeviceTableProps {
  devices: IoTDevice[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function DeviceTable({
  devices,
  loading,
  error,
  onRefresh,
}: DeviceTableProps) {
  const [selectedFarmId, setSelectedFarmId] = useState("");

  const farmOptions = useMemo(() => {
    return [...new Set(devices.map((device) => device.farmId).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [devices]);

  const filteredDevices = useMemo(() => {
    if (!selectedFarmId) {
      return devices;
    }

    return devices.filter((device) => device.farmId === selectedFarmId);
  }, [devices, selectedFarmId]);

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
        <p>No devices available.</p>
        <button onClick={onRefresh} className="refresh-button">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="device-controls">
        <div className="device-controls-left">
          <span className="device-count">
            {filteredDevices.length} device{filteredDevices.length !== 1 ? "s" : ""}
          </span>

          <label className="device-filter-label">
            Farm
            <select
              value={selectedFarmId}
              onChange={(event) => setSelectedFarmId(event.target.value)}
              className="device-farm-filter"
            >
              <option value="">All farms</option>
              {farmOptions.map((farmId) => (
                <option key={farmId} value={farmId}>
                  {farmId}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button onClick={onRefresh} className="refresh-small">
          ↻ Refresh
        </button>
      </div>

      {filteredDevices.length === 0 ? (
        <div className="empty-state">
          <p>No devices found for the selected farm.</p>
        </div>
      ) : (
        <div className="device-table-container">
          <table className="device-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Farm</th>
                <th>Device EUI</th>
                <th>Type</th>
                <th>Location</th>
                <th>Gateway</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => (
                <tr key={device.id}>
                  <td>
                    <div className="device-name">
                      {device.name || "Unnamed Device"}
                    </div>
                    {device.description && (
                      <div className="device-description">
                        {device.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <code className="device-farm-id">{device.farmId}</code>
                  </td>
                  <td>
                    <code className="device-eui">{device.devEui}</code>
                  </td>
                  <td>
                    <span
                      className={`type-badge type-${
                        device.type?.toLowerCase() || "default"
                      }`}
                    >
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
      )}
    </>
  );
}

export default DeviceTable;