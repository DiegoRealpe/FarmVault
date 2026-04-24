import type { Schema } from "../../../amplify/data/resource";
import "./MetricsGraph.css";

type TimeSeriesPoint = Schema["TimeSeriesPoint"]["type"];
type IoTDevice = Schema["IoTDevice"]["type"];

interface MetricsGraphProps {
  points: TimeSeriesPoint[];
  unit: string;
  loading: boolean;
  error: string | null;
  selectedDevice: IoTDevice | null;
}

function MetricsGraph({
  points,
  unit,
  loading,
  error,
  selectedDevice,
}: MetricsGraphProps) {
  return (
    <div className="metrics-graph-placeholder">
      <h3 className="metrics-graph-placeholder__title">Graph View</h3>

      <p className="metrics-graph-placeholder__text">
        Graph rendering will be added after the table flow is deployed
        and tested.
      </p>

      <div className="metrics-graph-placeholder__meta">
        <span>
          Device:{" "}
          {selectedDevice?.name ||
            selectedDevice?.id ||
            "None selected"}
        </span>
        <span>Readings: {points.length}</span>
        <span>Unit: {unit || "N/A"}</span>
        <span>
          Status: {loading ? "Loading" : error ? "Error" : "Ready"}
        </span>
      </div>

      {error && (
        <p className="metrics-graph-placeholder__error">{error}</p>
      )}
    </div>
  );
}

export default MetricsGraph;
