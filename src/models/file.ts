import mongoose, { Document, Model, Schema } from 'mongoose';

// Define interface for the user document (optional, but recommended)
interface Ifile extends Document {
  file: string,
  metadata: {}
}

// Create a Mongoose schema
const fileSchema: Schema<Ifile> = new mongoose.Schema({
  file: {
    type: String,
    required: true,
  },
  metadata: {
    type: Object,
    required: true 
  },
});

// Define and export the User model
const File: Model<Ifile> = mongoose.model<Ifile>('File', fileSchema);
export default File;
