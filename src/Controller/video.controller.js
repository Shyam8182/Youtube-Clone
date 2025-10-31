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


    page = parseInt(page)
    limit = parseInt(limit)

    sortType = sortType === "asc" ? 1 : -1

    const filter = {}

    if (query.trim()) {
        filter.$or = [
            {
                title: {
                    $regex: query,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: query,
                    $options: "i"
                }
            }
        ]
    }


    if (userId && isValidObjectId(userId)) {
        filter.owner = new mongoose.Types.ObjectId(userId)
    }

    const videos = await Video.aggregate(
        [
            {
                $match: filter
            },
            {
                $sort: {
                    [sortBy] : sortType
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit : limit
            },
            {
                $lookup: {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "owner",
                    pipeline : [
                        {
                            $project : {
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

    const totalVideo = Video.countDocuments(filter)

    res
    .status(200)
    .json(
        new ApiResponse(200,
           { videos, totalVideo, page, limit, totalPage: Math.ceil(totalVideo / limit) },
           "video get sucsesfully"
        )
    )


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    //get tital and descripathin  from req.body and check it 
    //get video and thubnel files req.file and chek it
    //upload video and thubnel on cludenary and chek it
    //create video in db and chek it
    console.log("video ", req.body);

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
        if (!thubnailLocatPath) {
            throw new ApiError(400, "thubnail is not selected")
        }
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
        throw new ApiError(500, "database error try agin ")
    }
    console.log("from video controller ", videoCreated);


    res
        .status(200)
        .json(
            new ApiResponse(200, videoCreated[0], "video published sucessfuly")
        )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    //validate video id 
    //find the video 
    // if get video so send video

    if (!videoId.trim()) {
        throw new ApiError(400, "video id is required")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId.trim())

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

    ])

    if (!video.length > 0) {
        throw new ApiError(404, "voideo  not found")
    }

    res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video got sucessfuly")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body

    if (!videoId.trim()) {
        throw new ApiError(400, "video id is requried")
    }

    if (!title || !description) {
        throw new ApiError(400, "tital or descroiption is requed")
    }

    let thubnailLocatPath;
    if (req.files?.thumbnail?.length > 0) {
        thubnailLocatPath = req.files?.thumbnail[0]?.path
        if (!thubnailLocatPath) {
            throw new ApiError(400, "thubnail is not selected")
        }
    }

    const thubnailOnCloudinary = await uplodeFileonCloudinary(thubnailLocatPath)

    if (!thubnailOnCloudinary) {
        throw new ApiError(500, "somthig wrong when thubnail uplodeing")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId.trim(),
        {
            title,
            description,
            thumbnail: thubnailOnCloudinary?.url || ""
        },
        {
            new: true
        }
    )

    if (!updatedVideo) {
        throw new ApiError(500, " somthig went wrong when updating video")
    }

    const populat = Video.aggregate[
        {
            $match: {
                _id: new mongoose.Types.ObjectId(updateVideo._id)
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

    if (!populat) {
        throw new ApiError(500, " somthig went wrong when updating video")
    }


    res
        .status(200)
        .json(
            new ApiResponse(200, populat, "video updated sucessfuly")
        )


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId.trim()) {
        throw new ApiError(400, "video id is requred")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId.trim())

    if (!deletedVideo) {
        throw new ApiError(500, "somthig went wrong video not deleted")
    }

    res
        .status(200)
        .json(
            new ApiResponse(200, deletedVideo, "video deleted sucessfuly")
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId.trim()) {
        throw new ApiError(400, "video id is requred")
    }
    const video = await Video.findById(videoId.trim());

    if (!video) throw new ApiError(404, "video not found");


    video.isPublished = !video.isPublished;
    await video.save();

    res.status(200).json(new ApiResponse(200, video, "publish status toggled"));


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}