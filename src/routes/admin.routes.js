import { Router } from "express";
import { deleteWhole } from "../controllers/admin.controller.js";
import { getAdminDashboard } from "../controllers/admin.controller.js";

const router = Router();

router.route("/getInfo").get(getAdminDashboard);
router.route("/deleteWhole").delete(deleteWhole);

export default router;
