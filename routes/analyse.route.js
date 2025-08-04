import { Router } from 'express';
import multer from 'multer';
import { analyseClarityandCoherence, analyseCreativity, analyseEthicalEvaluation, analyseImpactAssessment, analyseTechnicalFeasibility, analyseExtractIdea, analyseFullIdea, analyseCreativityIdea, analyseStackRanking, stackranking } from '../controllers/analyse.controller.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/analysecreativity', analyseCreativity);
router.post('/analysecreativeidea', analyseCreativityIdea),
router.post('/analysetechnicalfeasibility', analyseTechnicalFeasibility);
router.post('/analyseimpactassessment', analyseImpactAssessment);
router.post('/analyseethicalevaluation', analyseEthicalEvaluation);
router.post('/analyseclarityandcoherence', analyseClarityandCoherence);
router.post('/analysefullidea', analyseFullIdea);
router.post('/extractidea', upload.single('file'), analyseExtractIdea);
router.post('/stackranking', analyseStackRanking);
router.post('/testranking', stackranking);

export default router;
