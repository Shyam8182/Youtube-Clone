import { Router } from 'express';
import { publishAVideo } from '../Controller/video.controller.js';
import { verifyjwt } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.mw.js";

const router = Router();
router.use(verifyjwt); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    // .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },

        ]),
        publishAVideo
    );



export default router