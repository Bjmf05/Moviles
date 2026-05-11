import { Router } from "express";
import * as usersController from "../controllers/users.js";

const router = Router();

router.post("/register", usersController.createUser);
router.post("/login", usersController.loginUser);
router.get("/profile", usersController.getUserProfile);
router.put("/profile", usersController.updateUserProfile);
router.delete("/account", usersController.deleteUser);

export default router;