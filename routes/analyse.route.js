import { Router } from 'express';
import multer from 'multer';
import {analyseCreativity, analyseExtractIdea, analyseFullIdea, analyseCreativityIdea, analyseStackRanking, analyseIdea, ideaChecker, stackranking, snetideachecker, unifiedIdeaChecker, agenticIdeaAnalyses } from '../controllers/analyse.controller.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/analysecreativity', analyseCreativity);
router.post('/analysecreativeidea', analyseCreativityIdea),
router.post('/analysefullidea', analyseFullIdea);
router.post('/extractidea', upload.single('file'), analyseExtractIdea);
router.post('/stackranking', analyseStackRanking);

// Deep Ideation
router.post('/analyseidea', analyseIdea);
router.post('/ideachecker', ideaChecker);
router.post('/stackrank', stackranking);
//router.post('/processideas', processIdeas);

//snet
router.post('/snetideachecker', snetideachecker);

//unified
router.post('/unifiedideachecker', unifiedIdeaChecker);

/**
 * @swagger
 * /api/agentic-evaluate:
 *   post:
 *     summary: Run full agentic evaluation
 *     tags: [Agentic Evaluation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgenticEvaluationRequest'
 *     responses:
 *       200:
 *         description: Successful evaluation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgenticEvaluationResponse'
 */
router.post('/submitidea', agenticIdeaAnalyses);

export default router;
