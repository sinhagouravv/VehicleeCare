const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Create a temporary schema and model to insert a document
        const TestSchema = new mongoose.Schema({ name: String, createDate: Date });
        const TestModel = mongoose.model('InitTest', TestSchema);

        // Insert a document
        await TestModel.create({ name: 'Database Initialized', createDate: new Date() });
        console.log('Document inserted. Database "VehicleeCare" should now be visible.');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
