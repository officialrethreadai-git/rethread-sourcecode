import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

const listings = [
  {
    id: randomUUID(),
    title: "Durable Patchwork Cargo Shorts",
    materialType: "Denim",
    dimensions: "0.8m x 0.5m",
    weightKg: 1.2,
    priceNaira: 14700,
    vendor: "Lagos Circular Weaving",
    imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    title: "Symmetrical Aso-Oke Hair Bandana",
    materialType: "Aso-Oke",
    dimensions: "0.4m x 0.3m",
    weightKg: 0.3,
    priceNaira: 18000,
    vendor: "Ikeja Green Atelier",
    imageUrl: null,
    createdAt: new Date().toISOString(),
  },
];

router.get("/", (_req, res) => {
  res.json(listings);
});

router.post("/", (req, res) => {
  const { title, materialType, dimensions, weightKg, priceNaira, vendor, imageUrl } = req.body;

  if (!title || !priceNaira) {
    return res.status(400).json({ error: "title and priceNaira are required" });
  }

  const listing = {
    id: randomUUID(),
    title,
    materialType: materialType || "Unspecified",
    dimensions: dimensions || null,
    weightKg: weightKg || null,
    priceNaira,
    vendor: vendor || "You",
    imageUrl: imageUrl || null,
    createdAt: new Date().toISOString(),
  };

  listings.unshift(listing);
  res.status(201).json(listing);
});

export default router;
