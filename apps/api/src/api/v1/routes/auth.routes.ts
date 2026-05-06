import { Router } from "express";

const router: Router = Router();

router.post("/register", (req, res) => {
  res.send("Register");
});

router.post("/login", (req, res) => {
  res.send("Login");
});

export default router;
