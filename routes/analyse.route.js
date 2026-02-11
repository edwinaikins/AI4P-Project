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
/**
 * @swagger
 * /stackrank:
 *   post:
 *     summary: Rank ideas within a challenge
 *     description: |
 *       Ranks all evaluated ideas for a specific challenge using
 *       cluster-normalized weighted composite scoring.
 *
 *       The system performs:
 *       - Cluster-based min-max normalization
 *       - Weighted composite score calculation
 *       - Descending ranking
 *
 *     tags: [Ranking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StackRankRequest'
 *     responses:
 *       200:
 *         description: Ranked ideas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StackRankResponse'
 */
router.post('/stackrank', stackranking);
//router.post('/processideas', processIdeas);

//snet
/**
 * @swagger
 * /snetideachecker:
 *   post:
 *     summary: Check idea against SNET ecosystem
 *     description: |
 *       Performs feasibility analysis and similarity detection
 *       against SNET GitHub repositories and marketplace services.
 *     tags: [Similarity]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SnetIdeaCheckerRequest'
 *     responses:
 *       200:
 *         description: Similarity and feasibility result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SnetIdeaCheckerResponse'
 */
router.post('/snetideachecker', snetideachecker);

//unified
/**
 * @swagger
 * /unifiedideachecker:
 *   post:
 *     summary: Unified idea similarity check
 *     description: |
 *       Checks idea similarity across:
 *       - Deep Funding repository
 *       - SNET GitHub repositories
 *       - SNET Marketplace services
 *
 *       Returns feasibility score, cluster classification,
 *       and most similar existing system if similarity ≥ threshold.
 *
 *     tags: [Similarity]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnifiedIdeaCheckerRequest'
 *     responses:
 *       200:
 *         description: Unified similarity result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnifiedIdeaCheckerResponse'
 */
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
