import mongoose from "mongoose";
const { Schema } = mongoose;

const userVerificationSchema = new Schema({
userId: String,  
uniqueString: String,  
createdAt: Date,
expiresAt: Date,
},{
  timestamps:true
});

export default mongoose.model("UserVerification", userVerificationSchema)