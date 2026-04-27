import type { Schema } from "../../../amplify/data/resource";

type TimeSeriesPoint = Schema["TimeSeriesPoint"]["type"];

interface MetricsTableProps {
  points: TimeSeriesPoint[];
  unit: string;
  loading: boolean;
  error: string | null;
  // selectedDevice is still accepted but NOT used for rendering
  selectedDevice: any;  // or IoTDevice | null, we just ignore it
}

function MetricsTable({ points, unit, loading, error }: MetricsTableProps) {
  if (loading) {
    return <div>Loading metrics...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  if (!points || points.length === 0) {
    return <div>No metrics data available for the selected device and time range.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ccc" }}>
              Timestamp
            </th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ccc" }}>
              Value ({unit})
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, idx) => (
            <tr key={point.timestamp ?? idx}>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {new Date(point.timestamp).toLocaleString()}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {typeof point.value === "number" ? point.value.toFixed(2) : point.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MetricsTable;