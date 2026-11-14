const optionalServices = [
  "1800",
  "1801",
  "180A",
  "180F",
  "180D",
  "1812",
  "181A",
  "1802",
  "1803",
  "1804",
  "1805",
  "1806",
  "1807",
  "1808",
  "1809",
  "1810",
  "1811",
  "1814",
  "1816",
  "1818",
  "1819",
  "181D",
  "1825",
  "1826",
  "1828",
].map(
  (shortUuid) => `0000${shortUuid.toLowerCase()}-0000-1000-8000-00805f9b34fb`,
);

const serviceNames: Record<string, string> = {
  "00001800-0000-1000-8000-00805f9b34fb": "Generic Access",
  "00001801-0000-1000-8000-00805f9b34fb": "Generic Attribute",
  "0000180a-0000-1000-8000-00805f9b34fb": "Device Information",
  "0000180f-0000-1000-8000-00805f9b34fb": "Battery Service",
  "0000180d-0000-1000-8000-00805f9b34fb": "Heart Rate",
  "00001812-0000-1000-8000-00805f9b34fb": "Human Interface Device",
  "0000181a-0000-1000-8000-00805f9b34fb": "Environmental Sensing",
  "00001802-0000-1000-8000-00805f9b34fb": "Immediate Alert",
  "00001803-0000-1000-8000-00805f9b34fb": "Link Loss",
  "00001804-0000-1000-8000-00805f9b34fb": "Tx Power",
};

const characteristicNames: Record<string, string> = {
  "00002a00-0000-1000-8000-00805f9b34fb": "Device Name",
  "00002a01-0000-1000-8000-00805f9b34fb": "Appearance",
  "00002a02-0000-1000-8000-00805f9b34fb": "Peripheral Privacy Flag",
  "00002a04-0000-1000-8000-00805f9b34fb":
    "Peripheral Preferred Connection Parameters",
  "00002a05-0000-1000-8000-00805f9b34fb": "Service Changed",
  "00002aa6-0000-1000-8000-00805f9b34fb": "Central Address Resolution",
  "00002a19-0000-1000-8000-00805f9b34fb": "Battery Level",
  "00002a23-0000-1000-8000-00805f9b34fb": "System ID",
  "00002a24-0000-1000-8000-00805f9b34fb": "Model Number String",
  "00002a25-0000-1000-8000-00805f9b34fb": "Serial Number String",
  "00002a26-0000-1000-8000-00805f9b34fb": "Firmware Revision String",
  "00002a27-0000-1000-8000-00805f9b34fb": "Hardware Revision String",
  "00002a28-0000-1000-8000-00805f9b34fb": "Software Revision String",
  "00002a29-0000-1000-8000-00805f9b34fb": "Manufacturer Name String",
  "00002a37-0000-1000-8000-00805f9b34fb": "Heart Rate Measurement",
  "00002a38-0000-1000-8000-00805f9b34fb": "Body Sensor Location",
  "00002a6e-0000-1000-8000-00805f9b34fb": "Temperature",
  "00002a6f-0000-1000-8000-00805f9b34fb": "Humidity",
};

function shortUuid(uuid: string) {
  const match = uuid.match(/^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/i);
  return match ? `0x${match[1].toUpperCase()}` : uuid;
}

function serviceContext(uuid: string) {
  const contexts: Record<string, string> = {
    "00001800-0000-1000-8000-00805f9b34fb":
      "Core Bluetooth access information; commonly present on BLE devices.",
    "00001801-0000-1000-8000-00805f9b34fb":
      "Core GATT service management; commonly present on BLE devices.",
    "0000180a-0000-1000-8000-00805f9b34fb":
      "May expose manufacturer, model or firmware metadata.",
    "0000180f-0000-1000-8000-00805f9b34fb":
      "Battery status profile used by many ordinary devices.",
    "0000180d-0000-1000-8000-00805f9b34fb":
      "Common fitness and heart-rate monitor profile.",
    "00001812-0000-1000-8000-00805f9b34fb":
      "Human-interface peripherals such as keyboards or pointing devices.",
    "0000181a-0000-1000-8000-00805f9b34fb": "Environmental sensor profile.",
    "00001802-0000-1000-8000-00805f9b34fb":
      "Standard alert profile; not a tracker verdict.",
    "00001803-0000-1000-8000-00805f9b34fb":
      "Standard link-loss alert profile; not a tracker verdict.",
    "00001804-0000-1000-8000-00805f9b34fb":
      "Transmit-power information profile.",
  };
  return (
    contexts[uuid] ||
    "No standard interpretation is included in this version; it may be a vendor-specific or less common service."
  );
}

export {
  optionalServices,
  serviceNames,
  characteristicNames,
  shortUuid,
  serviceContext,
};
