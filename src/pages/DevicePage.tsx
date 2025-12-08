import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import "./DevicePage.css";
import DeviceTable from "../components/DeviceTable";
import FarmIdForm from "../components/FarmIdForm";

const client = generateClient<Schema>();

// Type for our devices
// type DeviceType = Schema["IoTDeviceView"]["type"];

function DevicePage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [farmId, setFarmId] = useState("farm-001"); // Default farm ID

  useEffect(() => {
    let isMounted = true;

    async function fetchDevices() {
      if (!farmId || !isMounted) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await client.queries.listAllDevices({
          farmId: farmId
        });
        
        if (response.data) {
          setDevices(response.data);
          if (response.data.length === 0) {
            setError(`No devices found for farm: ${farmId}`);
          }
        } else {
          setError("Failed to load devices");
          setDevices([]);
        }
      } catch (err) {
        console.error("Error fetching devices:", err);
        setError(`Failed to load devices for farm: ${farmId}`);
        setDevices([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDevices();

    return () => {
      isMounted = false;
    };
  }, [farmId]);

  return (
    <div className="device-container">
      <header className="device-header">
        <h1 className="device-title">IoT Devices</h1>
        <p className="device-subtitle">Manage and monitor your IoT devices</p>
      </header>
      
      {/* Farm ID Selection Form */}
      <div className="farm-id-section">
        <FarmIdForm 
          currentFarmId={farmId}
          onFarmIdChange={setFarmId}
          isLoading={loading}
        />
      </div>

      {/* Device Table */}
      <DeviceTable 
        devices={devices}
        loading={loading}
        error={error}
      />
    </div>
  );
}

export default DevicePage;