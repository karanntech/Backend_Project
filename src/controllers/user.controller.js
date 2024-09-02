import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Tokens")
    }
}

const registerUser = asyncHandler (async (req, res)=> {
    
    const {fullName, email, username, password} = req.body;
    
    if([fullName, email, username, password].some(
        (field)=> field?.trim()=== ""
    )){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409, "User already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) 
        && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
        }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required!")
    }   

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required!!")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
     )
     if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
     }

     return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
     )

})

const loginUser = asyncHandler (async (req, res) => {
    const {email, username, password} = req.body;

    if(!email && !username){
        throw new ApiError (400, "username or password is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError (401, "Invalid User Credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
    httpOnly: true,
    secure: true
   }

   return res.status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new ApiResponse(
        200,{
            user: loggedInUser, accessToken, refreshToken
        },
        "User loggedIn successfully"
    )
   )
})

const logoutUser = asyncHandler (async (req, res)=>{
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {refreshToken: 1},
        },
        {new: true}
    )
    const options = {
        httpOnly: true,
        secure: true
       }
    
       return res.status(200)
       .clearCookie("accessToken", options)
       .clearCookie("refreshToken", options)
       .json(new ApiResponse(200, {}, "User logged Out"))
})


const refreshAccessToken = asyncHandler (async (req, res)=> {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken",newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "AccessToken refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


const changeCurrentPassword = asyncHandler (async (req, res)=> {
    const {oldPassword, newPassword} = req.body;


    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword

    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(new ApiResponse (200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler (async(req, res)=> {
    return res
    .status(200)
    .json(new ApiResponse (200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res)=> {
    const {fullName, email} = req.body
    
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName,
            email: email
        } 
     }, {new: true}).select("-password")
     
     return res
     .status(200)
     .json(new ApiResponse (200, "Account Details updated"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiResponse(400, "Avatar file required")
    }

    //Delete the old avatar image on cloudinary /not sure if it is correct
    if(user.avatar){
        const oldAvatar = user.avatar.split('/').pop().split('.')[0];
        await cloudinary.v2.uploader.destroy(oldAvatar)
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading Avatar file")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {avatar : avatar.url}
        },
        {new: true}
    ).select("-password")

    return res
     .status(200)
     .json(new ApiResponse (200, "Avatar image updated"))
})

const updateCoverImage = asyncHandler (async (req, res)=> {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Upload Cover image")
    }

    //Delete the old cover image on cloudinary /not sure if it is correct
    if(user.coverImage){
        const oldCoverImage = user.avatar.split('/').pop().split('.')[0];
        await cloudinary.v2.uploader.destroy(oldCoverImage)
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },{new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated"))
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage
};