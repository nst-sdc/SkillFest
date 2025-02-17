import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://nstcodingclub:COIemSHIzBpVAlIi@recruitmentnstsdcorg.99kut.mongodb.net/?retryWrites=true&w=majority&appName=recruitmentNstsdcOrg';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
