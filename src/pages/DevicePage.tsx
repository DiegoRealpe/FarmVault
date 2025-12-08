import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDevices, setFarmId } from "../features/devices/deviceSlice";
import "./DevicePage.css";
import DeviceTable from "../components/DeviceTable";
import FarmIdForm from "../components/FarmIdForm";
import { AppDispatch, RootState } from "../app/store";

function DevicePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { devices, farmId, loading, error } = useSelector((state: RootState) => state.devices);

  useEffect(() => {
    if (!farmId) return;
    dispatch(fetchDevices(farmId));
  }, [dispatch, farmId]);

  const handleRefresh = () => {
    dispatch(fetchDevices(farmId));
  };

  const handleFarmIdChange = (newFarmId: string) => {
    dispatch(setFarmId(newFarmId));
  };

  return (
    <div className="device-container">
      <header className="device-header">
        <h1 className="device-title">IoT Devices</h1>
        <p className="device-subtitle">Manage and monitor your IoT devices</p>
      </header>
      
      <div className="farm-id-section">
        <FarmIdForm 
          currentFarmId={farmId}
          onFarmIdChange={handleFarmIdChange}
          isLoading={loading}
        />
      </div>

      <DeviceTable 
        devices={devices}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

export default DevicePage;