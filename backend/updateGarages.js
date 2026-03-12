const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Garage = require('./models/Garage');
require('dotenv').config();

async function updatePasswords() {
  await mongoose.connect(process.env.MONGO_URI);
  const garages = await Garage.find({ password: { $exists: false } });
  if (garages.length === 0) {
     console.log('No garages need updating, or all have passwords already. Will update all to Pass@1234 just in case.');
     const allGarages = await Garage.find();
     const salt = await bcrypt.genSalt(10);
     const hashed = await bcrypt.hash('Pass@1234', salt);
     for (let g of allGarages) {
         g.password = hashed;
         await g.save();
     }
     console.log('Updated ' + allGarages.length + ' garages.');
  } else {
     const salt = await bcrypt.genSalt(10);
     const hashed = await bcrypt.hash('Pass@1234', salt);
     for (let g of garages) {
         g.password = hashed;
         await g.save();
     }
     console.log('Updated ' + garages.length + ' garages.');
  }

  process.exit();
}
updatePasswords();
