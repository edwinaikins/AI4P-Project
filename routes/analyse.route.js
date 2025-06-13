import { Router } from 'express';
import { analyseClarityandCoherence, analyseCreativity, analyseEthicalEvaluation, analyseImpactAssessment, analyseTechnicalFeasibility } from '../controllers/analyse.controller.js';

const router = Router();

router.post('/analysecreativity', analyseCreativity);
router.post('/analysetechnicalfeasibility', analyseTechnicalFeasibility);
router.post('/analyseimpactassessment', analyseImpactAssessment);
router.post('/analyseethicalevaluation', analyseEthicalEvaluation);
router.post('/analyseclarityandcoherence', analyseClarityandCoherence);

export default router;
