
import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function App() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    fetch("https://b2barveshome.com/_functions/orders")


      .then((res) => res.json())
      .then((data) => setOrders(data.items));
  }, []);

  const startScanner = () => {
    if (!scanner) {
      const newScanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: 250,
      });
      newScanner.render(onScanSuccess, onScanFailure);
      setScanner(newScanner);
    }
  };

  const onScanSuccess = (decodedText) => {
    setScannedBarcodes((prev) => [...new Set([...prev, decodedText])]);
  };

  const onScanFailure = (error) => {
    // silently fail
  };

  const isItemScanned = (sku) => scannedBarcodes.includes(sku);

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
          <div id="reader" className="mb-4" />

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
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
