import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOncloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


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


    console.log("Uploaded files:", req.files);

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
        "-password -refreshtoken"
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

    if (!username || !email) {
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

    const {accessToken, refreshToken} = await generateAccessAndRefreshtoken(user._id)

    const loggedInUser = await user.findById(user._id).select(
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
export {registerUser, loginUser}


