// pages/api/orders.js

export default async function handler(req, res) {
  try {
    const response = await fetch("https://b2barveshome.com/_functions/orders", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Eğer gerekirse bir API key vs varsa buraya eklenebilir
      },
    });

    const data = await response.json();
    res.status(200).json(data); // Sadece JSON dön
  } catch (error) {
    res.status(500).json({
      error: "Wix API'ye erişirken hata oluştu.",
      details: error.message,
    });
  }
}
