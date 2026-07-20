import { Router } from "express";
const router = Router()
import * as authService from "./auth.service.js"
import * as validators from "./auth.validation.js"
import { validation } from "../../middlewares/validation.middleware.js";

router.post("/signup", validation(validators.signup), authService.signup)
router.post("/login", validation(validators.login), authService.login)

export default router