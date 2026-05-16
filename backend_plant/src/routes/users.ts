import { Router } from "express";
import * as usersController from "../controllers/users.js";
import {
  validateCreateUser,
  validateLogin,
  validateUpdateProfile,
  handleValidationErrors,
} from "../middleware/validators.js";

const router = Router();

router.post(
  "/register",
  validateCreateUser,
  handleValidationErrors,
  usersController.createUser,
);
router.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  usersController.loginUser,
);
router.get(
  "/profile",
  validateUpdateProfile,
  handleValidationErrors,
  usersController.getUserProfile,
);
router.put(
  "/profile",
  validateUpdateProfile,
  handleValidationErrors,
  usersController.updateUserProfile,
);
router.delete("/account", usersController.deleteUser);

export default router;
