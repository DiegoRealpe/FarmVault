import { useDispatch, useSelector } from "react-redux";

import { useEffect, useMemo, useState } from "react";

import type { Schema } from "../../../amplify/data/resource";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchVisibleDevices } from "../../features/devices/deviceSlice";
import {
  fetchMetricsForDevice,
  setFrom,
  setMetricsViewMode,
  setSelectedDeviceId,
  setTo,
} from "../../features/metrics/metricsSlice";
import MetricsGraph from "./MetricsGraph";
import "./MetricsPage.css";
import MetricsTable from "./MetricsTable";

type TimeSeriesPoint = Schema["TimeSeriesPoint"]["type"];

function toDateTimeLocalValue(isoString: string): string {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs)
    .toISOString()
    .slice(0, 16);
}

function fromDateTimeLocalValue(localValue: string): string {
  return new Date(localValue).toISOString();
}

function getMetricUnit(deviceType?: string | null): string {
  if (deviceType === "TEMPERATURE") return "°F";
  if (deviceType === "MOISTURE") return "%";
  return "";
}

function MetricsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    visibleDevices,
    loadingVisibleDevices,
    visibleDevicesError,
  } = useSelector((state: RootState) => state.devices);

  const { selectedDeviceId, viewMode, from, to } = useSelector(
    (state: RootState) => state.metrics
  );

  const [points, setPoints] = useState<TimeSeriesPoint[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(
    null
  );

  const selectedDevice = useMemo(() => {
    return (
      visibleDevices.find(
        (device) => device.id === selectedDeviceId
      ) ?? null
    );
  }, [visibleDevices, selectedDeviceId]);

  const unit = getMetricUnit(selectedDevice?.type);

  const maxDateTimeLocal = toDateTimeLocalValue(
    new Date().toISOString()
  );

  useEffect(() => {
    dispatch(fetchVisibleDevices());
  }, [dispatch]);

  useEffect(() => {
    console.log("[MetricsPage] points state changed:", {
      count: points.length,
      first: points[0],
      viewMode,
      loadingMetrics,
      metricsError,
    });
  }, [points, viewMode, loadingMetrics, metricsError]);

  function handleRefreshDevices() {
    dispatch(fetchVisibleDevices());
  }

  async function handleLoadMetrics(event?: React.FormEvent) {
    event?.preventDefault();

    if (!selectedDeviceId || !from || !to) {
      setPoints([]);
      setMetricsError("Select a device and valid date range first.");
      return;
    }

    setLoadingMetrics(true);
    setMetricsError(null);

    try {
      const fetchedPoints = await dispatch(
        fetchMetricsForDevice({
          deviceId: selectedDeviceId,
          from,
          to,
        })
      ).unwrap();

      console.log(
        "[MetricsPage] fetchedPoints from thunk:",
        fetchedPoints
      );
      console.log(
        "[MetricsPage] fetchedPoints count:",
        fetchedPoints.length
      );

      setPoints(fetchedPoints);

      console.log("[MetricsPage] setPoints called:", {
        count: fetchedPoints.length,
        first: fetchedPoints[0],
      });
    } catch (error) {
      setPoints([]);
      setMetricsError(
        typeof error === "string" ? error : "Failed to fetch metrics."
      );
    } finally {
      setLoadingMetrics(false);
    }
  }

  console.log("[MetricsPage] render:", {
    viewMode,
    pointsCount: points.length,
    loadingMetrics,
    metricsError,
    selectedDevice: selectedDevice?.id,
  });

  return (
    <div className="metrics-page">
      <header className="metrics-page__header">
        <div>
          <h1 className="metrics-page__title">Metrics</h1>
          <p className="metrics-page__subtitle">
            View temperature and moisture readings from your visible
            farm devices.
          </p>
        </div>

        <button
          type="button"
          className="metrics-page__refresh-button"
          onClick={handleRefreshDevices}
        >
          ↻ Refresh devices
        </button>
      </header>

      <form
        className="metrics-page__controls card"
        onSubmit={handleLoadMetrics}
      >
        <div className="metrics-page__control-group">
          <label
            htmlFor="metrics-device-select"
            className="metrics-page__label"
          >
            Device
          </label>

          <select
            id="metrics-device-select"
            className="metrics-page__select"
            value={selectedDeviceId}
            disabled={
              loadingVisibleDevices || visibleDevices.length === 0
            }
            onChange={(event) => {
              dispatch(setSelectedDeviceId(event.target.value));
              setMetricsError(null);
            }}
          >
            <option value="">Select a device</option>

            {visibleDevices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name || device.id} · {device.type} ·{" "}
                {device.farmId}
              </option>
            ))}
          </select>

          {loadingVisibleDevices && (
            <p className="metrics-page__helper-text">
              Loading devices...
            </p>
          )}

          {visibleDevicesError && (
            <p className="metrics-page__error-text">
              {visibleDevicesError}
            </p>
          )}
        </div>

        <div className="metrics-page__control-group">
          <label
            htmlFor="metrics-from"
            className="metrics-page__label"
          >
            From
          </label>

          <input
            id="metrics-from"
            type="datetime-local"
            className="metrics-page__datetime"
            value={toDateTimeLocalValue(from)}
            max={maxDateTimeLocal}
            onChange={(event) => {
              dispatch(
                setFrom(fromDateTimeLocalValue(event.target.value))
              );
              setMetricsError(null);
            }}
          />
        </div>

        <div className="metrics-page__control-group">
          <label htmlFor="metrics-to" className="metrics-page__label">
            To
          </label>

          <input
            id="metrics-to"
            type="datetime-local"
            className="metrics-page__datetime"
            value={toDateTimeLocalValue(to)}
            max={maxDateTimeLocal}
            onChange={(event) => {
              dispatch(
                setTo(fromDateTimeLocalValue(event.target.value))
              );
              setMetricsError(null);
            }}
          />
        </div>

        <div className="metrics-page__control-group">
          <span className="metrics-page__label">View Mode</span>

          <div className="metrics-page__toggle">
            <button
              type="button"
              className={
                viewMode === "table"
                  ? "metrics-page__toggle-button metrics-page__toggle-button--active"
                  : "metrics-page__toggle-button"
              }
              onClick={() => dispatch(setMetricsViewMode("table"))}
            >
              Table
            </button>

            <button
              type="button"
              className={
                viewMode === "graph"
                  ? "metrics-page__toggle-button metrics-page__toggle-button--active"
                  : "metrics-page__toggle-button"
              }
              onClick={() => dispatch(setMetricsViewMode("graph"))}
            >
              Graph
            </button>
          </div>
        </div>

        <div className="metrics-page__control-group">
          <span className="metrics-page__label">Query</span>

          <button
            type="submit"
            className="metrics-page__refresh-button"
            disabled={
              !selectedDeviceId || !from || !to || loadingMetrics
            }
          >
            {loadingMetrics ? "Loading..." : "Load metrics"}
          </button>
        </div>
      </form>

      <section className="metrics-page__content card">
        <div className="metrics-page__content-header">
          <div>
            <h2 className="metrics-page__section-title">
              Metrics Data
            </h2>

            {selectedDevice ? (
              <p className="metrics-page__selected-device">
                {selectedDevice.name || selectedDevice.id} ·{" "}
                {selectedDevice.type} · {selectedDevice.farmId}
              </p>
            ) : (
              <p className="metrics-page__selected-device">
                Select a device to load metrics.
              </p>
            )}
          </div>

          <button
            type="button"
            className="metrics-page__refresh-button"
            disabled={
              !selectedDeviceId || !from || !to || loadingMetrics
            }
            onClick={() => void handleLoadMetrics()}
          >
            ↻ Refresh metrics
          </button>
        </div>

        {viewMode === "table" ? (
          <MetricsTable
            points={points}
            unit={unit}
            loading={loadingMetrics}
            error={metricsError}
            selectedDevice={selectedDevice}
          />
        ) : (
          <MetricsGraph
            points={points}
            unit={unit}
            loading={loadingMetrics}
            error={metricsError}
            selectedDevice={selectedDevice}
          />
        )}
      </section>
    </div>
  );
}

export default MetricsPage;
