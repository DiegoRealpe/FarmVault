import "./MetricsPage.css";

function MetricsPage() {
  return (
    <div className="metrics-page">
      <div className="metrics-page__header">
        <div>
          <h1 className="metrics-page__title">Metrics</h1>
          <p className="metrics-page__subtitle">
            View farm IoT device metrics. Table and graph modes will be added here.
          </p>
        </div>
      </div>

      <section className="metrics-page__controls card">
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
            disabled
            defaultValue=""
          >
            <option value="" disabled>
              Select a device (coming soon)
            </option>
          </select>
        </div>

        <div className="metrics-page__control-group">
          <label className="metrics-page__label">View Mode</label>
          <div className="metrics-page__toggle-placeholder">
            Table / Graph toggle coming soon
          </div>
        </div>
      </section>

      <section className="metrics-page__content card">
        <div className="metrics-page__empty-state">
          <h2 className="metrics-page__section-title">Metrics Data</h2>
          <p className="metrics-page__empty-text">
            This area will display data returned from <code>getFarmIotData</code>.
          </p>
          <p className="metrics-page__empty-text">
            The device selector will be populated from <code>listVisibleDevices</code>.
          </p>
        </div>
      </section>
    </div>
  );
}

export default MetricsPage;