import { Router } from "express";
import { loginUser, logoutUser, registerUser , refreshAccessToken, changeCurrentPassword, getCourrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUsersDetails, getWatchHistroy} from "../Controller/user.controller.js";
import {upload} from "../middlewares/multer.mw.js";
import { verifyjwt } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),registerUser)

router.route("/login").post(loginUser)

//secured route

router.route("/logout").post(verifyjwt,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyjwt , changeCurrentPassword)

router.route("/current-user").get(verifyjwt, getCourrentUser)

router.route("/update-account").patch(verifyjwt,updateAccountDetails)

router.route("/update-avatar").patch(verifyjwt , upload.single("avatar"),updateUserAvatar)
router.route("/update-coverIamge").patch(verifyjwt,upload.single("coverImage"),updateUserCoverImage)

router.route("/channel/:username").get(verifyjwt,getUsersDetails)
router.route("/histroy").get(verifyjwt,getWatchHistroy)




export default router;