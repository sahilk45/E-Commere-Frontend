const PRODUCTS = [
  {
    id: "PROD-S24",
    name: "Galaxy S24 Ultra",
    brand: "Samsung",
    price: 1199,
    originalPrice: null,
    category: "electronics.smartphone",
    cat1: "electronics",
    cat2: "smartphone",
    tags: ["NEW"],
    description: "The ultimate Galaxy experience. Titanium frame, 200MP camera, built-in S Pen.",
    specs: { Display: "6.8\" QHD+ Dynamic AMOLED", Processor: "Snapdragon 8 Gen 3", RAM: "12GB", Storage: "256GB / 512GB / 1TB", Battery: "5000mAh" },
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=90",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=90"
    ]
  },
  {
    id: "PROD-IP15",
    name: "iPhone 15 Pro",
    brand: "Apple",
    price: 1099,
    originalPrice: null,
    category: "electronics.smartphone",
    cat1: "electronics",
    cat2: "smartphone",
    tags: ["BESTSELLER"],
    description: "Titanium. So strong, so light, so Pro. A17 Pro chip with 48MP main camera.",
    specs: { Display: "6.1\" Super Retina XDR", Chip: "A17 Pro", Camera: "48MP Triple", Storage: "128GB - 1TB", Battery: "Up to 23hrs" },
    images: [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=90",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=90"
    ]
  },
  {
    id: "PROD-PIXEL8",
    name: "Pixel 8 Pro",
    brand: "Google",
    price: 899,
    originalPrice: 999,
    category: "electronics.smartphone",
    cat1: "electronics",
    cat2: "smartphone",
    tags: ["SALE"],
    description: "Google AI built in. The most helpful phone ever made.",
    specs: { Display: "6.7\" LTPO OLED", Chip: "Google Tensor G3", Camera: "50MP triple system", RAM: "12GB", Storage: "128GB / 256GB" },
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=90",
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=90"
    ]
  },
  {
    id: "PROD-SONY-WH",
    name: "WH-1000XM5",
    brand: "Sony",
    price: 349,
    originalPrice: 399,
    category: "electronics.audio.headphone",
    cat1: "electronics",
    cat2: "audio",
    tags: ["SALE"],
    description: "Industry-leading noise cancellation. 30hr battery. Lightweight design.",
    specs: { "Driver": "30mm", "Freq Response": "4Hz-40kHz", "ANC": "Dual Chip + 8 Mics", "Battery": "30 hours", "Weight": "250g" },
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=90",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=90"
    ]
  },
  {
    id: "PROD-APPLE-WATCH",
    name: "Apple Watch Series 9",
    brand: "Apple",
    price: 399,
    originalPrice: null,
    category: "electronics.clocks",
    cat1: "electronics",
    cat2: "wearables",
    tags: ["NEW"],
    description: "Smarter. Brighter. Mightier. The most powerful Apple Watch yet.",
    specs: { Display: "Always-On Retina", Chip: "S9 SiP", Health: "ECG + Blood Oxygen", "Water Resistance": "50 meters", Battery: "18 hours" },
    images: [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=90"
    ]
  },
  {
    id: "PROD-DELL-XPS",
    name: "XPS 15 Laptop",
    brand: "Dell",
    price: 1799,
    originalPrice: null,
    category: "computers.notebook",
    cat1: "computers",
    cat2: "notebook",
    tags: ["BESTSELLER"],
    description: "Stunning 3.5K OLED display. Intel Core i7. The ultimate creator laptop.",
    specs: { Display: "15.6\" 3.5K OLED", Processor: "Intel Core i7-13700H", RAM: "16GB DDR5", Storage: "512GB NVMe SSD", GPU: "NVIDIA RTX 4060" },
    images: [
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=90",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=90"
    ]
  },
  {
    id: "PROD-LG-TV",
    name: "C3 OLED 65\"",
    brand: "LG",
    price: 1499,
    originalPrice: 1999,
    category: "electronics.video.tv",
    cat1: "electronics",
    cat2: "tv",
    tags: ["SALE"],
    description: "Perfect blacks. Infinite contrast. Self-lit pixels. The reference TV.",
    specs: { Panel: "OLED evo", Resolution: "4K UHD", "HDR": "Dolby Vision IQ", "Refresh Rate": "120Hz", "Smart TV": "webOS 23" },
    images: [
      "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&q=90",
      "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=90"
    ]
  },
  {
    id: "PROD-NIKE",
    name: "Air Max 270",
    brand: "Nike",
    price: 149,
    originalPrice: null,
    category: "apparel.shoes.keds",
    cat1: "apparel",
    cat2: "shoes",
    tags: ["NEW"],
    description: "Nike's largest heel Air unit yet for unrivaled, all-day comfort.",
    specs: { Upper: "Engineered Mesh", "Sole": "Rubber", "Air Unit": "270° Max Air", "Fit": "True to size", "Available": "US 6-15" },
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=90",
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=90"
    ]
  }
];
export default PRODUCTS;
