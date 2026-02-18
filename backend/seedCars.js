const mongoose = require('mongoose');
require('dotenv').config();
const PetrolCar = require('./models/PetrolCar');
const DieselCar = require('./models/DieselCar');
const EVCar = require('./models/EVCar');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const cars = [
  {
    brand: "Maruti Suzuki",
    petrol: [
      "Alto K10",
      "S-Presso",
      "Celerio",
      "WagonR",
      "Swift",
      "Baleno",
      "Ignis",
      "Dzire",
      "Brezza",
      "Fronx",
      "Ertiga",
      "XL6"
    ],
    diesel: [],
    ev: ["eVX"]
  },
  {
    brand: "Hyundai",
    petrol: [
      "Grand i10 Nios",
      "i20",
      "Venue",
      "Creta",
      "Verna",
      "Exter",
      "Alcazar",
      "Tucson"
    ],
    diesel: [
      "Venue",
      "Creta",
      "Alcazar",
      "Tucson"
    ],
    ev: [
      "Kona Electric",
      "Ioniq 5"
    ]
  },
  {
    brand: "Tata Motors",
    petrol: [
      "Tiago",
      "Altroz",
      "Punch",
      "Nexon",
      "Harrier",
      "Safari"
    ],
    diesel: [
      "Altroz",
      "Nexon",
      "Harrier",
      "Safari"
    ],
    ev: [
      "Tiago EV",
      "Tigor EV",
      "Nexon EV",
      "Punch EV"
    ]
  },
  {
    brand: "Mahindra",
    petrol: [
      "XUV700",
      "Thar"
    ],
    diesel: [
      "Bolero",
      "Bolero Neo",
      "Scorpio-N",
      "Scorpio Classic",
      "XUV700",
      "Thar"
    ],
    ev: [
      "XUV400"
    ]
  },
  {
    brand: "Toyota",
    petrol: [
      "Glanza",
      "Urban Cruiser Taisor",
      "Hyryder",
      "Innova Hycross",
      "Fortuner"
    ],
    diesel: [
      "Fortuner",
      "Hilux",
      "Innova Crysta"
    ],
    ev: []
  },
  {
    brand: "Kia",
    petrol: [
      "Sonet",
      "Seltos",
      "Carens"
    ],
    diesel: [
      "Sonet",
      "Seltos",
      "Carens"
    ],
    ev: [
      "EV6"
    ]
  },
  {
    brand: "Honda",
    petrol: [
      "Amaze",
      "City",
      "Elevate"
    ],
    diesel: [],
    ev: []
  },
  {
    brand: "MG",
    petrol: [
      "Astor",
      "Hector",
      "Hector Plus",
      "Gloster"
    ],
    diesel: [
      "Hector",
      "Hector Plus",
      "Gloster"
    ],
    ev: [
      "Comet EV",
      "ZS EV"
    ]
  },
  {
    brand: "Skoda",
    petrol: [
      "Slavia",
      "Kushaq",
      "Kodiaq"
    ],
    diesel: [],
    ev: []
  },
  {
    brand: "Volkswagen",
    petrol: [
      "Virtus",
      "Taigun",
      "Tiguan"
    ],
    diesel: [],
    ev: []
  }
];

const seedDB = async () => {
  await connectDB();

  try {
    console.log('Clearing old data...');
    await PetrolCar.deleteMany({});
    await DieselCar.deleteMany({});
    await EVCar.deleteMany({});
    console.log('Old Data Cleared');

    for (const car of cars) {
      if (car.petrol && car.petrol.length > 0) {
        await PetrolCar.create({ brand: car.brand, models: car.petrol });
        console.log(`Seeded Petrol for ${car.brand}`);
      }
      if (car.diesel && car.diesel.length > 0) {
        await DieselCar.create({ brand: car.brand, models: car.diesel });
        console.log(`Seeded Diesel for ${car.brand}`);
      }
      if (car.ev && car.ev.length > 0) {
        await EVCar.create({ brand: car.brand, models: car.ev });
        console.log(`Seeded EV for ${car.brand}`);
      }
    }
    console.log('Car Data Seeded Successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
