import express from 'express'
import multer from 'multer'
import {
  validateEmail,
  bulkValidate,
  getValidationSummary,
  clearHistory,
  getUserBatches,
  updateBatchName,
  getBulkDetails,
  preParseEmailCount
} from './email.controller.js'
import { requireAuth, requireCredits, requirePermission } from '../../middleware/authMiddleware.js'

const router = express.Router()
const storage = multer.memoryStorage()
const upload = multer({ storage })

router.post('/validate', requireAuth, requirePermission("Email Sanitization"), requireCredits(() => 1), validateEmail)
router.post('/upload', requireAuth, requirePermission("Email Sanitization"), upload.single("file"), preParseEmailCount, requireCredits((req) => req.emailCount), bulkValidate)
router.get('/summary', requireAuth, requirePermission("Email Sanitization"), getValidationSummary)
router.delete('/clear-history', requireAuth, requirePermission("Email Sanitization"), clearHistory)
router.get('/batch/list', requireAuth, requirePermission("Email Sanitization"), getUserBatches)
router.get('/batch/:bulkId', requireAuth, requirePermission("Email Sanitization"), getBulkDetails)
router.put('/batch/update', requireAuth, requirePermission("Email Sanitization"), updateBatchName)

export default router
