import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../Controller/user.controller.js";
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





export default router;