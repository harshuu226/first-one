import { Router } from "express";
import {registerUser, loginUser, logout, refreshAccessToken, changePassword} from "../controllers/user.controller.js";
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

router.route("change-password").post(changePassword)

router.route("").post()

export default router