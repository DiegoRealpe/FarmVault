import type { Schema } from "../../../amplify/data/resource";
import { formatDate } from "../../utils/utils";
import "./MetricsTable.css";

type TimeSeriesPoint = Schema["TimeSeriesPoint"]["type"];
type IoTDevice = Schema["IoTDevice"]["type"];

interface MetricsTableProps {
  points: TimeSeriesPoint[];
  unit: string;
  loading: boolean;
  error: string | null;
  selectedDevice: IoTDevice | null;
}

function MetricsTable({
  points,
  unit,
  loading,
  error,
  selectedDevice,
}: MetricsTableProps) {

  console.log("[MetricsTable] received props:", {
    pointsCount: points.length,
    firstPoint: points[0],
    loading,
    error,
    selectedDevice: selectedDevice?.id,
    unit,
  });

  if (loading) {
    return (
      <div className="metrics-table-loading">
        <div className="metrics-table-spinner"></div>
        <p>Loading metrics...</p>
      </div>
    );
  }

  if (!selectedDevice) {
    return (
      <div className="metrics-table-empty-state">
        <p>Select a device to view metrics.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="metrics-table-error">
        <p className="metrics-table-error-message">{error}</p>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="metrics-table-empty-state">
        <p>
          No metric points returned for this device and time range.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="metrics-table-controls">
        <span className="metrics-table-count">
          {points.length} reading{points.length !== 1 ? "s" : ""}
        </span>

        <span className="metrics-table-device-type">
          {selectedDevice.type} {unit ? `(${unit})` : ""}
        </span>
      </div>

      <div className="metrics-table-wrapper">
        <table className="metrics-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Value</th>
              <th>Unit</th>
            </tr>
          </thead>

          <tbody>
            {points.map((point, index) => (
              <tr key={`${point.timestamp}-${index}`}>
                <td>
                  <span className="metrics-table-date">
                    {formatDate(point.timestamp)}
                  </span>
                </td>

                <td>
                  <span className="metrics-table-value">
                    {typeof point.value === "number"
                      ? point.value.toFixed(2)
                      : "N/A"}
                  </span>
                </td>

                <td>
                  <span className="metrics-table-unit">
                    {unit || "N/A"}
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

export default MetricsTable;
