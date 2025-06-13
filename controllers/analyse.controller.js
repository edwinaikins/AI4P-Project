import { runCreativityAnalysis } from '../modules/creativity/analyse.js';
import { runTechnicalFeasibiltyAnalysis } from '../modules/creativity/analyse.js';
import { runImpactAssessmentAnalysis } from '../modules/creativity/analyse.js';
import { runEthicalEvaluationAnalysis } from '../modules/creativity/analyse.js';
import { runClarityandCoherenceAnalysis } from '../modules/creativity/analyse.js';

export const analyseCreativity = async (req, res) => {
  const { new_idea, existing_ideas } = req.body;

  if (typeof new_idea !== 'string' || !Array.isArray(existing_ideas)) {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  try {
    const result = await runCreativityAnalysis(new_idea, existing_ideas);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Model or server error', details: err.message });
  }
};

export const analyseTechnicalFeasibility = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== 'string') {
    return res.status(400).json({error: 'Invalid input format'});
  }

  try {
    const result = await runTechnicalFeasibiltyAnalysis(new_idea);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Model or server error', details: err.message});
  }
}

export const analyseImpactAssessment = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== 'string') {
    return res.status(400).json({error: 'Invalid input format'});
  }

  try {
    const result = await runImpactAssessmentAnalysis(new_idea);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Model or server error', details: err.message});
  }
}

export const analyseEthicalEvaluation = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== 'string') {
    return res.status(400).json({error: 'Invalid input format'});
  }

  try {
    const result = await runEthicalEvaluationAnalysis(new_idea);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Model or server error', details: err.message});
  }
}

export const analyseClarityandCoherence = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== 'string') {
    return res.status(400).json({error: 'Invalid input format'});
  }

  try {
    const result = await runClarityandCoherenceAnalysis(new_idea);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Model or server error', details: err.message});
  }
}