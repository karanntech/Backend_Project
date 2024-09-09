import { Playlist } from "../models/playlist.model.js";
import {Video} from "../models/video.model.js"
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";


const createPlaylist = asyncHandler (async (req, res)=> {
    const {name, description} = req.body;

    if(!name || !description){
        throw new ApiError(400, "name and description both are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if(!playlist){
        throw new ApiError(500, "failed to create playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"))
});


//update playlist
const updatePlaylist = asyncHandler(async(req, res)=> {
    const {name, description} = req.body;
    const {playlistId} = req.params;

    if (!name || !description) {
        throw new ApiError(400, "name and description both are required");
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit the playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist?._id,{
        $set: {
            name,
            description
        }
    },{new: true});

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlilst updated successfully"))
})


//Delete playlist

const deletePlaylist = asyncHandler(async (req, res)=>{
    const {playlistId} = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid PlaylistId")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "only owner can delete the playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist deleted successfully"))
})

//add video to playlist

const addVideoToPlaylist = asyncHandler (async (req, res)=>{
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid playlistId or videoId")
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(playlist.owner?.toString() && video.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "only owner can add video to their playlist");
    }

    const addedVideoToPlaylist = await Playlist.findByIdAndUpdate(playlist?._id, {
        $addToSet: {
            videos: videoId
        }
    }, {new: true})
    if (!addedVideoToPlaylist) {
        throw new ApiError(
            400,
            "failed to add video to playlist please try again"
        );
    }

    return res
    .status(200)
    .json(new ApiResponse(200, addedVideoToPlaylist, "Added Video to playlist"))

})

//remove video from playlist

const removeVideoToPlaylist = asyncHandler(async(req, res)=> {
    const {playlistId, videoId} = req.params;
    if(!playlistId || !videoId){
        throw new ApiError(400, "Invalid playlistId or videoId")
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if (
        (playlist.owner?.toString() && video.owner?.toString()) !==
        req.user?._id.toString()
    ) {
        throw new ApiError(
            404,
            "only owner can remove video from thier playlist"
        );
    }

    const removedVideoToPlaylist = await Playlist.findByIdAndUpdate(playlistId,{
        $pull: {
            videos: videoId
        }
    }, {new: true})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                removedVideoToPlaylist,
                "Removed video from playlist successfully"
            )
        );
});

// get PlaylistById

const getPlaylistById = asyncHandler (async(req, res)=> {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    const playlistVideos = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id" ,
                as: "videos",
            }
        },
        {
            $match: {
                "videos.isPublished": true
            }
        },{
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },{
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },{
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, playlistVideos[0], "playlist fetched successfully"));
})

//get users playlist

const getUserPlaylist = asyncHandler(async(req, res)=> {
    const {userId} = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid UserId")
    }

        const playlists = await Playlist.aggregate([{
            $match: {
                 owner: new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },{
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },{
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
})

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoToPlaylist,
    getPlaylistById,
    getUserPlaylist
}