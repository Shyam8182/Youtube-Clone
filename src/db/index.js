import mongoose from "mongoose";
import { DB_NAME } from "../constanst.js";


const connectDB = async ()=>{
    try {
       const conObj = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`\n mongoDB connect \n host := ${conObj.connection.host}`);
        
    }
    catch (error) {
        console.error("mongoose connection error",error);
        process.exit(1)
        
    }
}

export default connectDB;

