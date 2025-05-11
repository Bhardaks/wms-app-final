// React tabanlı WMS mobil web uygulaması + proxy üzerinden CORS bypass
// Sipariş listesini çeker, seçilen siparişi detaylı gösterir, kamera ile barkod okutma desteği içerir

import React, { useEffect, useState, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

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
  // Diğer ürünler buraya eklenebilir
};

export default function App() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [scanner, setScanner] = useState(null);
  const readerRef = useRef(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.items))
      .catch((err) => console.error("API Hatası:", err));
  }, []);

  const startScanner = () => {
    if (!scanner && readerRef.current) {
      const codeReader = new BrowserMultiFormatReader();
      codeReader
        .listVideoInputDevices()
        .then((videoInputDevices) => {
          if (videoInputDevices.length > 0) {
            codeReader.decodeFromVideoDevice(
              videoInputDevices[0].deviceId,
              readerRef.current,
              (result, err) => {
                if (result) {
                  onScanSuccess(result.getText());
                }
              }
            );
            setScanner(codeReader);
          }
        })
        .catch((err) => console.error("Kamera hatası:", err));
    }
  };

  const onScanSuccess = (decodedText) => {
    setScannedBarcodes((prev) => [...new Set([...prev, decodedText])]);
  };

  const isItemScanned = (sku) => {
    const packages = packageMappings[sku];
    if (!packages) return scannedBarcodes.includes(sku);
    return packages.every((barkod) => scannedBarcodes.includes(barkod));
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
          <div ref={readerRef} className="mb-4" style={{ width: "100%" }} />

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
                          scannedBarcodes.includes(barkod)
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
