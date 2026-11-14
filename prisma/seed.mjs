import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_DEFAULTS, PERMISSION_LABELS } from "../src/lib/constants.js";

const prisma = new PrismaClient();
const img = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const daysAgo = (days, hours = 0) =>
  new Date(Date.now() - days * 86400000 - hours * 3600000);

async function main() {
  console.log("Cleaning existing data…");

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.serviceRequestStatusHistory.deleteMany();
  await prisma.serviceDocument.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.repairStatusHistory.deleteMany();
  await prisma.technicianAssignment.deleteMany();
  await prisma.repairDiagnosis.deleteMany();
  await prisma.repairImage.deleteMany();
  await prisma.repairRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.digitalService.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.businessSettings.deleteMany();

  console.log("Seeding roles and permissions…");

  const permissionEntries = Object.entries(PERMISSION_LABELS);
  const permissions = {};
  for (const [key, description] of permissionEntries) {
    permissions[key] = await prisma.permission.create({
      data: { key, description },
    });
  }

  const roles = {};
  const roleMeta = {
    ADMIN: "Full access to all business operations",
    STAFF: "Day-to-day store and service operations",
    TECHNICIAN: "Repair queue and diagnostic updates",
    CUSTOMER: "Customer account access",
  };

  for (const [name, keys] of Object.entries(ROLE_DEFAULTS)) {
    const role = await prisma.role.create({
      data: {
        name,
        description: roleMeta[name],
        permissions: {
          create: keys.map((key) => ({ permissionId: permissions[key].id })),
        },
      },
    });
    roles[name] = role;
  }

  const hash = (password) => bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name: "MIX Administrator",
      email: "admin@mix.co.ke",
      phone: "254700000001",
      passwordHash: await hash("Admin@12345"),
      roleId: roles.ADMIN.id,
      emailVerified: new Date(),
      staffProfile: { create: { position: "Business owner" } },
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: "Grace Mwangi",
      email: "staff@mix.co.ke",
      phone: "254700000002",
      passwordHash: await hash("Staff@12345"),
      roleId: roles.STAFF.id,
      emailVerified: new Date(),
      staffProfile: { create: { position: "Store supervisor" } },
    },
  });

  const technician = await prisma.user.create({
    data: {
      name: "Peter Ochieng",
      email: "tech@mix.co.ke",
      phone: "254700000003",
      passwordHash: await hash("Tech@12345"),
      roleId: roles.TECHNICIAN.id,
      emailVerified: new Date(),
      staffProfile: { create: { position: "Phone repair technician" } },
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "Brian Otieno",
      email: "customer@mix.co.ke",
      phone: "254712345678",
      passwordHash: await hash("Customer@12345"),
      roleId: roles.CUSTOMER.id,
      emailVerified: new Date(),
      customerProfile: {
        create: {
          defaultPhone: "254712345678",
          addressLine: "Kehancha Town",
          city: "Kehancha",
        },
      },
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Amina Wanjiku",
      email: "amina@example.com",
      phone: "254722111222",
      passwordHash: await hash("Customer@12345"),
      roleId: roles.CUSTOMER.id,
      customerProfile: {
        create: { defaultPhone: "254722111222", city: "Kehancha" },
      },
    },
  });

  console.log("Seeding business settings…");

  await prisma.businessSettings.create({
    data: {
      id: "singleton",
      businessName: "MIX",
      tagline: "Technology made simpler.",
      phone: "+254 712 345 678",
      whatsapp: "254712345678",
      email: "hello@mix.co.ke",
      address: "MIX Business Centre, Kehancha Town, Migori County, Kenya",
      openingHours: "Mon–Sat, 8:00 AM – 7:00 PM",
      deliveryEnabled: true,
      collectionEnabled: true,
      deliveryFee: 300,
      deliveryCoverage: "Kehancha, Migori and nearby areas",
      lowStockThreshold: 5,
      mpesaEnabled: true,
    },
  });

  await prisma.announcement.create({
    data: {
      message:
        "Shop online, pay with M-PESA and collect at our Kehancha shop — or ask about delivery.",
      isActive: true,
    },
  });

  await prisma.promotion.create({
    data: {
      title: "Sound that moves with you",
      description:
        "Headphones, earbuds and speakers from brands you trust — available in store now.",
      imageUrl: img("photo-1505740420928-5e560c06d30e", 1400),
      ctaLabel: "Shop audio",
      ctaUrl: "/store/categories/headphones",
      isActive: true,
    },
  });

  console.log("Seeding catalogue…");

  const categoriesData = [
    ["Smartphones", "smartphones", "photo-1511707171634-5f897ff02aa9"],
    ["Chargers", "chargers", "photo-1583863788434-e58a36330cf0"],
    ["Charging cables", "charging-cables", "photo-1601944177325-f8867652837f"],
    ["Earphones", "earphones", "photo-1606220945770-b5b6c2c55bf1"],
    ["Headphones", "headphones", "photo-1505740420928-5e560c06d30e"],
    ["Speakers", "speakers", "photo-1608043152269-423dbba4e7e1"],
    ["Power banks", "power-banks", "photo-1583863788434-e58a36330cf0"],
    ["Phone cases", "phone-cases", "photo-1601593346740-925612772716"],
    ["Screen protectors", "screen-protectors", "photo-1585790050230-5dd28404ccb9"],
    ["Smart watches", "smart-watches", "photo-1523275335684-37898b6baf30"],
    ["Computer accessories", "computer-accessories", "photo-1587829741301-dc798b83add3"],
    ["Other electronics", "other-electronics", "photo-1517336714731-489689fd1ca8"],
  ];

  const categories = {};
  for (let i = 0; i < categoriesData.length; i += 1) {
    const [name, slug, image] = categoriesData[i];
    categories[slug] = await prisma.category.create({
      data: {
        name,
        slug,
        description: `Genuine ${name.toLowerCase()} selected for everyday use, backed by MIX customer support.`,
        imageUrl: img(image, 600),
        sortOrder: i,
        isActive: true,
      },
    });
  }

  const brandNames = [
    "Apple",
    "Samsung",
    "Tecno",
    "Infinix",
    "JBL",
    "Anker",
    "Oraimo",
    "Logitech",
    "Sony",
    "Generic",
  ];
  const brands = {};
  for (const name of brandNames) {
    brands[name] = await prisma.brand.create({
      data: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
    });
  }

  const productDefs = [
    {
      name: "iPhone 13 128GB",
      category: "smartphones",
      brand: "Apple",
      price: 89999,
      compareAtPrice: 99999,
      featured: true,
      newArrival: true,
      image: "photo-1511707171634-5f897ff02aa9",
      description:
        "A dependable everyday iPhone with the A15 Bionic chip, a bright 6.1-inch display and all-day battery life. Available in selected colours and storage capacities at our Kehancha shop.",
      specs: {
        Display: "6.1-inch Super Retina XDR",
        Chip: "A15 Bionic",
        Camera: "Dual 12MP",
        Battery: "Up to 19 hours video playback",
        Warranty: "12-month MIX warranty",
      },
      variants: [
        { name: "128GB — Midnight", sku: "APL-IP13-128-MID", stock: 4, price: 89999 },
        { name: "128GB — Blue", sku: "APL-IP13-128-BLU", stock: 3, price: 89999 },
        { name: "256GB — Midnight", sku: "APL-IP13-256-MID", stock: 2, price: 104999 },
      ],
    },
    {
      name: "Samsung Galaxy A15 128GB",
      category: "smartphones",
      brand: "Samsung",
      price: 26999,
      compareAtPrice: 28999,
      featured: true,
      newArrival: true,
      image: "photo-1610945265064-0e34e5519bbf",
      description:
        "A reliable Samsung smartphone with a vivid Super AMOLED display, 50MP camera and 5,000mAh battery. Ideal for work, social media and everyday browsing.",
      specs: {
        Display: "6.5-inch Super AMOLED",
        Memory: "4GB RAM",
        Storage: "128GB",
        Camera: "50MP main",
        Battery: "5,000mAh",
      },
      variants: [
        { name: "128GB — Black", sku: "SAM-A15-128-BLK", stock: 6 },
        { name: "128GB — Blue", sku: "SAM-A15-128-BLU", stock: 5 },
      ],
    },
    {
      name: "Tecno Spark 20C 128GB",
      category: "smartphones",
      brand: "Tecno",
      price: 14999,
      newArrival: true,
      image: "photo-1592899677977-9c10ca588bbd",
      description:
        "A value-focused smartphone with a large display, expandable storage and a long-lasting battery — a practical choice for everyday use.",
      specs: {
        Display: "6.6-inch HD+",
        Memory: "4GB RAM",
        Storage: "128GB",
        Battery: "5,000mAh",
        Network: "4G",
      },
      variants: [
        { name: "128GB — Black", sku: "TEC-SP20C-128-BLK", stock: 8 },
        { name: "128GB — Gold", sku: "TEC-SP20C-128-GLD", stock: 6 },
      ],
    },
    {
      name: "Infinix Hot 40i 128GB",
      category: "smartphones",
      brand: "Infinix",
      price: 16500,
      image: "photo-1541877944-ac82a091518a",
      description:
        "A modern budget smartphone with a smooth display, ample storage and fast charging. A strong option for students and busy professionals.",
      specs: {
        Display: "6.6-inch HD+",
        Storage: "128GB",
        Battery: "5,000mAh",
        Charging: "18W fast charge",
      },
      variants: [
        { name: "128GB — Black", sku: "INF-H40I-128-BLK", stock: 5 },
        { name: "128GB — Green", sku: "INF-H40I-128-GRN", stock: 4 },
      ],
    },
    {
      name: "Oraimo 33W Fast Charger",
      category: "chargers",
      brand: "Oraimo",
      price: 1899,
      featured: true,
      image: "photo-1583863788434-e58a36330cf0",
      description:
        "A compact 33W wall charger for fast, reliable charging at home or the office. Compatible with most USB-C phones.",
      specs: { Output: "33W", Ports: "USB-C + USB-A", Warranty: "MIX 6-month warranty" },
      stock: 24,
    },
    {
      name: "Anker PowerPort 20W",
      category: "chargers",
      brand: "Anker",
      price: 2499,
      image: "photo-1583863788434-e58a36330cf0",
      description:
        "A dependable 20W USB-C charger with a slim profile, ideal for daily phone charging and travel.",
      specs: { Output: "20W", Ports: "1 × USB-C", Warranty: "12 months" },
      stock: 16,
    },
    {
      name: "Braided USB-C Cable 1m",
      category: "charging-cables",
      brand: "Oraimo",
      price: 699,
      image: "photo-1601944177325-f8867652837f",
      description:
        "A durable braided USB-C cable for charging and data transfer. Reinforced connectors built for everyday use.",
      specs: { Length: "1 metre", Connector: "USB-C", Warranty: "6 months" },
      stock: 40,
    },
    {
      name: "Lightning Cable 1m",
      category: "charging-cables",
      brand: "Anker",
      price: 899,
      image: "photo-1601944177325-f8867652837f",
      description:
        "A reliable Lightning cable for iPhone and iPad charging, with a reinforced connector and tangle-resistant finish.",
      specs: { Length: "1 metre", Connector: "Lightning", MFi: "Certified" },
      stock: 32,
    },
    {
      name: "Oraimo FreePods 4",
      category: "earphones",
      brand: "Oraimo",
      price: 3499,
      compareAtPrice: 3999,
      featured: true,
      newArrival: true,
      image: "photo-1606220945770-b5b6c2c55bf1",
      description:
        "True wireless earbuds with clear call quality, punchy bass and a pocket-sized charging case. Designed for commutes and workouts.",
      specs: { Battery: "Up to 24 hours with case", Bluetooth: "5.3", WaterResistance: "IPX5" },
      stock: 18,
    },
    {
      name: "Samsung Galaxy Buds FE",
      category: "earphones",
      brand: "Samsung",
      price: 5999,
      image: "photo-1606220945770-b5b6c2c55bf1",
      description:
        "Comfortable wireless earbuds with active noise cancellation and a secure fit, tuned for everyday listening.",
      specs: { ANC: "Yes", Bluetooth: "5.2", Battery: "Up to 30 hours with case" },
      stock: 10,
    },
    {
      name: "JBL Tune 510BT Headphones",
      category: "headphones",
      brand: "JBL",
      price: 5499,
      compareAtPrice: 6499,
      featured: true,
      image: "photo-1505740420928-5e560c06d30e",
      description:
        "Wireless on-ear headphones with JBL Pure Bass sound, a lightweight foldable design and long battery life.",
      specs: { Battery: "Up to 40 hours", Bluetooth: "5.0", Foldable: "Yes" },
      stock: 12,
    },
    {
      name: "Sony WH-CH520 Headphones",
      category: "headphones",
      brand: "Sony",
      price: 7499,
      newArrival: true,
      image: "photo-1546435770-a3e426bf472b",
      description:
        "Lightweight wireless headphones with clear vocals, rich bass and multipoint connection for switching between devices.",
      specs: { Battery: "Up to 50 hours", Multipoint: "Yes", Charging: "USB-C" },
      stock: 7,
    },
    {
      name: "JBL Go 3 Portable Speaker",
      category: "speakers",
      brand: "JBL",
      price: 4299,
      featured: true,
      image: "photo-1608043152269-423dbba4e7e1",
      description:
        "A pocket-sized Bluetooth speaker with bold JBL sound and a rugged, water-resistant build for outdoor use.",
      specs: { Bluetooth: "5.1", WaterResistance: "IP67", Battery: "5 hours" },
      stock: 14,
    },
    {
      name: "Anker Soundcore Mini Speaker",
      category: "speakers",
      brand: "Anker",
      price: 3299,
      image: "photo-1608043152269-423dbba4e7e1",
      description:
        "A compact speaker with surprisingly full sound, a built-in microphone and support for microSD playback.",
      specs: { Battery: "15 hours", Bluetooth: "4.2", Weight: "195g" },
      stock: 9,
    },
    {
      name: "Anker PowerCore 10,000mAh",
      category: "power-banks",
      brand: "Anker",
      price: 3999,
      featured: true,
      image: "photo-1583863788434-e58a36330cf0",
      description:
        "A slim 10,000mAh power bank that charges a phone several times over. Fast, safe charging in a travel-friendly size.",
      specs: { Capacity: "10,000mAh", Output: "20W USB-C", Warranty: "18 months" },
      stock: 21,
    },
    {
      name: "Oraimo 20,000mAh Power Bank",
      category: "power-banks",
      brand: "Oraimo",
      price: 4999,
      newArrival: true,
      image: "photo-1583863788434-e58a36330cf0",
      description:
        "High-capacity power bank with dual outputs, fast charging and a clear battery indicator — built for long days away from power.",
      specs: { Capacity: "20,000mAh", Output: "22.5W", Ports: "USB-C + 2 × USB-A" },
      stock: 13,
    },
    {
      name: "Silicone Phone Case",
      category: "phone-cases",
      brand: "Generic",
      price: 999,
      image: "photo-1601593346740-925612772716",
      description:
        "A soft-touch silicone case with a microfiber lining, offering everyday protection without adding bulk.",
      specs: { Material: "Silicone", Finish: "Matte", Compatibility: "Selected models" },
      variants: [
        { name: "iPhone 13 — Black", sku: "GEN-CASE-IP13-BLK", stock: 7 },
        { name: "iPhone 13 — Blue", sku: "GEN-CASE-IP13-BLU", stock: 5 },
        { name: "Samsung A15 — Black", sku: "GEN-CASE-A15-BLK", stock: 6 },
      ],
    },
    {
      name: "Clear Phone Case",
      category: "phone-cases",
      brand: "Generic",
      price: 799,
      image: "photo-1601593346740-925612772716",
      description:
        "A shock-absorbing clear case that shows off your phone's original finish while protecting the edges and camera.",
      specs: { Material: "TPU", Finish: "Transparent", Protection: "Raised camera lip" },
      stock: 25,
    },
    {
      name: "Tempered Glass Screen Protector",
      category: "screen-protectors",
      brand: "Generic",
      price: 599,
      image: "photo-1585790050230-5dd28404ccb9",
      description:
        "A 9H tempered glass protector with an easy alignment frame and oleophobic coating to resist fingerprints.",
      specs: { Hardness: "9H", Coating: "Oleophobic", Pack: "1 piece + wipes" },
      stock: 50,
    },
    {
      name: "Privacy Screen Protector",
      category: "screen-protectors",
      brand: "Generic",
      price: 899,
      image: "photo-1585790050230-5dd28404ccb9",
      description:
        "A privacy filter screen protector that narrows the viewing angle, helping keep messages and banking apps private in public.",
      specs: { Privacy: "Anti-peep", Hardness: "9H", Pack: "1 piece" },
      stock: 20,
    },
    {
      name: "MIX Smart Watch Series 2",
      category: "smart-watches",
      brand: "Generic",
      price: 4999,
      compareAtPrice: 5999,
      featured: true,
      newArrival: true,
      image: "photo-1523275335684-37898b6baf30",
      description:
        "A practical smart watch with call notifications, fitness tracking, heart-rate monitoring and a bright colour display.",
      specs: { Display: "1.85-inch colour", Battery: "Up to 7 days", WaterResistance: "IP67" },
      stock: 11,
    },
    {
      name: "Replacement Watch Strap",
      category: "smart-watches",
      brand: "Generic",
      price: 1299,
      image: "photo-1523275335684-37898b6baf30",
      description:
        "A comfortable silicone replacement strap that fits selected smart watches. Quick-release pins for easy swapping.",
      specs: { Material: "Silicone", Width: "20mm", Colours: "Black or blue" },
      variantLabel: true,
      variants: [
        { name: "20mm — Black", sku: "GEN-STRAP-20-BLK", stock: 9 },
        { name: "20mm — Blue", sku: "GEN-STRAP-20-BLU", stock: 6 },
      ],
    },
    {
      name: "Logitech Wireless Keyboard",
      category: "computer-accessories",
      brand: "Logitech",
      price: 4999,
      image: "photo-1587829741301-dc798b83add3",
      description:
        "A quiet, full-size wireless keyboard with a comfortable typing feel and reliable connection for home or office.",
      specs: { Connection: "2.4GHz wireless", Layout: "Full size", Battery: "24 months" },
      stock: 8,
    },
    {
      name: "Wireless Optical Mouse",
      category: "computer-accessories",
      brand: "Logitech",
      price: 2199,
      image: "photo-1527864550417-7fd91fc51a46",
      description:
        "A precise wireless mouse with a comfortable shape, adjustable sensitivity and long battery life.",
      specs: { Connection: "2.4GHz + Bluetooth", DPI: "Up to 1600", Battery: "12 months" },
      stock: 15,
    },
    {
      name: "USB-C Hub 6-in-1",
      category: "computer-accessories",
      brand: "Generic",
      price: 4599,
      image: "photo-1517336714731-489689fd1ca8",
      description:
        "Expand a single USB-C port into HDMI, USB-A, USB-C and card reader connections. Ideal for laptops and tablets.",
      specs: { HDMI: "4K @ 30Hz", USB: "3 × USB-A", CardReader: "SD + microSD" },
      stock: 6,
    },
    {
      name: 'Laptop Sleeve 14"',
      category: "computer-accessories",
      brand: "Generic",
      price: 2499,
      image: "photo-1593642632823-8f785ba67e45",
      description:
        "A padded 14-inch laptop sleeve with a water-resistant exterior and a front pocket for cables and accessories.",
      specs: { Size: "14 inch", Material: "Water-resistant fabric", Pocket: "Front zip" },
      stock: 12,
    },
  ];

  const products = {};
  let skuIndex = 1;

  for (const def of productDefs) {
    const slug = def.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const category = categories[def.category];
    const totalVariantStock = (def.variants || []).reduce((sum, v) => sum + v.stock, 0);
    const stockQuantity = def.variants ? totalVariantStock : def.stock ?? 0;

    const product = await prisma.product.create({
      data: {
        name: def.name,
        slug,
        sku: `MIX-${String(skuIndex++).padStart(4, "0")}`,
        description: def.description,
        categoryId: category.id,
        brandId: def.brand ? brands[def.brand].id : null,
        price: def.price,
        compareAtPrice: def.compareAtPrice || null,
        stockQuantity,
        lowStockAt: 5,
        specs: def.specs,
        isFeatured: Boolean(def.featured),
        isNewArrival: Boolean(def.newArrival),
        isActive: true,
        images: {
          create: [
            {
              url: img(def.image),
              alt: def.name,
              sortOrder: 0,
            },
          ],
        },
        variants: def.variants
          ? {
              create: def.variants.map((variant) => ({
                name: variant.name,
                sku: variant.sku,
                price: variant.price ?? def.price,
                stockQuantity: variant.stock,
                attributes: { name: variant.name },
                isActive: true,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });

    products[def.name] = product;
  }

  console.log("Seeding digital services…");

  const servicesData = [
    ["Printing", "printing", "Colour and black-and-white printing for documents, assignments and business materials.", 20, "page"],
    ["Photocopying", "photocopying", "Fast, clear photocopies of documents, IDs and books.", 10, "page"],
    ["Scanning", "scanning", "Scan documents and photographs to PDF or image files, ready to share.", 30, "document"],
    ["Document typing", "document-typing", "Accurate typing and formatting of handwritten or printed documents.", 100, "page"],
    ["CV preparation", "cv-preparation", "Professional CV layout and formatting to help your application stand out.", 500, "CV"],
    ["Document formatting", "document-formatting", "Clean formatting for reports, proposals, assignments and letters.", 300, "document"],
    ["Online application assistance", "online-applications", "Guided help completing online applications for jobs, courses and services.", 200, "application"],
    ["General online services", "online-services", "Email setup, downloads, uploads and other everyday online tasks.", 100, "request"],
  ];

  const services = {};
  for (let i = 0; i < servicesData.length; i += 1) {
    const [name, slug, description, priceFrom, unit] = servicesData[i];
    services[slug] = await prisma.digitalService.create({
      data: { name, slug, description, priceFrom, unit, sortOrder: i, isActive: true },
    });
  }

  console.log("Seeding demo orders…");

  const iphone = products["iPhone 13 128GB"];
  const iphoneVariant = await prisma.productVariant.findFirst({
    where: { productId: iphone.id, name: "128GB — Midnight" },
  });
  const freePods = products["Oraimo FreePods 4"];
  const cable = products["Braided USB-C Cable 1m"];
  const watch = products["MIX Smart Watch Series 2"];
  const keyboard = products["Logitech Wireless Keyboard"];

  const completedOrder = await prisma.order.create({
    data: {
      reference: "MIX-ORD-DEMO01",
      accessToken: "demo-access-token-completed-order-001",
      userId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      fulfilmentMethod: "DELIVERY",
      deliveryAddress: "Kehancha Town, Migori County",
      deliveryNotes: "Call on arrival at the gate.",
      subtotal: iphone.price,
      deliveryFee: 300,
      total: iphone.price + 300,
      status: "COMPLETED",
      paymentStatus: "SUCCESS",
      createdAt: daysAgo(9),
      items: {
        create: [
          {
            productId: iphone.id,
            variantId: iphoneVariant?.id,
            productName: iphone.name,
            variantName: iphoneVariant?.name,
            sku: iphoneVariant?.sku || iphone.sku,
            unitPrice: iphone.price,
            quantity: 1,
            lineTotal: iphone.price,
          },
        ],
      },
      payments: {
        create: [
          {
            reference: "MIX-PAY-DEMO01",
            amount: iphone.price + 300,
            status: "SUCCESS",
            method: "MPESA",
            phone: customer.phone,
            merchantRequestId: "SEED-MERCHANT-001",
            checkoutRequestId: "SEED-CHECKOUT-001",
            mpesaReceipt: "SEEDMPESA01",
            resultCode: "0",
            resultDesc: "The service request is processed successfully.",
            completedAt: daysAgo(9),
          },
        ],
      },
      history: {
        create: [
          { status: "PENDING_PAYMENT", note: "Order created.", createdAt: daysAgo(9, 1) },
          { status: "CONFIRMED", note: "M-PESA payment confirmed (SEEDMPESA01).", createdAt: daysAgo(9) },
          { status: "PROCESSING", note: "Order packed for delivery.", changedById: staff.id, createdAt: daysAgo(8) },
          { status: "OUT_FOR_DELIVERY", note: "Rider dispatched.", changedById: staff.id, createdAt: daysAgo(8, 2) },
          { status: "COMPLETED", note: "Delivered to customer.", changedById: staff.id, createdAt: daysAgo(8, 1) },
        ],
      },
    },
  });

  const processingOrder = await prisma.order.create({
    data: {
      reference: "MIX-ORD-DEMO02",
      accessToken: "demo-access-token-processing-order-002",
      userId: customer2.id,
      customerName: customer2.name,
      phone: customer2.phone,
      email: customer2.email,
      fulfilmentMethod: "COLLECTION",
      subtotal: freePods.price + cable.price * 2,
      deliveryFee: 0,
      total: freePods.price + cable.price * 2,
      status: "PROCESSING",
      paymentStatus: "SUCCESS",
      createdAt: daysAgo(2),
      items: {
        create: [
          {
            productId: freePods.id,
            productName: freePods.name,
            sku: freePods.sku,
            unitPrice: freePods.price,
            quantity: 1,
            lineTotal: freePods.price,
          },
          {
            productId: cable.id,
            productName: cable.name,
            sku: cable.sku,
            unitPrice: cable.price,
            quantity: 2,
            lineTotal: cable.price * 2,
          },
        ],
      },
      payments: {
        create: [
          {
            reference: "MIX-PAY-DEMO02",
            amount: freePods.price + cable.price * 2,
            status: "SUCCESS",
            method: "MPESA",
            phone: customer2.phone,
            checkoutRequestId: "SEED-CHECKOUT-002",
            mpesaReceipt: "SEEDMPESA02",
            resultCode: "0",
            resultDesc: "The service request is processed successfully.",
            completedAt: daysAgo(2),
          },
        ],
      },
      history: {
        create: [
          { status: "PENDING_PAYMENT", note: "Order created.", createdAt: daysAgo(2, 1) },
          { status: "CONFIRMED", note: "M-PESA payment confirmed (SEEDMPESA02).", createdAt: daysAgo(2) },
          { status: "PROCESSING", note: "Items being prepared for collection.", changedById: staff.id, createdAt: daysAgo(1) },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      reference: "MIX-ORD-DEMO03",
      accessToken: "demo-access-token-pending-order-003",
      customerName: "Kevin Mutua",
      phone: "254733444555",
      email: "kevin@example.com",
      fulfilmentMethod: "COLLECTION",
      subtotal: watch.price,
      deliveryFee: 0,
      total: watch.price,
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      createdAt: daysAgo(0, 2),
      items: {
        create: [
          {
            productId: watch.id,
            productName: watch.name,
            sku: watch.sku,
            unitPrice: watch.price,
            quantity: 1,
            lineTotal: watch.price,
          },
        ],
      },
      payments: {
        create: [
          {
            reference: "MIX-PAY-DEMO03",
            amount: watch.price,
            status: "PENDING",
            method: "MPESA",
            phone: "254733444555",
            checkoutRequestId: "SEED-CHECKOUT-003",
            resultCode: null,
          },
        ],
      },
      history: {
        create: [{ status: "PENDING_PAYMENT", note: "Order created, awaiting M-PESA confirmation.", createdAt: daysAgo(0, 2) }],
      },
    },
  });

  await prisma.order.create({
    data: {
      reference: "MIX-ORD-DEMO04",
      accessToken: "demo-access-token-failed-order-004",
      customerName: "Faith Njeri",
      phone: "254745666777",
      fulfilmentMethod: "COLLECTION",
      subtotal: keyboard.price,
      deliveryFee: 0,
      total: keyboard.price,
      status: "PAYMENT_FAILED",
      paymentStatus: "FAILED",
      createdAt: daysAgo(1),
      items: {
        create: [
          {
            productId: keyboard.id,
            productName: keyboard.name,
            sku: keyboard.sku,
            unitPrice: keyboard.price,
            quantity: 1,
            lineTotal: keyboard.price,
          },
        ],
      },
      payments: {
        create: [
          {
            reference: "MIX-PAY-DEMO04",
            amount: keyboard.price,
            status: "FAILED",
            method: "MPESA",
            phone: "254745666777",
            checkoutRequestId: "SEED-CHECKOUT-004",
            resultCode: "1032",
            resultDesc: "Request cancelled by user",
            failureReason: "Request cancelled by the customer.",
            completedAt: daysAgo(1),
          },
        ],
      },
      history: {
        create: [
          { status: "PENDING_PAYMENT", note: "Order created.", createdAt: daysAgo(1, 1) },
          { status: "PAYMENT_FAILED", note: "Payment failed: request cancelled by the customer.", createdAt: daysAgo(1) },
        ],
      },
    },
  });

  console.log("Seeding demo repairs…");

  const repair1 = await prisma.repairRequest.create({
    data: {
      reference: "MIX-REP-DEMO01",
      userId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      deviceBrand: "Apple",
      deviceModel: "iPhone 12",
      deviceType: "Smartphone",
      problemDescription:
        "The screen cracked after a fall. The display works but the touch response is unreliable around the top edge.",
      status: "SUBMITTED",
      createdAt: daysAgo(1, 3),
      statusHistory: {
        create: [{ status: "SUBMITTED", note: "Repair request received online." }],
      },
    },
  });

  const repair2 = await prisma.repairRequest.create({
    data: {
      reference: "MIX-REP-DEMO02",
      userId: customer2.id,
      customerName: customer2.name,
      phone: customer2.phone,
      email: customer2.email,
      deviceBrand: "Samsung",
      deviceModel: "Galaxy A54",
      deviceType: "Smartphone",
      problemDescription:
        "The phone only charges when the cable is held at an angle. The charging port may be loose or dirty.",
      status: "IN_REPAIR",
      assignedTechnicianId: technician.id,
      estimateAmount: 2500,
      diagnosis:
        "Charging port is worn and the internal connector is loose. Board is otherwise healthy. Replacement port quoted at KSh 2,500.",
      internalNotes: "Customer approved the repair by phone on the day of diagnosis.",
      createdAt: daysAgo(4),
      diagnoses: {
        create: [
          {
            technicianId: technician.id,
            findings:
              "Charging port is worn and the internal connector is loose. Board is otherwise healthy.",
            estimateAmount: 2500,
            createdAt: daysAgo(3),
          },
        ],
      },
      assignments: {
        create: [{ technicianId: technician.id, assignedAt: daysAgo(3), active: true }],
      },
      statusHistory: {
        create: [
          { status: "SUBMITTED", note: "Repair request received online.", createdAt: daysAgo(4) },
          { status: "DIAGNOSING", note: "Device received at the shop.", changedById: technician.id, createdAt: daysAgo(3, 4) },
          {
            status: "AWAITING_CUSTOMER_APPROVAL",
            note: "Estimate of KSh 2,500 sent to customer.",
            changedById: technician.id,
            createdAt: daysAgo(3, 2),
          },
          { status: "APPROVED", note: "Customer approved the estimate by phone.", changedById: staff.id, createdAt: daysAgo(3) },
          { status: "IN_REPAIR", note: "Technician is replacing the charging port.", changedById: technician.id, createdAt: daysAgo(2) },
        ],
      },
    },
  });

  await prisma.repairRequest.create({
    data: {
      reference: "MIX-REP-DEMO03",
      customerName: "James Kariuki",
      phone: "254701222333",
      email: "james@example.com",
      deviceBrand: "Tecno",
      deviceModel: "Spark 10",
      deviceType: "Smartphone",
      problemDescription:
        "The phone battery drains very quickly and switches off at around 30 percent charge.",
      status: "READY_FOR_COLLECTION",
      assignedTechnicianId: technician.id,
      estimateAmount: 1800,
      diagnosis: "Battery health has degraded. Replacement battery fitted and tested.",
      createdAt: daysAgo(6),
      diagnoses: {
        create: [
          {
            technicianId: technician.id,
            findings: "Battery health has degraded significantly. Replacement recommended.",
            estimateAmount: 1800,
            createdAt: daysAgo(5),
          },
        ],
      },
      assignments: {
        create: [{ technicianId: technician.id, assignedAt: daysAgo(5), active: true }],
      },
      statusHistory: {
        create: [
          { status: "SUBMITTED", note: "Repair request received online.", createdAt: daysAgo(6) },
          { status: "DIAGNOSING", note: "Device received.", changedById: technician.id, createdAt: daysAgo(5, 5) },
          { status: "APPROVED", note: "Estimate approved by customer.", changedById: staff.id, createdAt: daysAgo(5) },
          { status: "IN_REPAIR", note: "Battery replacement underway.", changedById: technician.id, createdAt: daysAgo(4) },
          {
            status: "READY_FOR_COLLECTION",
            note: "Repair complete and tested. Customer notified to collect.",
            changedById: technician.id,
            createdAt: daysAgo(3),
          },
        ],
      },
    },
  });

  console.log("Seeding demo digital service requests…");

  await prisma.serviceRequest.create({
    data: {
      reference: "MIX-DIG-DEMO01",
      userId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      serviceId: services["cv-preparation"].id,
      instructions:
        "Please update my CV with my latest job experience and format it for a finance role. I will send the current document on WhatsApp.",
      pages: 2,
      outputFormat: "PDF and Word",
      status: "UNDER_REVIEW",
      createdAt: daysAgo(1),
      statusHistory: {
        create: [
          { status: "SUBMITTED", note: "Request received online.", createdAt: daysAgo(1) },
          {
            status: "UNDER_REVIEW",
            note: "Assigned to staff for review.",
            changedById: staff.id,
            createdAt: daysAgo(0, 5),
          },
        ],
      },
    },
  });

  await prisma.serviceRequest.create({
    data: {
      reference: "MIX-DIG-DEMO02",
      userId: customer2.id,
      customerName: customer2.name,
      phone: customer2.phone,
      email: customer2.email,
      serviceId: services["printing"].id,
      instructions:
        "Please print 3 copies of the attached 12-page proposal in colour and staple each copy.",
      pages: 12,
      copies: 3,
      outputFormat: "Colour print, A4",
      status: "PROCESSING",
      quoteAmount: 720,
      assignedToId: staff.id,
      internalNotes: "Customer will collect before 5pm.",
      createdAt: daysAgo(2),
      statusHistory: {
        create: [
          { status: "SUBMITTED", note: "Request received online.", createdAt: daysAgo(2) },
          { status: "QUOTED", note: "Quoted KSh 720 for 36 colour pages.", changedById: staff.id, createdAt: daysAgo(1) },
          { status: "APPROVED", note: "Customer approved the quote.", changedById: staff.id, createdAt: daysAgo(1) },
          { status: "PROCESSING", note: "Printing in progress.", changedById: staff.id, createdAt: daysAgo(0, 4) },
        ],
      },
    },
  });

  console.log("Seeding notifications…");

  await prisma.notification.createMany({
    data: [
      {
        userId: customer.id,
        orderId: completedOrder.id,
        type: "PAYMENT_CONFIRMED",
        title: "Payment received for MIX-ORD-DEMO01",
        message: "We received your M-PESA payment and your order was completed. Thank you for shopping with MIX.",
        readAt: daysAgo(8),
        createdAt: daysAgo(9),
      },
      {
        userId: customer.id,
        type: "REPAIR_RECEIVED",
        title: "Repair request received",
        message: "We received your repair request for the iPhone 12. Reference MIX-REP-DEMO01.",
        createdAt: daysAgo(1, 3),
      },
      {
        userId: customer2.id,
        orderId: processingOrder.id,
        type: "ORDER_PROCESSING",
        title: "Your order is being prepared",
        message: "Order MIX-ORD-DEMO02 is being prepared for collection at our Kehancha shop.",
        createdAt: daysAgo(1),
      },
    ],
  });

  console.log("Seeding audit log…");
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED_DATABASE",
      entity: "Platform",
      metadata: { note: "Initial demo data generated" },
    },
  });

  console.log("\nSeed complete.");
  console.log("Admin:      admin@mix.co.ke / Admin@12345");
  console.log("Staff:      staff@mix.co.ke / Staff@12345");
  console.log("Technician: tech@mix.co.ke  / Tech@12345");
  console.log("Customer:   customer@mix.co.ke / Customer@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
