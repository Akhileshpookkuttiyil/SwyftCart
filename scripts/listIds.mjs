
import mongoose from 'mongoose';

const MONGODB_URI = 'process.env.MONGODB_URI';

async function listIds() {
  try {
    await mongoose.connect(MONGODB_URI);
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    users.forEach(u => console.log(`${u.name} | ${u.role} | ${u._id}`));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

listIds();
