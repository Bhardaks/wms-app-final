import React, { useEffect, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

// Alt barkod eşleşme tablosu
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
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.items))
      .catch((err) => console.error("API hatası:", err));
  }, []);

  const startScanner = async () => {
    if (scanner) return;

    const codeReader = new BrowserMultiFormatReader();

    try {
      const devices = await codeReader.listVideoInputDevices();
      const cameraId = devices[0]?.deviceId;

      if (!cameraId) {
        alert("📷 Kamera bulunamadı.");
        return;
      }

      await codeReader.decodeFromVideoDevice(
        cameraId,
        "reader",
        (result, error) => {
          if (result) {
            const text = result.getText().trim().toUpperCase();
            console.log("📦 Okunan barkod:", text);

            let matched = false;

            for (const item of selectedOrder.lineItems) {
              const sku = item.sku;
              const altCodes = packageMappings[sku] || [];

              if (altCodes.includes(text)) {
                if (!scannedBarcodes.includes(text)) {
                  setScannedBarcodes((prev) => [...prev, text]);
                  document.getElementById("beep")?.play();
                }
                matched = true;
                break;
              }
            }

            if (!matched) {
              alert("❌ Bu barkod bu siparişte tanımlı değil.");
            }
          }
        }
      );

      setScanner(codeReader);
    } catch (err) {
      console.error("Kamera başlatma hatası:", err);
    }
  };

  const isItemComplete = (sku) => {
    const parts = packageMappings[sku];
    return parts?.every((b) => scannedBarcodes.includes(b)) || false;
  };

  return (
    <div className="p-4">
      {/* Ses uyarısı */}
      <audio id="beep" src="https://www.soundjay.com/buttons/sounds/beep-07.mp3" preload="auto"></audio>

      <h1 className="text-xl font-bold mb-4">Sipariş Listesi</h1>

      {!selectedOrder &&
        orders.map((order) => (
          <div
            key={order._id}
            className="p-3 mb-2 bg-white shadow rounded cursor-pointer"
            onClick={() => setSelectedOrder(order)}
          >
            <strong>Sipariş No:</strong> {order.number}
            <div>
              {order.billingInfo.firstName} {order.billingInfo.lastName}
            </div>
          </div>
        ))}

      {selectedOrder && (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-gray-300 rounded"
            onClick={() => {
              setSelectedOrder(null);
              setScannedBarcodes([]);
              setScanner(null);
            }}
          >
            ← Geri Dön
          </button>

          <h2 className="text-lg font-bold mb-2">
            Sipariş #{selectedOrder.number}
          </h2>

          <button
            onClick={startScanner}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Kamerayla Barkod Tara
          </button>

          {/* Kamera alanı */}
          <div
            id="reader"
            style={{
              width: "100%",
              maxWidth: "320px",
              height: "240px",
              margin: "auto",
              border: "1px solid #ccc",
              borderRadius: "6px",
              position: "relative",
              backgroundColor: "#000",
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
              }}
            ></div>
          </div>

          {/* Ürün listesi */}
          <div className="mt-4 space-y-4">
            {selectedOrder.lineItems.map((item, i) => (
              <div
                key={i}
                className={`p-3 rounded shadow ${
                  isItemComplete(item.sku) ? "bg-green-100" : "bg-white"
                }`}
              >
                <strong>{item.name}</strong>
                <div>SKU: {item.sku}</div>
                <div>Adet: {item.quantity}</div>

                {packageMappings[item.sku] && (
                  <ul className="mt-2 text-sm">
                    {packageMappings[item.sku].map((barkod, j) => (
                      <li
                        key={j}
                        className={
                          scannedBarcodes.includes(barkod)
                            ? "text-green-600 line-through"
                            : "text-red-600 font-semibold"
                        }
                      >
                        Paket Barkod: {barkod}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
