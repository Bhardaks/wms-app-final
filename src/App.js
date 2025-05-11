// WMS Kamera ile Barkod Eşleştirme Sistemi - Velo (Wix)

import { session } from 'wix-storage';
import wixWindow from 'wix-window';
import wixData from 'wix-data';

let matchedBarcodes = [];

$w.onReady(function () {
  $w("#camera1").start();
  $w("#camera1").onBarcodeScanned((barcode) => {
    console.log("Okunan barkod:", barcode);
    checkBarcode(barcode.trim());
  });
});

function checkBarcode(scanned) {
  const mainSKU = session.getItem("selectedMainSKU");
  if (!mainSKU) {
    showError("Ana ürün seçilmedi.");
    return;
  }

  wixData.query("SubBarcodes")
    .eq("mainSKU", mainSKU)
    .find()
    .then((res) => {
      const subBarcodes = res.items.map(item => item.subBarcode.trim());
      console.log("Alt barkodlar:", subBarcodes);

      if (subBarcodes.includes(scanned)) {
        if (!matchedBarcodes.includes(scanned)) {
          matchedBarcodes.push(scanned);
          markAsMatched(scanned);
          playSuccessSound();
        } else {
          showError("Bu barkod zaten okutuldu.");
        }
      } else {
        showError("Yanlış barkod okutuldu.");
        playErrorSound();
      }
    })
    .catch((err) => {
      console.error("Barkod verisi alınırken hata:", err);
      showError("Veri alınamadı.");
    });
}

function markAsMatched(barcode) {
  $w("#repeater1").forEachItem(($item, itemData) => {
    if (itemData.subBarcode && itemData.subBarcode.trim() === barcode) {
      $item("#textBarcode").style.textDecoration = "line-through";
    }
  });
}

function showError(message) {
  $w("#errorText").text = message;
  $w("#errorText").show("fade");
  setTimeout(() => $w("#errorText").hide("fade"), 3000);
}

function playSuccessSound() {
  $w("#successSound").play();
}

function playErrorSound() {
  $w("#errorSound").play();
}
