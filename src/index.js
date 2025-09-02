import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:'./'
})

connectDB()
.then(()=>(
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server start port http://localhost:${process.env.PORT || 8000}`);
        
    })
))
.catch((error)=>{
    console.log("listing error ", error);
    
})

































// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)

//     }
//     catch (error) {
//         console.error("error",error);
//         throw error
        
//     }
// })()