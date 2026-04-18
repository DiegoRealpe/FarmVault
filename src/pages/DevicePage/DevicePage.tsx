import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVisibleDevices } from "../../features/devices/deviceSlice";
import "./DevicePage.css";
import type { AppDispatch, RootState } from "../../app/store";
import DeviceTable from "./DeviceTable";

function DevicePage() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    visibleDevices,
    loadingVisibleDevices,
    visibleDevicesError,
  } = useSelector((state: RootState) => state.devices);

  useEffect(() => {
    dispatch(fetchVisibleDevices());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchVisibleDevices());
  };

  return (
    <div className="device-container">
      <header className="device-header">
        <h1 className="device-title">IoT Devices</h1>
        <p className="device-subtitle">View and monitor the devices you can access</p>
      </header>

      <DeviceTable
        devices={visibleDevices}
        loading={loadingVisibleDevices}
        error={visibleDevicesError}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

export default DevicePage;