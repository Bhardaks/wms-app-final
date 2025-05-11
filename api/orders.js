// pages/api/orders.js

export default async function handler(req, res) {
  try {
    const response = await fetch("https://b2barveshome.com/_functions/orders");
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: "Wix API'ye erişirken hata oluştu.",
      details: error.message,
    });
  }
}
