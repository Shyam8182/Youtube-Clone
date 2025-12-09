import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    const user = req.user._id

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "channel id is not valid")
    }

    const isSub = await Subscription.findOne({
        subscriber: user,
        channel: channelId
    })

    if (isSub) {

        const deletedSub = await Subscription.findByIdAndDelete(isSub._id)

        if (!deletedSub) {
            throw new ApiError(400, "Subscription not deleted")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Subscription deleted", deletedSub))
    }

    const sub = await Subscription.create({
        subscriber: user,
        channel: channelId
    })

    if (!sub) {
        throw new ApiError(400, "Subscription not created")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Subscription created", sub))




})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "channel id is not valid")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id:"$channel",
                subscriberCount:{
                    $sum:1
                }
            }
        },
        {
            $project:{
                _id:1,
                subscriberCount:1
            }
        }

    ])

    if (!subscribers) {
        throw new ApiError(400, "Subscribers not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Subscribers found", subscribers[0]))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "subscriber id is not valid")
    }

    const channels  = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
           $lookup: {
            from:"users",
            localField:"channel",
            foreignField:"_id",
            as:"channel",
            pipeline:[
                {
                    $project:{
                        username:1,
                        fullname:1,
                        avatar:1,
                    }
                }
            ]
           }
        },
        {
            $addFields:{
                channels:"$channel"
            }
        },
        {
            $project:{
                channels:1,
            }
        }
        
    ])

    const totalChannels = await Subscription.countDocuments({
        subscriber: mongoose.Types.ObjectId(subscriberId)
    })

    if (!totalChannels) {
        throw new ApiError(400, "Total channels not found")
    }

    if(!channels.length){
        return res
        .status(200)
        .json(new ApiResponse(200, "Channels not found", []))
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Channels found", {channels, totalChannels}))
    




    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}