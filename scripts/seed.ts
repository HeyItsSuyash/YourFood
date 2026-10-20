import * as dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import {
  organizations,
  locations,
  users,
  memberships,
  categories,
  menuItems,
  modifierGroups,
  modifierOptions,
  tables,
  loyaltyCampaigns,
  notificationTemplates,
} from "../src/db/schema";
import bcrypt from "bcryptjs";
import { generateQrToken } from "../src/lib/utils";

async function runSeed() {
  console.log("🌱 Starting production-grade seed for YourFood...");

  // 1. Create Organization: "L'Atelier Bistro & Craft Bar"
  const [org] = await db
    .insert(organizations)
    .values({
      name: "L'Atelier Gourmet Bistro",
      slug: "latelier",
      brandColor: "#BE123C",
      currency: "USD",
      taxPercentage: 8,
      serviceChargePercentage: 5,
      operatingHours: {
        monday: { open: "11:00", close: "23:00", closed: false },
        tuesday: { open: "11:00", close: "23:00", closed: false },
        wednesday: { open: "11:00", close: "23:00", closed: false },
        thursday: { open: "11:00", close: "23:00", closed: false },
        friday: { open: "11:00", close: "01:00", closed: false },
        saturday: { open: "10:00", close: "01:00", closed: false },
        sunday: { open: "10:00", close: "22:00", closed: false },
      },
    })
    .returning();

  console.log("Created Organization:", org.name, org.id);

  // 2. Locations
  const [location] = await db
    .insert(locations)
    .values({
      orgId: org.id,
      name: "Flagship Downtown",
      address: "452 Grand Avenue, Suite 100, New York, NY",
      phone: "+1 (212) 555-0199",
      isActive: true,
    })
    .returning();

  console.log("Created Location:", location.name);

  // 3. Users with Roles
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const [adminUser] = await db
    .insert(users)
    .values({
      email: "owner@latelier.com",
      passwordHash,
      fullName: "Julian Vance",
      phone: "+1 212 555 0101",
    })
    .returning();

  await db.insert(memberships).values({
    orgId: org.id,
    userId: adminUser.id,
    locationId: location.id,
    role: "owner",
    isActive: true,
  });

  const [kitchenUser] = await db
    .insert(users)
    .values({
      email: "kitchen@latelier.com",
      passwordHash,
      fullName: "Chef Marco Pierre",
      phone: "+1 212 555 0102",
    })
    .returning();

  await db.insert(memberships).values({
    orgId: org.id,
    userId: kitchenUser.id,
    locationId: location.id,
    role: "kitchen",
    isActive: true,
  });

  const [waiterUser] = await db
    .insert(users)
    .values({
      email: "service@latelier.com",
      passwordHash,
      fullName: "Elena Rostova",
      phone: "+1 212 555 0103",
    })
    .returning();

  await db.insert(memberships).values({
    orgId: org.id,
    userId: waiterUser.id,
    locationId: location.id,
    role: "waiter",
    isActive: true,
  });

  console.log("Created Users: Owner, Kitchen Staff, Service Waiter (Password: Password123!)");

  // 4. Tables with Distinct QR Tokens
  const tableData = [
    { tableNumber: "T-01 (Window)", capacity: 2, qrToken: "table-01-downtown" },
    { tableNumber: "T-02 (Booth)", capacity: 4, qrToken: "table-02-downtown" },
    { tableNumber: "T-03 (Center)", capacity: 4, qrToken: "table-03-downtown" },
    { tableNumber: "T-04 (Patio)", capacity: 6, qrToken: "table-04-downtown" },
    { tableNumber: "Bar 01", capacity: 1, qrToken: "bar-01-downtown" },
  ];

  for (const t of tableData) {
    await db.insert(tables).values({
      orgId: org.id,
      locationId: location.id,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      qrToken: t.qrToken,
      status: "available",
    });
  }
  console.log("Created 5 Tables with predictable QR tokens");

  // 5. Menu Categories
  const [startersCat] = await db
    .insert(categories)
    .values({
      orgId: org.id,
      name: "Artisan Starters",
      description: "Small plates crafted with seasonal harvest and house cures",
      sortOrder: 1,
    })
    .returning();

  const [mainsCat] = await db
    .insert(categories)
    .values({
      orgId: org.id,
      name: "Signature Mains",
      description: "Charcoal grilled meats and freshly rolled pasta",
      sortOrder: 2,
    })
    .returning();

  const [drinksCat] = await db
    .insert(categories)
    .values({
      orgId: org.id,
      name: "Craft Cocktails & Elixirs",
      description: "Botanical mixes and sommelier selected pairings",
      sortOrder: 3,
    })
    .returning();

  const [dessertCat] = await db
    .insert(categories)
    .values({
      orgId: org.id,
      name: "Pâtisserie",
      description: "French classics with modern textures",
      sortOrder: 4,
    })
    .returning();

  // 6. Menu Items
  // Burrata
  const [burrata] = await db
    .insert(menuItems)
    .values({
      orgId: org.id,
      categoryId: startersCat.id,
      name: "Truffled Puglia Burrata",
      description: "Heirloom golden tomatoes, aged balsamic reduction, toasted pistachio crumb, micro-basil",
      price: 1800, // $18.00
      imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80",
      dietaryLabels: ["vegetarian", "gluten-free"],
      prepTimeMinutes: 10,
      isFeatured: true,
      sortOrder: 1,
    })
    .returning();

  // Beef Tartare
  await db.insert(menuItems).values({
    orgId: org.id,
    categoryId: startersCat.id,
    name: "Hand-Cut Wagyu Tartare",
    description: "Cured egg yolk, caperberry jam, shallot crisp, house charcoal brioche toast",
    price: 2200, // $22.00
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    dietaryLabels: ["chef-signature"],
    prepTimeMinutes: 12,
    isFeatured: true,
    sortOrder: 2,
  });

  // Ribeye Steak
  const [ribeye] = await db
    .insert(menuItems)
    .values({
      orgId: org.id,
      categoryId: mainsCat.id,
      name: "Prime Dry-Aged Ribeye (350g)",
      description: "Grass-fed USDA Prime, bone marrow butter, blistered vine tomatoes, smoked Maldon salt",
      price: 4800, // $48.00
      imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80",
      dietaryLabels: ["gluten-free"],
      prepTimeMinutes: 22,
      isFeatured: true,
      sortOrder: 1,
    })
    .returning();

  // Modifiers for Ribeye
  const [donenessGroup] = await db
    .insert(modifierGroups)
    .values({
      orgId: org.id,
      menuItemId: ribeye.id,
      name: "Select Doneness",
      minSelections: 1,
      maxSelections: 1,
      isRequired: true,
      sortOrder: 1,
    })
    .returning();

  await db.insert(modifierOptions).values([
    { modifierGroupId: donenessGroup.id, name: "Rare - Cool Red Center", priceDelta: 0 },
    { modifierGroupId: donenessGroup.id, name: "Medium Rare - Warm Red Center", priceDelta: 0 },
    { modifierGroupId: donenessGroup.id, name: "Medium - Warm Pink", priceDelta: 0 },
    { modifierGroupId: donenessGroup.id, name: "Medium Well", priceDelta: 0 },
  ]);

  const [sidesGroup] = await db
    .insert(modifierGroups)
    .values({
      orgId: org.id,
      menuItemId: ribeye.id,
      name: "Add Chef Accompaniments",
      minSelections: 0,
      maxSelections: 3,
      isRequired: false,
      sortOrder: 2,
    })
    .returning();

  await db.insert(modifierOptions).values([
    { modifierGroupId: sidesGroup.id, name: "Truffle Parmesan Hand-Cut Fries", priceDelta: 600 },
    { modifierGroupId: sidesGroup.id, name: "Charred Broccolini & Garlic Confit", priceDelta: 500 },
    { modifierGroupId: sidesGroup.id, name: "Pan-Seared Foie Gras Medallion", priceDelta: 1600 },
  ]);

  // Truffle Agnolotti Pasta
  await db.insert(menuItems).values({
    orgId: org.id,
    categoryId: mainsCat.id,
    name: "Wild Mushroom & Truffle Agnolotti",
    description: "Handmade pasta pillows filled with roasted porcini, brown butter emulsion, shaved Norcia black truffle",
    price: 3200, // $32.00
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
    dietaryLabels: ["vegetarian"],
    prepTimeMinutes: 18,
    isFeatured: true,
    sortOrder: 2,
  });

  // Smoked Old Fashioned Cocktail
  await db.insert(menuItems).values({
    orgId: org.id,
    categoryId: drinksCat.id,
    name: "Smoked Cherrywood Old Fashioned",
    description: "Small-batch rye, black walnut bitters, demerara sugar, ignited cherrywood smoke chamber",
    price: 1800, // $18.00
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
    dietaryLabels: ["contains-alcohol"],
    prepTimeMinutes: 6,
    isFeatured: true,
    sortOrder: 1,
  });

  // Valrhona Chocolate Soufflé
  await db.insert(menuItems).values({
    orgId: org.id,
    categoryId: dessertCat.id,
    name: "Valrhona 72% Dark Soufflé",
    description: "Baked to order, Tahitian vanilla bean creme anglaise, gold leaf",
    price: 1600, // $16.00
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    dietaryLabels: ["vegetarian"],
    prepTimeMinutes: 15,
    isFeatured: false,
    sortOrder: 1,
  });

  console.log("Created Menu Items with rich food imagery, labels, and modifiers");

  // 7. Gamified Puzzle Loyalty Campaign
  await db.insert(loyaltyCampaigns).values({
    orgId: org.id,
    title: "The Connoisseur's Culinary Quest",
    description: "Collect all 4 pieces of the Gourmet Crest with each eligible dining order ($20+), and unlock a complimentary 20% discount on your next visit.",
    artworkTheme: "culinary_art",
    totalPieces: 4,
    minOrderAmount: 2000, // $20.00
    cooldownHours: 6,
    rewardType: "percent_discount",
    rewardValue: 20,
    rewardDescription: "20% Off Your Entire Bill",
    isActive: true,
  });

  console.log("Created 4-Piece Gamified Puzzle Loyalty Campaign");

  // 8. Notification Templates
  const notificationConfigs = [
    {
      event: "order_received",
      titleTemplate: "Order #{orderNumber} Received",
      bodyTemplate: "Your order is confirmed and heading to the kitchen.",
    },
    {
      event: "order_preparing",
      titleTemplate: "Chef is preparing Order #{orderNumber}",
      bodyTemplate: "Fresh ingredients are on the grill. Expected in ~{prepTime} minutes.",
    },
    {
      event: "order_ready",
      titleTemplate: "Order #{orderNumber} Ready",
      bodyTemplate: "Your dishes are hot and being served to {tableNumber}.",
    },
    {
      event: "puzzle_earned",
      titleTemplate: "Puzzle Piece #{pieceNumber} Unlocked!",
      bodyTemplate: "You're 1 step closer to completing the Culinary Quest reward.",
    },
  ];

  for (const n of notificationConfigs) {
    await db.insert(notificationTemplates).values({
      orgId: org.id,
      event: n.event,
      channel: "in_app",
      titleTemplate: n.titleTemplate,
      bodyTemplate: n.bodyTemplate,
      isActive: true,
    });
  }

  console.log("✅ Seed completed successfully!");
  process.exit(0);
}

runSeed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
