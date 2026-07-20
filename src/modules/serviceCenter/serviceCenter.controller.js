import { Router } from "express";
const router = Router();
// GET /api/service-centers/nearby?lat=30.01&lng=31.21&maxDistance=5000
import ServiceCenter from "../../DB/models/ServiceCenter.model.js";
import { getNearbyServiceCenters } from "../serviceCenter/serviceCenter.service.js";













router.get("/nearby", getNearbyServiceCenters);



export default router;