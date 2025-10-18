import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js"
import { User } from "../models/users.model.js"
import { uplodeFileonCloudinary } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    console.log("user id", userId);

    const user = await User.findById(userId)
    // console.log("user ",user);

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    // console.log("tokens ",accessToken , refreshToken);

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })


    return { accessToken, refreshToken }




  } catch (error) {
    throw new ApiError(500, "server error something went wrong when generate token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  console.log(req.body);

  if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all field are requred")
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (existingUser) {
    throw new ApiError(409, "username and email is alredy existed")
  }

  console.log("fliles", req.files);


  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }


  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is required")
  }

  const avatar = await uplodeFileonCloudinary(avatarLocalPath);
  const coverImage = await uplodeFileonCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar is required")
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken")

  if (!createdUser) {
    throw new ApiError(500, "user is not created server error")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User created sucssusFully")
  )

})

const loginUser = asyncHandler(async (req, res) => {
  //req body mathi data levano
  //user name ee filed chheke nyy
  //aema thi username ane password levano 
  //ane data base hare commpare karvano
  //jo sacho hoy to tene token api devanu
  //ane jo lhotu hoy to ragistar page par redirect karidevano


  const { email, username, password } = req.body

  console.log("body vadu", req.body);

  console.log(email);


  if (!(email || username)) {
    throw new ApiError(400, "email or username is requred")
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (!user) {
    throw new ApiError(404, "email or username is not exisest")
  }


  const isPasswordCorrect = await user.isPasswordCorrect(password)


  if (!isPasswordCorrect) {
    throw new ApiError(401, "password is not correct")
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

  // console.log(accessToken, refreshToken);



  const loggedinUser = await User.findById(user._id).select("-password -refreshToken")


  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinUser, accessToken, refreshToken
        },
        "user logged in successfully"
      )
    )

})

const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }

  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"))




})

const refreshAccessToken = asyncHandler(async (req, res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unothorizeed token")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "invalied refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refrash token is use or invalied")

    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newrefreshToken } = await generateAccessTokenAndRefreshToken(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newrefreshToken },
          "access token refreshed "
        )
      )


  } catch (error) {
    throw new ApiError(401, error.message || "invalied refreshtoken")
  }


})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const user = await User.findById(req?.user._id)
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, " password is invaalied ")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "password changed successfully")
    )
})

const getCourrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req?.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body

  if (!fullname || !email) {
    throw new ApiError(400, "fullname and email are required")
  }

  const user = await User.findByIdAndUpdate(req?.user?._id,
    {
      $set: {
        fullname,
        email: email
      },

    },
    {
      new: true,
    }
  ).select("-password -refreshToken")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user details updated successfully"))




})

const updateUserAvatar = asyncHandler(async (req, res) => {

  const avatarLocalPath = req.files?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "uploed avatar ")
  }

  const avatar = await uplodeFileonCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "error when uploding avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar.url }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"))


})

const updateUserCoverImage = asyncHandler(async (req, res) => {

  const coverImageLocalPath = req.files?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "uploed coverImage ")
  }

  const coverImage = await uplodeFileonCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    throw new ApiError(400, "error when uploding coverImage")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverImage: coverImage.url }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"))


})

const getUsersDetails = asyncHandler(async (req, res) => {

  const { username } = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    }, {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelSubcribedCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelSubcribedCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1




      }
    }
  ])

  if (!channel.length) {
    throw new ApiError(404, "cannel dose not existed")
  }

  console.log("gett user detailes mathi  ", channel);
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel data fechhed")
    )

})

const getWatchHistroy = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                },

              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelSubcribedCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        watchHistory: 1

    }
  }

  ])
console.log("history mathi   ",user);

  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0].watchHistory, " watchHistory is fetchhed ")
    )
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCourrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUsersDetails,
  getWatchHistroy

};