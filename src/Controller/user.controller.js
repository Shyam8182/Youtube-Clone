import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/users.model.js"
import {uplodeFileonCloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res)=>{
  const {fullname,email,username,password} = req.body;
  console.log("email",email,password);

  if ([fullname,email,username,password].some((field)=>field?.trim() === "")) {
    throw new ApiError(400,"all field are requred")
  }

  const existingUser = await User.findOne({
    $or:[{email},{username}]
  })

  if (existingUser) {
    throw new ApiError(409,"username and email is alredy existed")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  

  if (!avatarLocalPath) {
    throw new ApiError(400,"avatar is required")
  }

const avatar = await uplodeFileonCloudinary(avatarLocalPath);
const coverImage = await uplodeFileonCloudinary(coverImageLocalPath);

if (!avatar) {
 throw new ApiError(400,"avatar is required")   
}

const user = await User.create({
  fullname,
  avatar:avatar.url,
  coverImage: coverImage?.url || "",
  email,
  password,
  username: username.ToLowerCase()
})
 
const createdUser = await User.findById(user._id).select("-password -refreshToken")

if(!createdUser){
  throw new ApiError(500,"user is not created server error")
}

  return res.status(201).json(
    new ApiResponse(200,createdUser,"User created sucssusFully")
  )

})

export {registerUser};