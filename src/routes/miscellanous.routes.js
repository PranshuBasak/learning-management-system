import express from "express";
import { contactUs } from "../controllers/miscellanous.controller.js";
const miscRouter = express.Router();

miscRouter.post("/contact", contactUs);


export default miscRouter;