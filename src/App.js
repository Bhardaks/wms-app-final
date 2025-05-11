import React, { useEffect, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

// Barkod eşleşme tablosu (ana SKU'ya bağlı alt barkodlar)
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

    codeReader.listVideoInputDevices().then((devices) => {
      const cameraId = devices[0]?.deviceId;
      if (!cameraId) return alert("📷 Kamera bulunamadı.");

      codeReader.decodeFromVideoDevice(cameraId, "reader", (result) => {
        if (result) {
          const clean = result.getText().trim().toUpperCase();
          console.log("📦 Okunan Barkod:", clean);

          let matched = false;

          if (selectedOrder) {
            for (const item of selectedOrder.lineItems) {
              const sku = item.sku;
              const altBarcodes = packageMappings[sku] || [];

              if (altBarcodes.map(b => b.toUpperCase()).includes(clean)) {
                matched = true;
                if (!scannedBarcodes.includes(clean)) {
                  setScannedBarcodes(prev => [...prev, clean]);
                  document.getElementById("beep")?.play();
                }
                break;
              }
            }
          }

          if (!matched) {
            alert("❌ Bu barkod bu siparişte tanımlı değil!");
          }
        }
      });

      setScannerStarted(true);
    });
  };

  const isItemScanned = (sku) => {
    const altBarcodes = packageMappings[sku];
    if (!altBarcodes) return false;
    return altBarcodes.every(b =>
      scannedBarcodes.includes(b.toUpperCase())
    );
  };

  return (
    <div className="p-4">
      <audio
        id="beep"
        src="https://www.soundjay.com/buttons/sounds/beep-07.mp3"
        preload="auto"
      ></audio>

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
            onClick={() => setSelectedOrder(null)}
            className="mb-4 px-4 py-2 bg-gray-300 rounded"
          >
            ← Geri Dön
          </button>

          <h2 className="text-lg font-bold mb-2">
            Sipariş #{selectedOrder.number}
          </h2>

          <button
            onClick={startScanner}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Kamerayla Barkod Tara
          </button>

          {/* Kamera ekranı */}
          <div
            id="reader"
            className="mb-4 border border-gray-400 rounded"
            style={{
              width: "100%",
              maxWidth: "320px",
              height: "240px",
              margin: "auto",
              position: "relative",
              backgroundColor: "#000",
              overflow: "visible",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "160px",
                height: "60px",
                transform: "translate(-50%, -50%)",
                border: "2px solid limegreen",
                borderRadius: "4px",
                zIndex: 2,
                pointerEvents: "none",
              }}
            ></div>
          </div>

          {/* Sipariş ürünleri ve barkod eşleşmeleri */}
          <ul className="space-y-2">
            {selectedOrder.lineItems.map((item, index) => (
              <li
                key={index}
                className={`p-3 rounded shadow ${
                  isItemScanned(item.sku)
                    ? "bg-green-100"
                    : "bg-white"
                }`}
              >
                <div className="font-semibold">{item.name}</div>
                <div>Barkod (SKU): {item.sku}</div>
                <div>Adet: {item.quantity}</div>

                {packageMappings[item.sku] && (
                  <ul className="mt-2 text-sm">
                    {packageMappings[item.sku].map((barkod, i) => (
                      <li key={i}>
                        <span
                          style={{
                            textDecoration: scannedBarcodes.includes(barkod.toUpperCase())
                              ? "line-through"
                              : "none",
                          }}
                          className={
                            scannedBarcodes.includes(barkod.toUpperCase())
                              ? "text-green-600"
                              : "text-red-500 font-semibold"
                          }
                        >
                          Paket Barkod: {barkod}
                        </span>
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
