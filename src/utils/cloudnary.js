import {v2 as cloudinary} from 'cloudinary';
import { log } from 'console';
import fs from 'fs';

cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRAE
});


const uplodeFileonCloudinary = async (filePath)=>{

    try {
        if(!filePath) return null;

       const respons = await cloudinary.uploader.upload(filePath,{
            resource_type:'auto'
        })
        console.log("file uploaded on cloudinary",respons);
        fs.unlinkSync(filePath)
        return respons;
        

    } catch (error) {
        fs.unlinkSync(filePath) // remove file from local storage
        return null; 
    }
}


export {uplodeFileonCloudinary};