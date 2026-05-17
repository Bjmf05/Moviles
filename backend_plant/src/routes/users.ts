import { Router } from "express";
import * as usersController from "../controllers/users.js";
import {
  validateCreateUser,
  validateLogin,
  validateUpdateProfile,
  validateGoogleLogin,
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
router.post(
  "/google",
  validateGoogleLogin,
  handleValidationErrors,
  usersController.googleLogin,
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
