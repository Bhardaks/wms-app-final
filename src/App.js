import React, { useEffect, useState } from "react";
import {
  BrowserMultiFormatReader,
} from "@zxing/library";

// ✅ Ürünlere ait alt barkod eşleştirme listesi burada tutulur
const packageMappings = {
  "BOH-YT-D-BE-01-B": [
    "BOH010325253010",
    "BOH010326253010",
    "BOH010327253010",
    "BOH010328253010",
    "BOH010329253010",
    "BOH010330253010",
    "BOH010331253010",
  ],
};

export default function App() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [scannerStarted, setScannerStarted] = useState(false);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.items))
      .catch((err) => console.error("API Hatası:", err));
  }, []);

  const startScanner = () => {
    if (scannerStarted) return;

    const codeReader = new BrowserMultiFormatReader();

    codeReader.listVideoInputDevices().then((videoInputDevices) => {
      const selectedDeviceId = videoInputDevices[0]?.deviceId;
      if (selectedDeviceId) {
        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          "reader",
          (result, err) => {
            if (result) {
              const text = result.getText().trim().toUpperCase();
              console.log("📦 Okunan Barkod:", text);
              setScannedBarcodes((prev) => [...new Set([...prev, text])]);
            }
          }
        );
        setScannerStarted(true);
      }
    });
  };

  const isItemScanned = (sku) => {
    const packages = packageMappings[sku];
    if (!packages) return scannedBarcodes.includes(sku);
    return packages.every((barkod) =>
      scannedBarcodes.includes(barkod.toUpperCase())
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Sipariş Listesi</h1>

      {!selectedOrder && (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li
              key={order._id}
              className="p-3 rounded shadow bg-white cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="font-semibold">Sipariş No: {order.number}</div>
              <div>
                {order.billingInfo?.firstName} {order.billingInfo?.lastName}
              </div>
            </li>
          ))}
        </ul>
      )}

      {selectedOrder && (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-gray-300 rounded"
            onClick={() => setSelectedOrder(null)}
          >
            ← Geri Dön
          </button>

          <h2 className="text-lg font-bold mb-2">
            Sipariş #{selectedOrder.number}
          </h2>
          <button
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={startScanner}
          >
            Kamerayla Barkod Tara
          </button>
          <div
            id="reader"
            className="mb-4 border border-gray-400 rounded"
            style={{ width: "100%", maxWidth: "400px", height: "350px", margin: "auto" }}
          />

          <ul className="space-y-2">
            {selectedOrder.lineItems.map((item, index) => (
              <li
                key={index}
                className={`p-3 rounded shadow ${
                  isItemScanned(item.sku) ? "bg-green-100" : "bg-white"
                }`}
              >
                <div className="font-semibold">{item.name}</div>
                <div>Barkod (SKU): {item.sku}</div>
                <div>Adet: {item.quantity}</div>
                {packageMappings[item.sku] && (
                  <ul className="mt-2 text-sm">
                    {packageMappings[item.sku].map((barkod, i) => (
                      <li
                        key={i}
                        className={
                          scannedBarcodes.includes(barkod.toUpperCase())
                            ? "text-green-600"
                            : "text-red-500 font-semibold"
                        }
                      >
                        Paket Barkod: {barkod}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
