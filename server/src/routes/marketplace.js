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
    vendorId: null,
    imageUrl: null,
    status: "available",
    buyerId: null,
    buyerName: null,
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
    vendorId: null,
    imageUrl: null,
    status: "available",
    buyerId: null,
    buyerName: null,
    createdAt: new Date().toISOString(),
  },
];

// Designer requests — what buyers are actively looking for.
// Tailors browse this to know what to list or bring to market.
const requests = [
  {
    id: randomUUID(),
    title: "Need Ankara fabric — blue & gold tones",
    materialType: "Ankara",
    colorNotes: "Blue and gold geometric print preferred. Any size from 1 yard upward.",
    quantityNeeded: "2 yards",
    budgetNaira: 9000,
    designerName: "Adunola Crafts",
    designerId: null,
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    title: "Aso-Oke scraps for gele headwrap",
    materialType: "Aso-Oke",
    colorNotes: "Etu (blue/white) or Alaari (red) preferred. Even small pieces work.",
    quantityNeeded: "0.5 yards",
    budgetNaira: 5500,
    designerName: "Temi Fabric Studio",
    designerId: null,
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    title: "Denim scraps for patchwork jacket",
    materialType: "Denim",
    colorNotes: "Any shade of blue or black denim. Minimum 20cm x 20cm per piece.",
    quantityNeeded: "Multiple pieces",
    budgetNaira: 4000,
    designerName: "GreenStitch Lagos",
    designerId: null,
    status: "open",
    createdAt: new Date().toISOString(),
  },
];

// GET /api/marketplace — open to everyone
router.get("/", (_req, res) => {
  res.json(listings);
});

// GET /api/marketplace/requests — open to everyone
router.get("/requests", (_req, res) => {
  res.json(requests);
});

// GET /api/marketplace/mine — logged-in user's dashboard
router.get("/mine", (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Sign in to view your dashboard" });
  }
  res.json({
    listings: listings.filter((l) => l.vendorId === req.session.userId),
    purchases: listings.filter((l) => l.buyerId === req.session.userId),
    requests: requests.filter((r) => r.designerId === req.session.userId),
  });
});

// POST /api/marketplace — list a fabric item (approved users only)
router.post("/", (req, res) => {
  if (!req.session?.aiApproved) {
    return res.status(403).json({
      error: "Sign in to an approved account to list items",
      needsAuth: true,
    });
  }

  const { title, materialType, dimensions, weightKg, priceNaira, imageUrl } = req.body;
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
    vendor: req.session.userName,
    vendorId: req.session.userId,
    imageUrl: imageUrl || null,
    status: "available",
    buyerId: null,
    buyerName: null,
    createdAt: new Date().toISOString(),
  };

  listings.unshift(listing);
  res.status(201).json(listing);
});

// POST /api/marketplace/requests — post a fabric need (approved users only)
router.post("/requests", (req, res) => {
  if (!req.session?.aiApproved) {
    return res.status(403).json({
      error: "Sign in to an approved account to post a request",
      needsAuth: true,
    });
  }

  const { title, materialType, colorNotes, quantityNeeded, budgetNaira } = req.body;
  if (!title || !materialType) {
    return res.status(400).json({ error: "title and materialType are required" });
  }

  const request = {
    id: randomUUID(),
    title,
    materialType,
    colorNotes: colorNotes || null,
    quantityNeeded: quantityNeeded || null,
    budgetNaira: budgetNaira || null,
    designerName: req.session.userName,
    designerId: req.session.userId,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  requests.unshift(request);
  res.status(201).json(request);
});

// POST /api/marketplace/:id/reserve — claim a listing (approved users only)
router.post("/:id/reserve", (req, res) => {
  if (!req.session?.aiApproved) {
    return res.status(403).json({
      error: "Sign in to an approved account to reserve items",
      needsAuth: true,
    });
  }

  const listing = listings.find((l) => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.status === "reserved") return res.status(409).json({ error: "This item is already reserved" });
  if (listing.vendorId === req.session.userId) {
    return res.status(400).json({ error: "You can't reserve your own listing" });
  }

  listing.status = "reserved";
  listing.buyerId = req.session.userId;
  listing.buyerName = req.session.userName;
  res.json(listing);
});

export default router;
