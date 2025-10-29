import express from 'express';
import { install } from '../controllers/installController.js';

const router = express.Router();

router.get('/install', install);

export default router;
