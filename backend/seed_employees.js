const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');

// Load env before connecting
dotenv.config();

// Generate IDs starting with 61 and no zeros (9 digits total)
const generateId = () => {
    let randomPart = Math.floor(1000000 + Math.random() * 9000000).toString();
    // Replace any 0s with a random digit 1-9
    randomPart = randomPart.replace(/0/g, () => Math.floor(1 + Math.random() * 9).toString());
    return '61' + randomPart;
};

const demoEmployees = [
    {
        employeeId: generateId(),
        name: "Rahul Verma",
        email: "rahul.v@vehicleecare.com",
        role: "Manager",
        category: "Garage",
        phone: "9876543211",
        address: "124 Park Ave, Mumbai",
        isVerified: true
    },
    {
        employeeId: generateId(),
        name: "Priya Sharma",
        email: "priya.s@vehicleecare.com",
        role: "Admin",
        category: "System",
        phone: "9123456781",
        address: "Level 4, Tech Park, Delhi",
        isVerified: true
    },
    {
        employeeId: generateId(),
        name: "Amit Kumar",
        email: "amit.k@vehicleecare.com",
        role: "Technician",
        category: "Charging Station",
        phone: "9988776655",
        address: "EV Hub 3, Auto Zone, Pune",
        isVerified: true
    }
];

// Execute Seed
const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await Employee.deleteMany({});
        console.log('Cleared existing employees');

        await Employee.insertMany(demoEmployees);
        console.log('Successfully inserted demo employees:');
        demoEmployees.forEach(e => console.log(`- ${e.name} (${e.employeeId}) [${e.category}]`));

        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedDB();
