import mongoose from "mongoose";
const { Schema } = mongoose;

const checkSchema = new Schema({

  userId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  protocol: {
    type: String,
    default: "http",
  },
  
}
,{
  timestamps:true
});

export default mongoose.model("Check", checkSchema)