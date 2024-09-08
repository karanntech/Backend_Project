import { Playlist } from "../models/playlist.model.js";
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

    if (playlist.owner.toString() !== req.user?._id.toString()) {
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


export {
    createPlaylist,
    updatePlaylist
}