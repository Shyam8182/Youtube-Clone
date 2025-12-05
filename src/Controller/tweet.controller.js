import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { user_id, content } = req.body

    if (!user_id && content) {
        throw new ApiError(400, "userid and content are required")
    }

    const isValied = isValidObjectId(user_id)

    if (!isValied) {
        throw new ApiError(400, "invalied user")
    }

    const tweet = await Tweet.create({
        content: content,
        owner: user_id
    })

    if (!tweet) {
        throw new ApiError(500, "tweet not posted")
    }

    const tweeted = await Tweet.aggregate(
        [
            {
                $match: {
                    _id: tweet._id
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            }
        ]
    )

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweeted,
                " tweet posted sucessfuly"
            )
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { user_id} = req.params
    
    if(!user_id){
        throw new ApiError(400,"user id is required")
    }

    const isValied = isValidObjectId(user_id)

    if(!isValied){
        throw new ApiError(400,"invalied user  id")
    }

    const tweets = await Tweet.aggregate(
        [
            {
                $match: {

                    owner: new mongoose.Types.ObjectId(user_id)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline:[
                        {
                            $project:{
                                username:1,
                                fullname:1,
                                avatar:1
                            }
                        }
                    ]
                }
            }
        ]
    )

    if (!tweets) {
        throw new ApiError(500,"somthing went wrong faching")

    }

    if(tweets.length === 0){
        throw new ApiError(404,"no tweets found")
    }

    res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "all tweets is facted successfulyy")
    )
    

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweet_id} = req.params
    const {content} = req.body
    
    if(!tweet_id && content){
        throw new ApiError(400,"tweet id and content are required")
    }

    const tweet = await Tweet.findById(tweet_id)

    if(!tweet){
        throw new ApiError(404,"tweet not found")
    }

    if(tweet.owner.toString() !== req.user.id){
        throw new ApiError(401,"unauthorized")
    }

   const updatedTweet = await Tweet.findByIdAndUpdate(tweet_id,
    {content},
    {new:true}
   )

   if (!updatedTweet){
    throw new ApiError(500,"somthing went wrong updating")
   }

   res
   .status(200)
   .json(
    new ApiResponse(200, updatedTweet, "tweet updated successfully")
   )
   
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const {tweet_id} = req.params

    if(!tweet_id){
        throw new ApiError(400,"tweet id is required")
    }

    const tweet = isValidObjectId(tweet_id)

    if(!tweet){
       throw new ApiError(400,"invalied tweet id")
    }

    const deleteedTweet = await Tweet.findByIdAndDelete(tweet_id)

    if(!deleteedTweet){
        throw new ApiError(500,"somthing went wrong deleting")
    }

    res
    .status(200)
    .json(
        new ApiResponse(200, deleteedTweet, "tweet deleted successfully")
    )


})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}