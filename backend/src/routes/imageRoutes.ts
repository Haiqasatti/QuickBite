import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { importImage, uploadImage } from "../controllers/imageController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();
const parseUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
}).single("image");

function handleUpload(req: Request, res: Response, next: NextFunction): void {
  parseUpload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ success: false, message: "Images must be 5 MB or smaller." });
      return;
    }
    res.status(400).json({ success: false, message: "Upload one JPG, PNG, or WebP image file." });
  });
}

router.post("/upload", authenticate, authorizeRoles("ADMIN"), handleUpload, uploadImage);
router.post("/import", authenticate, authorizeRoles("ADMIN"), importImage);

export default router;