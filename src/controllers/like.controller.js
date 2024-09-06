import mongoose, { isValidObjectId } from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

const toggleLike = asyncHandler(async (req, res, type) => {
    const id = req.params[type];
    
    if (!isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${type}`);
    }

    const likedAlready = await Like.findOne({
        [type]: id,
        likedBy: req.user?._id,
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }));
    }

    await Like.create({
        [type]: id,
        likedBy: req.user?._id,
    });
    return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleVideoLike = (req, res) => toggleLike(req, res, 'video');
const toggleCommentLike = (req, res) => toggleLike(req, res, 'comment');
const toggleTweetLike = (req, res) => toggleLike(req, res, 'tweet');

//get all videos

const getLikedVideos = asyncHandler (async(req, res)=> {
    const likeVideoAggregate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails",
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    }
                }
            }
        }
    ])
    
    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            likeVideoAggregate, 
            "liked video fetch successfully"
    ))
})


export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
