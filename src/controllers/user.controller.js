import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOncloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { use } from "react"


const generateAccessAndRefreshtoken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong")    
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exist: username, email
    // check for images, check for avatar 
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token feild from response 
    // check for user creation 
    // return res


    const {fullName, password, username, email} = req.body

    if (
        [fullName, email, password, username].some(feild =>
        String(feild || "").trim() === ""
    )) {
            throw new ApiError(400, "All fields are required");
    }


    const existedUser = await User.findOne({
        $or: [{username},{email}]
    });

    if (existedUser) {
        throw new ApiError(409, "user already exist")
    }


    const avatarLocalPath = req.files?.avatar?.[0]?.path; 
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path; 

    let avatarUrl = ""; 
    let coverImageUrl = ""; 

    const avatar = await uploadOncloudinary(avatarLocalPath); 
    avatarUrl = avatar?.secure_url || ""; 

    if (!avatar) {
        throw new ApiError(400, "avatar is required")
    }

    const coverImage = await uploadOncloudinary(coverImageLocalPath); 
    coverImageUrl = coverImage?.secure_url || ""; 
    
    if (!coverImage) {
        throw new ApiError(400, "cover is required")
    }


    const userData = await User.create({
        fullName,
        avatar: avatarUrl,
        coverImage: coverImageUrl || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createduser =await User.findById(userData._id).select(
        "-password -refreshToken"
    )

    if(!createduser) {
        throw new ApiError(500, "something went wrong")
    }

    return res.status(201).json(
        new ApiResponse(200, createduser, "user registered successfully")
    )
})

const loginUser = asyncHandler( async(req, res) => {
    // req.body = get details from the user
    // check username or email matching or not
    // find the user
    // check password is matching or not
    // give acess token and refresh token

    const {email, username, password} = req.body

    if (!username && !email) {
        throw new ApiError(400, "username is required");
    }

    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "incorrect password")
    }

    const {accessToken, refreshToken} = await 
    generateAccessAndRefreshtoken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logout = asyncHandler( async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "user logged out successfully"
        )
    )
})

const refreshAccessToken = asyncHandler( async(req, res) => 
    {
    const incomingRefreshToken = req.cookie.refreshToken 
    || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, 
        process.env.REFRESH_TOKEN_SECRET)
    
        const user =  await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "invalid refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refreh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {newRefreshToken, accessToken} = await 
        generateAccessAndRefreshtoken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("newRefreshToken", newRefreshToken, options)
        .json(new ApiResponse(
            200,
            {accessToken, newRefreshToken},
            "access token refreshed"
        ))
    } catch (error) {
        throw new ApiError(401, "invalid refresh token")
    }
})

const changePassword = asyncHandler( async(req, res) => {
    
    const {oldpassword, newPassword, confirmPassword} = req.body

    if(!(newPassword === currentPassword)) {
        throw new error (401, "enter correct password")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(oldpassword)

    if(!isPasswordValid) {
        throw new ApiError(401, "enter correct password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler( async(req, res) => {
    const user = req.user

    return res
    .status(200)
    .json(ApiResponse(200, user, "get user successfully"))
})

const updateAccountdetails = asyncHandler(async(req, res) => {
    const {fullName, username} = req.body

    if(!(fullName || username)) {
        throw new ApiError(401, "fullname or username required")
    }

    const user = User.findByIdAndUpdate(user.req?._id,
        {
            $set: {fullName, username}
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(200, user, "account details updated successfully")
})

const updateAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(401, "avatar is required")
    }

    const avatar = await uploadOncloudinary(avatarLocalPath)

     if(!avatar.url) {
        throw new ApiError(401, "error while uploading")
    }

    const user = await findByIdAndUpdate(req.user?._id, 
        {
            $set: {
                avatar: avatar.url
            }
        }, {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(ApiResponse(200, user, "avatar updated successfully"))
})

const updateCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(401, "cover Image is required")
    }

    const coverImage = await uploadOncloudinary(coverImageLocalPath)

     if(!coverImage.url) {
        throw new ApiError(401, "error while uploading")
    }

    const user = await findByIdAndUpdate(req.user?._id, 
        {
            $set: {
                coverImage: coverImage.url
            }
        }, {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(ApiResponse(200, user, "cover Image updated successfully"))
})

const getUserchannelprofile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username) {
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
                from: "subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed to"
            }
        },
        {
            $addFields: {
                subscibersCount: {
                    $size: "subscribers"
                },
                channelSubscribedToCount: {
                    $size: "subscribed to"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscibersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "user channel fetched successfully"))
})

const watchHistory = asyncHandler(async(req, res) => {
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
                as : "watchHistory",
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
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        owner : {
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    res.status(200)
    .json(new ApiResponse(
        200, 
        user[0].watchHistory, 
        " user history fetched successfully"
    ))
})

export {
    registerUser, 
    loginUser, 
    logout, 
    refreshAccessToken, 
    changePassword, 
    getCurrentUser,
    updateAccountdetails,
    updateAvatar,
    updateCoverImage,
    getUserchannelprofile,
    watchHistory
}


