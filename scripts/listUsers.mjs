
import mongoose from 'mongoose';

const MONGODB_URI = 'process.env.MONGODB_URI';

async function listUsersRaw() {
  try {
    await mongoose.connect(MONGODB_URI);
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('USERS_RAW:', JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

listUsersRaw();
