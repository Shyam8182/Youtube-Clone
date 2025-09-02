import dotenv from "dotenv";
import { connectDB } from "./db/index.js";

dotenv.config({
    path:'./'
})

connectDB()

































// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)

//     }
//     catch (error) {
//         console.error("error",error);
//         throw error
        
//     }
// })()