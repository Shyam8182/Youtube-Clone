import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/users.model.js"
import {uplodeFileonCloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async(userId)=>{
  try {
    console.log("user id",userId);
    
    const user = await User.findById(userId)
    // console.log("user ",user);
    
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    
    // console.log("tokens ",accessToken , refreshToken);
    
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave:false })


    return {accessToken, refreshToken}



    
  } catch (error) {
    throw new ApiError(500,"server error something went wrong when generate token")
  }
}

const registerUser = asyncHandler(async (req,res)=>{
  const {fullname,email,username,password} = req.body;
  console.log(req.body);

  if ([fullname,email,username,password].some((field)=>field?.trim() === "")) {
    throw new ApiError(400,"all field are requred")
  }

  const existingUser = await User.findOne({
    $or:[{email},{username}]
  })

  if (existingUser) {
    throw new ApiError(409,"username and email is alredy existed")
  }

  console.log("fliles",req.files);
  

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }
  

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
  username: username.toLowerCase()
})
 
const createdUser = await User.findById(user._id).select("-password -refreshToken")

if(!createdUser){
  throw new ApiError(500,"user is not created server error")
}

  return res.status(201).json(
    new ApiResponse(200,createdUser,"User created sucssusFully")
  )

})

const loginUser = asyncHandler(async (req,res)=>{
//req body mathi data levano
//user name ee filed chheke nyy
//aema thi username ane password levano 
//ane data base hare commpare karvano
//jo sacho hoy to tene token api devanu
//ane jo lhotu hoy to ragistar page par redirect karidevano


const {email,username,password} = req.body

console.log("body vadu",req.body);

console.log(email);


if(!(email || username)){
  throw new ApiError(400,"email or username is requred")
}

const user = await User.findOne({
  $or:[{email},{username}]
})

if (!user) {
  throw new ApiError(404,"email or username is not exisest")
}


const isPasswordCorrect = await user.isPasswordCorrect(password)


if (!isPasswordCorrect) {
  throw new ApiError(401,"password is not correct")
}

const {accessToken, refreshToken}  = await generateAccessTokenAndRefreshToken(user._id)

// console.log(accessToken, refreshToken);



const loggedinUser = await User.findById(user._id).select("-password -refreshToken")


const options = {
  httpOnly:true,
  secure:true
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
  new ApiResponse(
    200,
    {
      user:loggedinUser,accessToken,refreshToken
    },
    "user logged in successfully"
  )
)

})




const logoutUser = asyncHandler(async (req,res)=>{

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true
    }
    
  )

  const options = {
  httpOnly:true,
  secure:true
}

return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200 , {} , "user logged out"))




})




const refreshAccessToken  = asyncHandler(async (req,res)=>{

  const incomingRefreshToken  = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401,"unothorizeed token")
  }

 try {
   const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
   const user = await User.findById(decodedToken?._id)
 
   if (!user) {
     throw new ApiError(401,"invalied refresh token")
   }
 
   if (incomingRefreshToken !== user?.refreshToken) {
     throw new ApiError(401,"refrash token is use or invalied") 
 
   }
 
 const options = {
   httpOnly:true,
   secure:true
 }
 
 const {accessToken, newrefreshToken} =  await generateAccessTokenAndRefreshToken(user._id)
 
 return res
 .status(200)
 .cookie("accessToken",accessToken,options)
 .cookie("refreshToken",newrefreshToken,options)
 .json(
   new ApiResponse(
     200,
     {accessToken , newrefreshToken},
     "access token refreshed "
   )
 )


 } catch (error) {
  throw new ApiError(401,error.message || "invalied refreshtoken")
 }


})


export {
        registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken
};