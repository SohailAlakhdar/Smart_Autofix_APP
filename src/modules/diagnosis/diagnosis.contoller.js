const express = require('express');
const router = express.Router();

const diagnosisController = require('./diagnosis.contoller');
const authMiddleware = require('../../middlewares/auth.middlewares');
const validationMiddleware = require('../../middlewares/validation.middleware');
const { createDiagnosisSchema, getDiagnosisByIdSchema } = require('./diagnosis.validation');

router.use(authMiddleware); 

router.post('/', validationMiddleware(createDiagnosisSchema), diagnosisController.createDiagnosis);
router.get('/', diagnosisController.getUserDiagnoses);
router.get('/:id', validationMiddleware(getDiagnosisByIdSchema), diagnosisController.getDiagnosisById);

module.exports = router;