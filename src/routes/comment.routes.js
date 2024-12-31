import { Router } from "express";
import { addComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { updateComment } from "../controllers/comment.controller.js";
import { deleteComment } from "../controllers/comment.controller.js";
import { getVideoComments } from "../controllers/comment.controller.js";
const router = Router();

router.route("/addComment/:videoId").post(verifyJWT, addComment);
router.route("/updateComment").post(verifyJWT, updateComment);
router.route("/deleteComment").delete(verifyJWT, deleteComment);
router.route("/getVideoComments/:videoId").get(getVideoComments);

export default router;
