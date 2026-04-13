
import mongoose from 'mongoose';

const MONGODB_URI = 'process.env.MONGODB_URI';

async function findUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const seller = await User.findOne({ role: 'seller' }) || await User.findOne();
    console.log('USER_ID:', seller ? seller._id : 'null');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

findUser();
