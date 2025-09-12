import express from 'express';
import { verifyAdmin, verifyToken } from '../utils/verifyToken.js';
import {
  createPricingRule,
  getAllPricingRules,
  getPricingRulesByTourId,
  getPricingRuleById,
  updatePricingRule,
  deletePricingRule,
  calculatePrice
} from '../controllers/pricingController.js';

const router = express.Router();

// Calculate price based on pricing rules (accessible to all authenticated users)
router.post('/calculate', verifyToken, calculatePrice);

// Routes accessible to all users (no authentication required)
router.get('/tour/:tourId', getPricingRulesByTourId);

// Routes that require admin privileges
router.post('/', verifyAdmin, createPricingRule);
router.get('/', verifyAdmin, getAllPricingRules);
router.get('/:id', verifyAdmin, getPricingRuleById);
router.put('/:id', verifyAdmin, updatePricingRule);
router.delete('/:id', verifyAdmin, deletePricingRule);

export default router;
