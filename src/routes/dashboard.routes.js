import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller";

import {verifyJWT} from "../middlewares/auth.middelware.js";

const router = Router();

router.use(verifyJWT);

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router;