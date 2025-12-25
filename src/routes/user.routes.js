import { Router } from "express";
import {
    registerUser, loginUser, logout, 
    refreshAccessToken, changePassword, 
    getCurrentUser, updateAccountdetails, 
    updateAvatar, updateCoverImage, 
    getUserchannelprofile, watchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),

    

    registerUser
)

router.route("/loginUser").post(loginUser)

router.route("/logout").post(verifyJWT, logout)

router.route("/refreshToken").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changePassword)

router.route("/CurrentUser").get(verifyJWT, getCurrentUser)

router.route("/Accountdetails").patch(verifyJWT, updateAccountdetails)

router.route("/Avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)

router.route("/coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)

router.route("/c/:username").get(verifyJWT, getUserchannelprofile)

router.route("/watchHistory").get(verifyJWT, watchHistory)

export default router