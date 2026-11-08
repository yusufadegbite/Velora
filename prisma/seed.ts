/* eslint-disable no-console */
import { PrismaClient, type BodyType, type FuelType, type Transmission, type VehicleCondition, type Drivetrain } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

// Illustrative photography (Unsplash). Replace with real stock photos from the admin panel.
const PHOTOS: Record<string, string[]> = {
  "mercedes-benz": ["photo-1618843479313-40f8afb4b4d8", "photo-1606664515524-ed2f786a0bd6", "photo-1563720223185-11003d516935", "photo-1520031441872-265e4ff70366"],
  bmw: ["photo-1555215695-3004980ad54e", "photo-1617531653332-bd46c24f2068", "photo-1556189250-72ba954cfc2b", "photo-1580273916550-e323be2ae537"],
  toyota: ["photo-1621007947382-bb3c3994e3fb", "photo-1559416523-140ddc3d238c", "photo-1494976388531-d1058494cdd8"],
  lexus: ["photo-1621993202323-f438eec934ff", "photo-1619767886558-efdc259cde1a", "photo-1549399542-7e3f8b79c341"],
  audi: ["photo-1603584173870-7f23fdae1b7a", "photo-1610768764270-790fbec18178", "photo-1606152421802-db97b9c7a11b"],
  porsche: ["photo-1503376780353-7e6692767b70", "photo-1614162692292-7ac56d7f7f1e", "photo-1503736334956-4c8f8e92946d", "photo-1542362567-b07e54358753"],
  "range-rover": ["photo-1606016159991-dfe4f2746ad5", "photo-1609521263047-f8f205293f24", "photo-1533473359331-0135ef1b58bf"],
  tesla: ["photo-1560958089-b8a1929cea89", "photo-1617788138017-80ad40651399", "photo-1536700503339-1e4b06520771"],
  lamborghini: ["photo-1544636331-e26879cd4d9b", "photo-1621135802920-133df287f89c", "photo-1511919884226-fd3cad34687c"],
  ferrari: ["photo-1592198084033-aade902d1aae", "photo-1583121274602-3e2820c69888", "photo-1502877338535-766e1452684a"],
};

const BRANDS = [
  { name: "Mercedes-Benz", slug: "mercedes-benz", country: "Germany", description: "The benchmark for luxury since 1886 — from the S-Class to the iconic G-Class." },
  { name: "BMW", slug: "bmw", country: "Germany", description: "The ultimate driving machine. Precise engineering with an athletic soul." },
  { name: "Toyota", slug: "toyota", country: "Japan", description: "Legendary reliability, resale value and go-anywhere capability." },
  { name: "Lexus", slug: "lexus", country: "Japan", description: "Japanese craftsmanship, whisper-quiet refinement and peerless dependability." },
  { name: "Audi", slug: "audi", country: "Germany", description: "Vorsprung durch Technik — quattro confidence and progressive design." },
  { name: "Porsche", slug: "porsche", country: "Germany", description: "Sports cars for every day, built in Stuttgart with racing in their DNA." },
  { name: "Range Rover", slug: "range-rover", country: "United Kingdom", description: "Peerless refinement on any terrain — the original luxury SUV." },
  { name: "Tesla", slug: "tesla", country: "United States", description: "Electric performance, over-the-air updates and instant torque." },
  { name: "Lamborghini", slug: "lamborghini", country: "Italy", description: "Uncompromising Italian super sports cars from Sant'Agata Bolognese." },
  { name: "Ferrari", slug: "ferrari", country: "Italy", description: "Maranello's prancing horse — the definitive name in performance." },
];

type Seed = {
  brand: string; model: string; trim?: string; year: number; price: number; previousPrice?: number; mileage: number;
  transmission: Transmission; fuel: FuelType; body: BodyType; drive: Drivetrain; condition: VehicleCondition;
  engine: string; cc: number | null; hp: number; seats: number; ext: string; int: string; location: string;
  featured?: boolean; forSale?: boolean; rent?: [number, number, number, number]; torque: string; zeroTo100: string; topSpeed: string;
  fuelEconomy: string; features: string[]; blurb: string;
};

const V: Seed[] = [
  { brand: "mercedes-benz", model: "G 63 AMG", trim: "Grand Edition", year: 2025, price: 485_000_000, mileage: 0, transmission: "AUTOMATIC", fuel: "PETROL", body: "SUV", drive: "FOUR_WD", condition: "NEW", engine: "4.0L Twin-Turbo V8", cc: 4.0, hp: 577, seats: 5, ext: "Obsidian Black", int: "Macchiato Beige Nappa", location: "Lagos", featured: true, torque: "850 Nm", zeroTo100: "4.5 s", topSpeed: "220 km/h", fuelEconomy: "16.2 L/100km", features: ["AMG Night Package", "Burmester 3D Surround Sound", "Three locking differentials", "Massage front seats"], blurb: "The icon in its most uncompromising form. Hand-built AMG V8, three locking differentials and an interior finished in Nappa leather with carbon trim." },
  { brand: "mercedes-benz", model: "S 580", trim: "4MATIC", year: 2024, price: 295_000_000, previousPrice: 318_000_000, mileage: 4_200, transmission: "AUTOMATIC", fuel: "PETROL", body: "SEDAN", drive: "AWD", condition: "FOREIGN_USED", engine: "4.0L V8 Biturbo with EQ Boost", cc: 4.0, hp: 496, seats: 5, ext: "Emerald Green Metallic", int: "Black Exclusive Nappa", location: "Lagos", featured: true, torque: "700 Nm", zeroTo100: "4.4 s", topSpeed: "250 km/h", fuelEconomy: "10.3 L/100km", features: ["Executive rear seating", "Rear-axle steering", "MBUX Hyperscreen", "Air-balance fragrance"], blurb: "The world's reference saloon. Chauffeur-grade rear seating, rear-axle steering and an almost silent cabin." },
  { brand: "mercedes-benz", model: "GLE 450", trim: "4MATIC", year: 2023, price: 128_000_000, mileage: 18_500, transmission: "AUTOMATIC", fuel: "HYBRID", body: "SUV", drive: "AWD", condition: "FOREIGN_USED", engine: "3.0L Inline-6 Turbo + EQ Boost", cc: 3.0, hp: 375, seats: 7, ext: "Polar White", int: "Espresso Brown", location: "Abuja", torque: "500 Nm", zeroTo100: "5.7 s", topSpeed: "250 km/h", fuelEconomy: "9.4 L/100km", features: ["Third-row seating", "E-Active Body Control", "Panoramic roof", "360° camera"], blurb: "Mild-hybrid smoothness, seven seats and a cabin that soaks up any road. A family SUV with genuine luxury credentials." },
  { brand: "mercedes-benz", model: "C 300", trim: "AMG Line", year: 2022, price: 58_500_000, mileage: 32_000, transmission: "AUTOMATIC", fuel: "PETROL", body: "SEDAN", drive: "RWD", condition: "FOREIGN_USED", engine: "2.0L Turbo I4", cc: 2.0, hp: 255, seats: 5, ext: "Selenite Grey", int: "Black Artico", location: "Lagos", torque: "400 Nm", zeroTo100: "6.0 s", topSpeed: "250 km/h", fuelEconomy: "7.4 L/100km", features: ["AMG body styling", "64-colour ambient lighting", "Wireless CarPlay", "Digital cockpit"], blurb: "A baby S-Class in looks and feel. Efficient turbo power with AMG Line styling and the latest MBUX interior.", rent: [180_000, 1_100_000, 3_900_000, 500_000] },
  { brand: "bmw", model: "X7", trim: "xDrive40i M Sport", year: 2024, price: 210_000_000, mileage: 6_800, transmission: "AUTOMATIC", fuel: "PETROL", body: "SUV", drive: "AWD", condition: "FOREIGN_USED", engine: "3.0L TwinPower Turbo I6", cc: 3.0, hp: 375, seats: 7, ext: "Carbon Black", int: "Ivory White Merino", location: "Lagos", featured: true, torque: "520 Nm", zeroTo100: "5.8 s", topSpeed: "250 km/h", fuelEconomy: "10.1 L/100km", features: ["Sky Lounge panoramic roof", "Crystal gear selector", "Bowers & Wilkins audio", "Executive Drive Pro"], blurb: "BMW's flagship SUV pairs a commanding presence with a lounge-like three-row cabin.", rent: [450_000, 2_800_000, 10_500_000, 1_500_000] },
  { brand: "bmw", model: "M5", trim: "Competition", year: 2024, price: 185_000_000, mileage: 2_100, transmission: "AUTOMATIC", fuel: "PLUG_IN_HYBRID", body: "SEDAN", drive: "AWD", condition: "NEW", engine: "4.4L Twin-Turbo V8 PHEV", cc: 4.4, hp: 717, seats: 5, ext: "Isle of Man Green", int: "Black Merino", location: "Lagos", featured: true, torque: "1,000 Nm", zeroTo100: "3.5 s", topSpeed: "305 km/h", fuelEconomy: "1.7 L/100km (WLTP weighted)", features: ["M Carbon exterior", "M Driver's Package", "Electric-only range 69 km", "M Sport differential"], blurb: "Seven hundred horsepower in a business suit. The electrified M5 is the fastest saloon BMW has ever built." },
  { brand: "bmw", model: "530i", trim: "M Sport", year: 2021, price: 42_000_000, mileage: 46_000, transmission: "AUTOMATIC", fuel: "PETROL", body: "SEDAN", drive: "RWD", condition: "LOCAL_USED", engine: "2.0L TwinPower Turbo I4", cc: 2.0, hp: 248, seats: 5, ext: "Mineral White", int: "Cognac Dakota", location: "Abuja", torque: "350 Nm", zeroTo100: "6.2 s", topSpeed: "250 km/h", fuelEconomy: "6.8 L/100km", features: ["Full service history", "Harman Kardon audio", "Head-up display", "Comfort access"], blurb: "A beautifully balanced executive saloon with a full BMW service history and one careful owner." },
  { brand: "bmw", model: "i7", trim: "xDrive60", year: 2024, price: 265_000_000, mileage: 3_500, transmission: "AUTOMATIC", fuel: "ELECTRIC", body: "SEDAN", drive: "AWD", condition: "FOREIGN_USED", engine: "Dual electric motors", cc: null, hp: 536, seats: 5, ext: "Oxide Grey / Black two-tone", int: "Smoke White Merino", location: "Lagos", torque: "745 Nm", zeroTo100: "4.7 s", topSpeed: "240 km/h", fuelEconomy: "625 km range", features: ["31-inch rear Theatre Screen", "Executive Lounge seating", "Automatic doors", "Swarovski crystal lights"], blurb: "Silent, effortless and astonishingly refined — the i7 reimagines the luxury limousine for the electric age." },
  { brand: "toyota", model: "Land Cruiser 300", trim: "VXR", year: 2024, price: 245_000_000, mileage: 0, transmission: "AUTOMATIC", fuel: "PETROL", body: "SUV", drive: "FOUR_WD", condition: "NEW", engine: "3.5L Twin-Turbo V6", cc: 3.5, hp: 409, seats: 7, ext: "Precious White Pearl", int: "Beige Leather", location: "Lagos", featured: true, torque: "650 Nm", zeroTo100: "6.7 s", topSpeed: "210 km/h", fuelEconomy: "11.9 L/100km", features: ["Multi-terrain select", "Cool box", "JBL premium audio", "Rear entertainment"], blurb: "The go-anywhere legend. Body-on-frame toughness, twin-turbo V6 power and VXR luxury for Nigerian roads and beyond.", rent: [380_000, 2_400_000, 9_000_000, 1_000_000] },
  { brand: "toyota", model: "Camry", trim: "XSE", year: 2022, price: 38_500_000, mileage: 28_000, transmission: "AUTOMATIC", fuel: "PETROL", body: "SEDAN", drive: "FWD", condition: "FOREIGN_USED", engine: "2.5L Dynamic Force I4", cc: 2.5, hp: 206, seats: 5, ext: "Celestial Silver", int: "Black / Red SofTex", location: "Lagos", torque: "250 Nm", zeroTo100: "7.6 s", topSpeed: "210 km/h", fuelEconomy: "6.9 L/100km", features: ["Panoramic roof", "Toyota Safety Sense 2.5+", "JBL audio", "Sport-tuned suspension"], blurb: "Nigeria's favourite saloon in its sportiest XSE form — reliable, efficient and sharp to drive.", rent: [85_000, 520_000, 1_850_000, 200_000] },
  { brand: "toyota", model: "Hilux", trim: "Adventure 2.8 GD-6", year: 2023, price: 62_000_000, mileage: 15_000, transmission: "AUTOMATIC", fuel: "DIESEL", body: "PICKUP", drive: "FOUR_WD", condition: "LOCAL_USED", engine: "2.8L GD-6 Turbo Diesel", cc: 2.8, hp: 201, seats: 5, ext: "Glacier White", int: "Black Leather", location: "Port Harcourt", torque: "500 Nm", zeroTo100: "10.7 s", topSpeed: "180 km/h", fuelEconomy: "8.4 L/100km", features: ["Diff lock", "Tow bar", "Leather seats", "Downhill assist"], blurb: "The unbreakable workhorse. Strong diesel torque, genuine 4×4 hardware and a comfortable leather cabin.", rent: [120_000, 750_000, 2_600_000, 300_000] },
  { brand: "toyota", model: "Prado", trim: "TXL", year: 2021, price: 74_000_000, mileage: 39_000, transmission: "AUTOMATIC", fuel: "PETROL", body: "SUV", drive: "FOUR_WD", condition: "FOREIGN_USED", engine: "4.0L V6", cc: 4.0, hp: 271, seats: 7, ext: "Attitude Black", int: "Grey Leather", location: "Abuja", torque: "381 Nm", zeroTo100: "9.4 s", topSpeed: "175 km/h", fuelEconomy: "11.3 L/100km", features: ["Crawl control", "Sunroof", "Cooled seats", "Reversing camera"], blurb: "The right-sized Land Cruiser: tough, comfortable and holds its value better than almost anything on the road." },
  { brand: "lexus", model: "LX 600", trim: "Ultra Luxury", year: 2024, price: 265_000_000, mileage: 1_200, transmission: "AUTOMATIC", fuel: "PETROL", body: "SUV", drive: "FOUR_WD", condition: "FOREIGN_USED", engine: "3.4L Twin-Turbo V6", cc: 3.4, hp: 409, seats: 4, ext: "Sonic Titanium", int: "Black/Sunflower Semi-Aniline", location: "Lagos", featured: true, torque: "650 Nm", zeroTo100: "6.9 s", topSpeed: "210 km/h", fuelEconomy: "12.4 L/100km", features: ["Four-seat Ultra Luxury layout", "Reclining rear seats with ottoman", "Mark Levinson 25-speaker audio", "Rear refrigerator"], blurb: "Four-seat Ultra Luxury configuration turns the LX into a private jet on wheels, without losing an ounce of off-road ability.", rent: [500_000, 3_100_000, 11_500_000, 1_500_000] },
  { brand: "lexus", model: "RX 350h", trim: "Premium", year: 2023, price: 89_000_000, mileage: 12_000, transmission: "AUTOMATIC", fuel: "HYBRID", body: "SUV", drive: "AWD", condition: "FOREIGN_USED", engine: "2.5L Hybrid I4", cc: 2.5, hp: 246, seats: 5, ext: "Nebula Grey Pearl", int: "Palomino", location: "Lagos", torque: "239 Nm", zeroTo100: "7.9 s", topSpeed: "200 km/h", fuelEconomy: "6.4 L/100km", features: ["Self-charging hybrid", "14-inch touchscreen", "Heated & ventilated seats", "Lexus Safety System+ 3.0"], blurb: "The quiet achiever. Effortless hybrid efficiency in a beautifully crafted, all-new RX." },
  { brand: "lexus", model: "ES 350", trim: "F Sport", year: 2022, price: 52_000_000, mileage: 24_000, transmission: "AUTOMATIC", fuel: "PETROL", body: "SEDAN", drive: "FWD", condition: "FOREIGN_USED", engine: "3.5L V6", cc: 3.5, hp: 302, seats: 5, ext: "Ultra White", int: "Circuit Red", location: "Abuja", torque: "362 Nm", zeroTo100: "6.6 s", topSpeed: "210 km/h", fuelEconomy: "8.7 L/100km", features: ["Adaptive variable suspension", "Mark Levinson audio", "F Sport seats", "Blind-spot monitor"], blurb: "Velvet-smooth V6 power and Lexus reliability with a sharper F Sport edge." , rent: [140_000, 880_000, 3_100_000, 400_000] },
  { brand: "audi", model: "RS Q8", trim: "Performance", year: 2025, price: 235_000_000, mileage: 0, transmission: "AUTOMATIC", fuel: "PETROL", body: "SUV", drive: "AWD", condition: "NEW", engine: "4.0L Twin-Turbo V8", cc: 4.0, hp: 631, seats: 5, ext: "Sakhir Gold", int: "Black Valcona with honeycomb", location: "Lagos", featured: true, torque: "850 Nm", zeroTo100: "3.6 s", topSpeed: "305 km/h", fuelEconomy: "12.1 L/100km", features: ["Ceramic brakes", "Electromechanical active roll stabilisation", "All-wheel steering", "Bang & Olufsen 3D"], blurb: "The most powerful Audi SUV ever built. 631 horsepower, all-wheel steering and supercar pace for five." },
  { brand: "audi", model: "A6", trim: "55 TFSI quattro", year: 2022, price: 49_000_000, mileage: 31_000, transmission: "AUTOMATIC", fuel: "PETROL", body: "SEDAN", drive: "AWD", condition: "FOREIGN_USED", engine: "3.0L TFSI V6", cc: 3.0, hp: 335, seats: 5, ext: "Navarra Blue", int: "Okapi Brown", location: "Lagos", torque: "500 Nm", zeroTo100: "5.1 s", topSpeed: "250 km/h", fuelEconomy: "8.1 L/100km", features: ["Virtual cockpit plus", "Matrix LED headlights", "quattro AWD", "Four-zone climate"], blurb: "Understated, fast and immaculately built — the thinking person's executive saloon." },
  { brand: "audi", model: "e-tron GT", trim: "RS", year: 2023, price: 158_000_000, mileage: 8_500, transmission: "AUTOMATIC", fuel: "ELECTRIC", body: "COUPE", drive: "AWD", condition: "FOREIGN_USED", engine: "Dual electric motors, 93 kWh", cc: null, hp: 637, seats: 4, ext: "Tactical Green", int: "Black Dinamica", location: "Lagos", torque: "830 Nm", zeroTo100: "3.3 s", topSpeed: "250 km/h", fuelEconomy: "472 km range", features: ["800V fast charging", "Carbon roof", "Air suspension", "Head-up display"], blurb: "Gran turismo proportions, 800-volt architecture and savage, silent acceleration." },
  { brand: "porsche", model: "911", trim: "Carrera GTS", year: 2025, price: 315_000_000, mileage: 0, transmission: "AUTOMATIC", fuel: "HYBRID", body: "COUPE", drive: "RWD", condition: "NEW", engine: "3.6L T-Hybrid Flat-6", cc: 3.6, hp: 532, seats: 4, ext: "Shade Green Metallic", int: "Black / Slate Grey Race-Tex", location: "Lagos", featured: true, torque: "610 Nm", zeroTo100: "3.0 s", topSpeed: "312 km/h", fuelEconomy: "11.0 L/100km", features: ["T-Hybrid electric turbo", "Sport Chrono package", "Rear-axle steering", "Porsche Ceramic Composite Brakes"], blurb: "The first hybrid 911. An electrically assisted turbo delivers instant response with the purity of a flat-six." },
  { brand: "porsche", model: "Cayenne", trim: "Turbo E-Hybrid Coupé", year: 2024, price: 225_000_000, mileage: 5_400, transmission: "AUTOMATIC", fuel: "PLUG_IN_HYBRID", body: "SUV", drive: "AWD", condition: "FOREIGN_USED", engine: "4.0L Twin-Turbo V8 PHEV", cc: 4.0, hp: 729, seats: 4, ext: "Carrara White", int: "Bordeaux Red", location: "Abuja", torque: "950 Nm", zeroTo100: "3.7 s", topSpeed: "295 km/h", fuelEconomy: "1.5 L/100km (weighted)", features: ["Lightweight Sport Package", "Passenger display", "Burmester audio", "Porsche Active Suspension Management"], blurb: "The most powerful Cayenne ever — a plug-in hybrid SUV with Turbo performance and electric silence on demand.", rent: [650_000, 4_100_000, 15_000_000, 2_500_000] },
  { brand: "porsche", model: "Taycan", trim: "4S", year: 2023, price: 128_000_000, previousPrice: 139_000_000, mileage: 11_000, transmission: "AUTOMATIC", fuel: "ELECTRIC", body: "SEDAN", drive: "AWD", condition: "CERTIFIED_PRE_OWNED", engine: "Dual electric motors, 93 kWh Performance Battery Plus", cc: null, hp: 563, seats: 4, ext: "Frozen Blue", int: "Black Race-Tex", location: "Lagos", torque: "640 Nm", zeroTo100: "4.0 s", topSpeed: "250 km/h", fuelEconomy: "463 km range", features: ["Porsche Approved warranty", "Adaptive air suspension", "Bose surround", "Panoramic roof"], blurb: "A Porsche first, electric second. Certified with a Porsche Approved warranty and a full charging package." },
  { brand: "range-rover", model: "Range Rover", trim: "Autobiography LWB", year: 2025, price: 395_000_000, mileage: 0, transmission: "AUTOMATIC", fuel: "PETROL", body: "SUV", drive: "AWD", condition: "NEW", engine: "4.4L Twin-Turbo V8", cc: 4.4, hp: 523, seats: 5, ext: "Belgravia Green", int: "Perlino / Caraway Semi-Aniline", location: "Lagos", featured: true, torque: "750 Nm", zeroTo100: "4.7 s", topSpeed: "250 km/h", fuelEconomy: "12.0 L/100km", features: ["Executive Class rear seats", "Meridian Signature 1600W", "All-wheel steering", "Cabin air purification Pro"], blurb: "Serene, spacious and supremely capable. The long-wheelbase Autobiography is the definitive modern luxury SUV.", rent: [750_000, 4_700_000, 17_500_000, 2_500_000] },
  { brand: "range-rover", model: "Range Rover Sport", trim: "Dynamic HSE", year: 2024, price: 178_000_000, mileage: 7_600, transmission: "AUTOMATIC", fuel: "HYBRID", body: "SUV", drive: "AWD", condition: "FOREIGN_USED", engine: "3.0L Inline-6 MHEV", cc: 3.0, hp: 395, seats: 5, ext: "Charente Grey", int: "Ebony Windsor", location: "Abuja", torque: "550 Nm", zeroTo100: "5.4 s", topSpeed: "242 km/h", fuelEconomy: "9.1 L/100km", features: ["Dynamic Air Suspension", "Pivi Pro", "Terrain Response 2", "Heated steering wheel"], blurb: "Sharper and more athletic than its big brother, with the same unflappable composure on any surface.", rent: [420_000, 2_650_000, 9_800_000, 1_500_000] },
  { brand: "range-rover", model: "Velar", trim: "R-Dynamic SE", year: 2022, price: 69_000_000, mileage: 27_000, transmission: "AUTOMATIC", fuel: "PETROL", body: "SUV", drive: "AWD", condition: "LOCAL_USED", engine: "2.0L Turbo I4", cc: 2.0, hp: 247, seats: 5, ext: "Fuji White", int: "Light Oyster", location: "Lagos", torque: "365 Nm", zeroTo100: "7.5 s", topSpeed: "217 km/h", fuelEconomy: "8.9 L/100km", features: ["Flush door handles", "Touch Pro Duo", "Meridian audio", "Matrix LED"], blurb: "The design-led Range Rover. Minimalist, elegant and refreshingly easy to live with." },
  { brand: "tesla", model: "Model S", trim: "Plaid", year: 2024, price: 142_000_000, mileage: 4_000, transmission: "AUTOMATIC", fuel: "ELECTRIC", body: "SEDAN", drive: "AWD", condition: "FOREIGN_USED", engine: "Tri-motor, 100 kWh", cc: null, hp: 1020, seats: 5, ext: "Ultra Red", int: "Black", location: "Lagos", featured: true, torque: "1,420 Nm", zeroTo100: "2.1 s", topSpeed: "322 km/h", fuelEconomy: "600 km range", features: ["Tri-motor torque vectoring", "Yoke steering", "17-inch cinematic display", "Home charger included"], blurb: "Over 1,000 horsepower and a 0–100 time that embarrasses hypercars. Comes with a home charger and installation." },
  { brand: "tesla", model: "Model Y", trim: "Long Range", year: 2023, price: 56_000_000, mileage: 19_000, transmission: "AUTOMATIC", fuel: "ELECTRIC", body: "SUV", drive: "AWD", condition: "FOREIGN_USED", engine: "Dual motor, 75 kWh", cc: null, hp: 384, seats: 5, ext: "Pearl White", int: "Black", location: "Abuja", torque: "510 Nm", zeroTo100: "5.0 s", topSpeed: "217 km/h", fuelEconomy: "533 km range", features: ["Autopilot", "Glass roof", "Heat pump", "Wall connector included"], blurb: "The practical electric crossover — spacious, efficient and quick, with free wall-connector installation in Lagos and Abuja.", rent: [150_000, 950_000, 3_400_000, 400_000] },
  { brand: "tesla", model: "Model 3", trim: "Performance", year: 2024, price: 48_000_000, mileage: 6_500, transmission: "AUTOMATIC", fuel: "ELECTRIC", body: "SEDAN", drive: "AWD", condition: "FOREIGN_USED", engine: "Dual motor, 79 kWh", cc: null, hp: 510, seats: 5, ext: "Stealth Grey", int: "Black", location: "Lagos", torque: "741 Nm", zeroTo100: "3.1 s", topSpeed: "262 km/h", fuelEconomy: "528 km range", features: ["Adaptive damping", "Track Mode", "Ventilated seats", "Rear touchscreen"], blurb: "The 'Highland' Model 3 Performance — sharper, quieter and quicker than ever." },
  { brand: "lamborghini", model: "Urus", trim: "SE", year: 2025, price: 520_000_000, mileage: 0, transmission: "AUTOMATIC", fuel: "PLUG_IN_HYBRID", body: "SUV", drive: "AWD", condition: "NEW", engine: "4.0L Twin-Turbo V8 PHEV", cc: 4.0, hp: 789, seats: 5, ext: "Giallo Auge", int: "Nero Ade / Giallo stitching", location: "Lagos", featured: true, torque: "950 Nm", zeroTo100: "3.4 s", topSpeed: "312 km/h", fuelEconomy: "60 km electric range", features: ["Carbon ceramic brakes", "Bang & Olufsen 3D", "Night vision", "Ad Personam interior"], blurb: "The super SUV, electrified. 789 horsepower and Lamborghini theatre — with the ability to glide silently through the city.", rent: [1_500_000, 9_500_000, 35_000_000, 5_000_000] },
  { brand: "lamborghini", model: "Huracán", trim: "EVO Spyder", year: 2022, price: 365_000_000, mileage: 9_800, transmission: "AUTOMATIC", fuel: "PETROL", body: "CONVERTIBLE", drive: "AWD", condition: "FOREIGN_USED", engine: "5.2L Naturally Aspirated V10", cc: 5.2, hp: 631, seats: 2, ext: "Verde Mantis", int: "Nero Ade", location: "Lagos", torque: "600 Nm", zeroTo100: "3.1 s", topSpeed: "325 km/h", fuelEconomy: "14.1 L/100km", features: ["LDVI dynamics", "Lifting system", "Sensonum audio", "Electric soft-top in 17 s"], blurb: "One of the last naturally aspirated V10s — 8,000 rpm of open-air drama." },
  { brand: "ferrari", model: "Roma", trim: "Spider", year: 2024, price: 410_000_000, mileage: 2_300, transmission: "AUTOMATIC", fuel: "PETROL", body: "CONVERTIBLE", drive: "RWD", condition: "FOREIGN_USED", engine: "3.9L Twin-Turbo V8", cc: 3.9, hp: 612, seats: 4, ext: "Blu Pozzi", int: "Cuoio", location: "Lagos", featured: true, torque: "760 Nm", zeroTo100: "3.4 s", topSpeed: "320 km/h", fuelEconomy: "11.9 L/100km", features: ["Soft-top in 13.5 s", "Wind deflector integrated in rear seat", "Passenger display", "Ferrari Dynamic Enhancer"], blurb: "La Nuova Dolce Vita. Timeless front-engined proportions with a fabric roof and 612 horsepower." },
  { brand: "ferrari", model: "Purosangue", year: 2024, price: 780_000_000, mileage: 1_100, transmission: "AUTOMATIC", fuel: "PETROL", body: "SUV", drive: "AWD", condition: "FOREIGN_USED", engine: "6.5L Naturally Aspirated V12", cc: 6.5, hp: 715, seats: 4, ext: "Rosso Imola", int: "Nero / Rosso", location: "Lagos", torque: "716 Nm", zeroTo100: "3.3 s", topSpeed: "310 km/h", fuelEconomy: "17.3 L/100km", features: ["Rear-hinged welcome doors", "Active suspension", "Burmester 3D", "Carbon roof"], blurb: "Ferrari's first four-door, four-seat car, powered by a naturally aspirated V12. Rarer than any supercar on the road." },
  { brand: "ferrari", model: "296", trim: "GTB", year: 2023, price: 450_000_000, previousPrice: 485_000_000, mileage: 4_700, transmission: "AUTOMATIC", fuel: "PLUG_IN_HYBRID", body: "COUPE", drive: "RWD", condition: "FOREIGN_USED", engine: "3.0L Twin-Turbo V6 PHEV", cc: 3.0, hp: 819, seats: 2, ext: "Rosso Corsa", int: "Nero Alcantara", location: "Abuja", torque: "740 Nm", zeroTo100: "2.9 s", topSpeed: "330 km/h", fuelEconomy: "25 km electric range", features: ["Assetto Fiorano package", "eManettino", "Carbon fibre wheels", "JBL Professional audio"], blurb: "Ferrari's hybrid V6 berlinetta — 819 horsepower and the most agile Ferrari road car in a generation." },
];

async function main() {
  console.log("Seeding VELORA…");
  await prisma.$transaction([
    prisma.payment.deleteMany(), prisma.orderItem.deleteMany(), prisma.order.deleteMany(), prisma.rentalBooking.deleteMany(),
    prisma.rentalAvailability.deleteMany(), prisma.comparisonItem.deleteMany(), prisma.comparison.deleteMany(), prisma.wishlist.deleteMany(),
    prisma.review.deleteMany(), prisma.notification.deleteMany(), prisma.activityLog.deleteMany(), prisma.contactEnquiry.deleteMany(),
    prisma.promotion.deleteMany(), prisma.vehicleSpecification.deleteMany(), prisma.vehicleImage.deleteMany(), prisma.vehicle.deleteMany(),
    prisma.vehicleBrand.deleteMany(), prisma.banner.deleteMany(), prisma.testimonial.deleteMany(), prisma.newsletterSubscription.deleteMany(),
    prisma.session.deleteMany(), prisma.passwordResetToken.deleteMany(), prisma.user.deleteMany(),
  ]);

  const brands = new Map<string, string>();
  for (const b of BRANDS) {
    const created = await prisma.vehicleBrand.create({ data: { ...b, heroImage: u(PHOTOS[b.slug][0]) } });
    brands.set(b.slug, created.id);
  }

  const now = Date.now();
  const vehicleIds: string[] = [];
  for (const [i, v] of V.entries()) {
    const brandName = BRANDS.find((b) => b.slug === v.brand)!.name;
    const slug = `${v.year}-${brandName}-${v.model}-${v.trim ?? ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const photos = PHOTOS[v.brand];
    const imgs = [0, 1, 2].map((k) => photos[(i + k) % photos.length]);
    const created = await prisma.vehicle.create({
      data: {
        slug, brandId: brands.get(v.brand)!, model: v.model, trim: v.trim, year: v.year, price: v.price, previousPrice: v.previousPrice,
        mileage: v.mileage, transmission: v.transmission, fuelType: v.fuel, bodyType: v.body, drivetrain: v.drive, condition: v.condition,
        engine: v.engine, engineCapacity: v.cc, horsepower: v.hp, seats: v.seats, exteriorColor: v.ext, interiorColor: v.int, location: v.location,
        description: `${v.blurb}\n\nEvery VELORA vehicle passes a 180-point inspection, comes with verified documentation (customs, ownership and service records where applicable) and is offered with transparent, all-inclusive pricing. Viewing appointments and test drives are available at our ${v.location} showroom.`,
        featured: v.featured ?? false, forSale: v.forSale ?? true, forRent: Boolean(v.rent),
        dailyRate: v.rent?.[0], weeklyRate: v.rent?.[1], monthlyRate: v.rent?.[2], securityDeposit: v.rent?.[3],
        viewCount: Math.floor(((i * 7919) % 900) + 40),
        createdAt: new Date(now - (V.length - i) * 36 * 3600_000),
        images: { create: imgs.map((id, position) => ({ url: u(id), alt: `${v.year} ${brandName} ${v.model} — view ${position + 1}`, position })) },
        specifications: {
          create: [
            { group: "Performance", label: "Torque", value: v.torque, position: 0 },
            { group: "Performance", label: "0–100 km/h", value: v.zeroTo100, position: 1 },
            { group: "Performance", label: "Top speed", value: v.topSpeed, position: 2 },
            { group: "Efficiency", label: v.fuel === "ELECTRIC" ? "Range" : "Fuel economy", value: v.fuelEconomy, position: 0 },
            ...v.features.map((f, k) => ({ group: "Highlights", label: `Feature ${k + 1}`, value: f, position: k })),
          ],
        },
      },
    });
    vehicleIds.push(created.id);
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "yousuph15@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Velora!Admin2026";
  const admin = await prisma.user.create({ data: { email: adminEmail, name: "VELORA Admin", phone: "+2349034824292", role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 12), emailVerified: new Date() } });
  const customerHash = await bcrypt.hash("Customer123", 12);
  const customers = await Promise.all(
    [
      ["amara.okafor@example.com", "Amara Okafor", "+234 803 555 0101"],
      ["tunde.bello@example.com", "Tunde Bello", "+234 805 555 0144"],
      ["zainab.musa@example.com", "Zainab Musa", "+234 809 555 0177"],
      ["chidi.eze@example.com", "Chidi Eze", "+234 802 555 0123"],
    ].map(([email, name, phone], k) => prisma.user.create({ data: { email, name, phone, passwordHash: customerHash, createdAt: new Date(now - (60 - k * 12) * 86_400_000) } })),
  );

  // Historic demo commerce data (clearly marked) so dashboards and charts have content.
  const soldPicks = [6, 10, 13, 16, 23];
  for (const [k, idx] of soldPicks.entries()) {
    const vid = vehicleIds[idx];
    const v = V[idx];
    const brandName = BRANDS.find((b) => b.slug === v.brand)!.name;
    const created = new Date(now - (150 - k * 28) * 86_400_000);
    const customer = customers[k % customers.length];
    const completed = k < 3;
    await prisma.order.create({
      data: {
        orderNumber: `VO-DEMO${k + 1}0`, userId: customer.id, status: completed ? "COMPLETED" : "PROCESSING", paymentOption: "RESERVATION_DEPOSIT",
        subtotal: v.price, amountDue: Math.round(v.price * 0.1), customerName: customer.name, email: customer.email, phone: customer.phone ?? "+2348000000000",
        fulfilment: "COLLECTION", billingName: customer.name, billingAddress: "Lekki Phase 1, Lagos", createdAt: created,
        adminNote: "Demo seed order",
        items: { create: { vehicleId: vid, title: `${v.year} ${brandName} ${v.model}`, unitPrice: v.price } },
        payments: { create: { provider: "SEED", reference: `SEED-${k + 1}-${vid.slice(-6)}`, amount: completed ? v.price : Math.round(v.price * 0.1), currency: "NGN", status: "SUCCESS", channel: "bank_transfer", gatewayResponse: "Demo seed data — not a real transaction", paidAt: created, createdAt: created } },
      },
    });
    await prisma.vehicle.update({ where: { id: vid }, data: { status: completed ? "SOLD" : "RESERVED" } });
  }
  await prisma.order.create({
    data: {
      orderNumber: "VO-DEMO60", userId: customers[0].id, status: "PENDING", paymentOption: "ENQUIRY", subtotal: V[0].price, amountDue: 0,
      customerName: customers[0].name, email: customers[0].email, phone: customers[0].phone!, fulfilment: "DELIVERY", deliveryAddress: "5 Bourdillon Road, Ikoyi", city: "Lagos", state: "Lagos",
      billingName: customers[0].name, billingAddress: "5 Bourdillon Road, Ikoyi, Lagos", notes: "Interested in financing over 24 months.",
      items: { create: { vehicleId: vehicleIds[0], title: "2025 Mercedes-Benz G 63 AMG", unitPrice: V[0].price } },
    },
  });

  // Rentals: one completed in the past, one confirmed upcoming, one pending.
  const rentalIdx = V.map((v, i) => (v.rent && ![6, 10, 13, 16, 23].includes(i) ? i : -1)).filter((i) => i >= 0);
  const day = 86_400_000;
  const mk = async (k: number, startOffsetDays: number, days: number, status: "COMPLETED" | "CONFIRMED" | "PENDING") => {
    const idx = rentalIdx[k];
    const r = V[idx].rent!;
    const pickupAt = new Date(Math.floor((now + startOffsetDays * day) / day) * day + 9 * 3600_000);
    const customer = customers[k % customers.length];
    await prisma.rentalBooking.create({
      data: {
        bookingNumber: `VR-DEMO${k + 1}`, userId: customer.id, vehicleId: vehicleIds[idx], status, pickupLocation: "VELORA Lekki Showroom, Lagos", returnLocation: "VELORA Lekki Showroom, Lagos",
        pickupAt, returnAt: new Date(pickupAt.getTime() + days * day), days, rateType: days >= 7 ? "WEEKLY" : "DAILY",
        rentalCost: days >= 7 ? r[1] + (days - 7) * r[0] : days * r[0], extrasCost: 0, securityDeposit: r[3], total: days >= 7 ? r[1] + (days - 7) * r[0] : days * r[0],
        extras: [], customerName: customer.name, email: customer.email, phone: customer.phone!, driverLicense: `LAG-${1000 + k}-DL`, createdAt: new Date(now - (20 - k) * day),
      },
    });
  };
  await mk(0, -30, 4, "COMPLETED");
  await mk(1, 5, 7, "CONFIRMED");
  await mk(2, 12, 3, "PENDING");
  await mk(3, -12, 2, "COMPLETED");

  await prisma.rentalAvailability.create({ data: { vehicleId: vehicleIds[rentalIdx[0]], startsAt: new Date(now + 20 * day), endsAt: new Date(now + 23 * day), type: "MAINTENANCE", reason: "Scheduled service" } });

  await prisma.wishlist.createMany({ data: [0, 18, 21, 27].map((i) => ({ userId: customers[0].id, vehicleId: vehicleIds[i] })) });
  await prisma.review.createMany({
    data: [
      { userId: customers[1].id, vehicleId: vehicleIds[0], rating: 5, title: "Flawless handover", body: "Viewed the G 63 on a Saturday; documentation was ready and the advisor walked me through every detail. Exceptional." },
      { userId: customers[2].id, vehicleId: vehicleIds[8], rating: 5, title: "Exactly as described", body: "The Land Cruiser matched the listing perfectly. Transparent pricing — no surprises at the end." },
      { userId: customers[3].id, vehicleId: vehicleIds[4], rating: 4, title: "Great rental experience", body: "Rented the X7 for a wedding weekend. Car was spotless and delivered on time." },
    ],
  });

  await prisma.testimonial.createMany({
    data: [
      { name: "Adaeze N.", title: "Purchased a Range Rover Autobiography", quote: "VELORA made buying a car at this level feel effortless. Every document was verified before I even asked, and the handover was a genuine occasion.", rating: 5, position: 0 },
      { name: "Kunle A.", title: "Rented a Lexus LX 600 for a week", quote: "Booked online in minutes, the chauffeur arrived early and the car was immaculate. I won't use anyone else in Lagos.", rating: 5, position: 1 },
      { name: "Fatima B.", title: "Purchased a Tesla Model Y", quote: "They installed my home charger the day the car arrived and walked me through everything. Transparent from first click to keys.", rating: 5, position: 2 },
      { name: "Emeka O.", title: "Purchased a Porsche 911 GTS", quote: "The comparison tools and honest advice helped me choose the right spec. The reservation deposit process was clear and secure.", rating: 5, position: 3 },
    ],
  });
  await prisma.promotion.createMany({
    data: [
      { title: "Taycan 4S — Certified Offer", description: "Save ₦11M on a Porsche Approved Taycan 4S with remaining factory warranty.", badge: "Save ₦11M", imageUrl: u(PHOTOS.porsche[2]), ctaLabel: "View offer", ctaHref: `/cars/2023-porsche-taycan-4s`, vehicleId: vehicleIds[21] },
      { title: "Weekend Supercar Experience", description: "Rent any supercar for 3 days and get complimentary chauffeur service on day one.", badge: "Rentals", imageUrl: u(PHOTOS.lamborghini[0]), ctaLabel: "Explore rentals", ctaHref: "/rentals" },
      { title: "Electric Switch Programme", description: "Free home wall-charger installation with every Tesla, Porsche Taycan or BMW i7 purchase.", badge: "EV", imageUrl: u(PHOTOS.tesla[0]), ctaLabel: "Shop electric", ctaHref: "/cars?fuel=ELECTRIC" },
    ],
  });
  await prisma.banner.create({ data: { eyebrow: "The 2025 Collection", title: "Find Your Drive. Define Your Journey.", subtitle: "Explore exceptional vehicles, discover exclusive deals and experience a smarter way to buy or rent your next car.", imageUrl: u("photo-1503376780353-7e6692767b70"), ctaLabel: "Explore Vehicles", ctaHref: "/cars" } });
  await prisma.contactEnquiry.create({ data: { userId: customers[1].id, vehicleId: vehicleIds[17], type: "TEST_DRIVE", name: customers[1].name, email: customers[1].email, phone: customers[1].phone, subject: "Test drive — Porsche 911 Carrera GTS", message: "Could I arrange a test drive this Saturday morning at the Lekki showroom?" } });
  await prisma.notification.createMany({
    data: [
      { userId: customers[0].id, type: "WELCOME", title: "Welcome to VELORA", message: "Your account is ready. Save vehicles, compare and book in a few clicks.", link: "/cars" },
      { userId: admin.id, type: "SYSTEM", title: "Seed data loaded", message: "Demo inventory, customers and orders were created. Demo payments are marked 'SEED'." },
    ],
  });

  console.log(`✔ ${BRANDS.length} brands, ${V.length} vehicles, ${customers.length} customers`);
  console.log(`✔ Admin: ${adminEmail} / ${adminPassword}`);
  console.log("✔ Customers: amara.okafor@example.com (and others) / Customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
