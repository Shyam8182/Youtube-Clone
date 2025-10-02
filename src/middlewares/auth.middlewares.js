import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/users.model.js";

export const verifyjwt = asyncHandler(async(req,res,next)=>{
    try {
        const token =  req.cookies?.accessToken || 
        req.header("Authorization")?.replace("Bearer","")
    
        if (!token) {
            throw new ApiError(400,"unothorize token ")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user  = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
    
        if (!user) {
            throw new ApiError(404,"unothorized user  not found")
        }

        req.user  = user
        next()


    } catch (error) {
        
        throw new ApiError(401,error.message || "invalied access token")
    }



})