import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middelware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/u/:tweetId").patch(updateTweet);
router.route("/d/:tweetId").delete(deleteTweet);

export default router;