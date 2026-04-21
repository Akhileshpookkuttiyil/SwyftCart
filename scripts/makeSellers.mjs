
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function updateRoles() {
  try {
    await mongoose.connect(MONGODB_URI);
    const result = await mongoose.connection.db.collection('users').updateMany(
      {},
      { $set: { role: 'seller' } }
    );
    console.log(`Updated ${result.modifiedCount} users to seller role.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

updateRoles();
