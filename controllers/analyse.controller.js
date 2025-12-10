import { runCreativityAnalysis, runTechnicalFeasibiltyAnalysis, runImpactAssessmentAnalysis, runEthicalEvaluationAnalysis, runClarityandCoherenceAnalysis, runExtractIdeaAnalysis, runFullAIdeaEvaluation, runCreativityAnalysisandInsertIdea, runStackRanking, runideaEvaluation, runIdeaChecker } from '../modules/creativity/analyse.js';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';


export const analyseCreativity = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== 'string') {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  try {
    const result = await runCreativityAnalysis(new_idea);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Model or server error', details: err.message });
  }
};

export const analyseCreativityIdea = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== 'string') {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  try {
    const result = await runCreativityAnalysisandInsertIdea(new_idea);
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

export const analyseFullIdea = async (req, res) => {
  const { new_idea, challenge, author_id, idea_id } = req.body;

  if (typeof new_idea !== 'string' || new_idea.trim() === '') {
    return res.status(400).json({ error: 'Invalid or empty idea provided.' });
  }

  try {
    const result = await runFullAIdeaEvaluation(new_idea, challenge, author_id, idea_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server or model error', details: err.message });
  }
};

export const analyseExtractIdea = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // read the uploaded file into buffer
    const buffer = await fs.readFile(req.file.path);
    let text;

    // detect pdf vs plain text
    if (req.file.mimetype === 'application/pdf') {
      const pdf = await pdfParse(buffer);
      text = pdf.text;
    } else {
      text = buffer.toString('utf-8');
    }

    // call llm-based extractor
    const result = await runExtractIdeaAnalysis(text);

    // clean up temp file
    await fs.unlink(req.file.path);
    
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Model or server error', details: err.message });
  }
}

export const analyseStackRanking = async (req, res) => {
  // challenge id as body
  const { challenge } = req.body;

  if (typeof challenge !== 'string' || challenge.trim() === '') {
    return res.status(400).json({ error: 'Invalid or empty challenge ID provided.' });
  }
  try {
    const result = await runStackRanking(challenge);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Model or server error', details: err.message });
  }
};


// Deep Ideation

// full ideaa
export const analyseIdea = async (req, res) => {
  const {new_idea} = req.body;

  if (typeof new_idea !== 'string' || new_idea.trim() === '') {
    return res.status(400).json({ error: 'Invalid or empty idea provided.' });
  }

  try {
    const result = await runideaEvaluation(new_idea);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server or model error', details: err.message });
  }
}

// idea checker
export const ideaChecker = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== 'string') {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  try {
    const result = await runIdeaChecker(new_idea);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Model or server error', details: err.message });
  }
};