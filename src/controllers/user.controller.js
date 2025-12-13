import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOncloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


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

    if (coverImageLocalPath) { 
        const coverImage = await uploadOncloudinary(coverImageLocalPath); 
        coverImageUrl = coverImage?.secure_url || ""; 
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
    // get details from the user
    // check username or email matching or not
    // check password is matching or not
    // give acess token

})
export {registerUser}


