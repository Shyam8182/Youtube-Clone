import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/users.model.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uplodeFileonCloudinary } from "../utils/cloudnary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    //get tital and descripathin  from req.body and check it 
    //get video and thubnel files req.file and chek it
    //upload video and thubnel on cludenary and chek it
    //create video in db and chek it
    console.log("video ",req.body);
    
    const userId = req.user._id

    if (!userId) {
        throw new ApiError(400, "user is not ivalid")
    }

    if (!title || !description) {
        throw new ApiError(400, "tital and descroiption is requred")
    }

    const videoLocatPath = req.files?.videoFile[0]?.path

    if (!videoLocatPath) {
        throw new ApiError(400, "video is not selected")
    }
    let thubnailLocatPath;
    if (req.files?.thumbnail?.length > 0) {
        thubnailLocatPath = req.files?.thumbnail[0]?.path
    }

    const videoOnCloudinary = await uplodeFileonCloudinary(videoLocatPath)
    const thubnailOnCloudinary = await uplodeFileonCloudinary(thubnailLocatPath)


    if (!videoOnCloudinary) {
        throw new ApiError(400, "somthig wrong in video uplodeing")

    }

    const video = await Video.create({
        videoFile: videoOnCloudinary.url,
        thumbnail: thubnailOnCloudinary?.url || "",
        title,
        description,
        duration: videoOnCloudinary.duration,
        owner: userId

    })


    if (!video._id) {
        throw new ApiError(500, "somthig went wrong when db criating")
    }



    const videoCreated = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(video?._id)
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
        },
    ])

    if (!videoCreated.length > 0) {
        throw new ApiError(500,"database error try agin ")
    }
    console.log("from video controller ",videoCreated);
    

    res
    .status(200)
    .json(
        new ApiResponse(200,videoCreated[0],"video published sucessfuly")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}