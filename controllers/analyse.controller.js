import {
  runCreativityAnalysis,
  runExtractIdeaAnalysis,
  runFullAIdeaEvaluation,
  runCreativityAnalysisandInsertIdea,
  runStackRanking,
  runideaEvaluation,
  runIdeaChecker,
  runstackranking,
  runSingularityNetIdeaChecker,
} from "../modules/creativity/analyse.js";
import { runUnifiedIdeaChecker } from "../modules/creativity/idea-checker.js";
import fs from "fs/promises";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { runAgenticEvaluation } from "../modules/orchestrator/index.js";
import { evaluateProposal } from "../modules/agents/RFP/index.js";

export const analyseCreativity = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== "string") {
    return res.status(400).json({ error: "Invalid input format" });
  }

  try {
    const result = await runCreativityAnalysis(new_idea);
    res.json(result);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Model or server error", details: err.message });
  }
};

export const analyseCreativityIdea = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== "string") {
    return res.status(400).json({ error: "Invalid input format" });
  }

  try {
    const result = await runCreativityAnalysisandInsertIdea(new_idea);
    res.json(result);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Model or server error", details: err.message });
  }
};

export const analyseFullIdea = async (req, res) => {
  const { new_idea, challenge, author_id, idea_id } = req.body;

  if (typeof new_idea !== "string" || new_idea.trim() === "") {
    return res.status(400).json({ error: "Invalid or empty idea provided." });
  }

  try {
    const result = await runFullAIdeaEvaluation(
      new_idea,
      challenge,
      author_id,
      idea_id
    );
    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Server or model error", details: err.message });
  }
};

// Agentic Approach to idea submission with idea similarity check
export const agenticIdeaAnalyses = async (req, res) => {
  const { new_idea, challengeConfig } = req.body;

  if (typeof new_idea !== "string" || new_idea.trim() === "") {
    return res.status(400).json({ error: "Invalid or empty idea provided." });
  }

  try {
    const result = await runAgenticEvaluation({ new_idea, challengeConfig });
    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Server or model error", details: err.message });
  }
};

export const analyseExtractIdea = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // read the uploaded file into buffer
    const buffer = await fs.readFile(req.file.path);
    let text;

    // detect pdf vs plain text
    if (req.file.mimetype === "application/pdf") {
      const pdf = await pdfParse(buffer);
      text = pdf.text;
    } else {
      text = buffer.toString("utf-8");
    }

    // call llm-based extractor
    const result = await runExtractIdeaAnalysis(text);

    // clean up temp file
    await fs.unlink(req.file.path);

    res.json(result);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "Model or server error", details: err.message });
  }
};

export const analyseStackRanking = async (req, res) => {
  // challenge id as body
  const { challenge } = req.body;

  if (typeof challenge !== "string" || challenge.trim() === "") {
    return res
      .status(400)
      .json({ error: "Invalid or empty challenge ID provided." });
  }
  try {
    const result = await runStackRanking(challenge);
    res.json(result);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Model or server error", details: err.message });
  }
};

// Deep Ideation

// full ideaa
export const analyseIdea = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== "string" || new_idea.trim() === "") {
    return res.status(400).json({ error: "Invalid or empty idea provided." });
  }

  try {
    const result = await runideaEvaluation(new_idea);
    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Server or model error", details: err.message });
  }
};

// idea checker
export const ideaChecker = async (req, res) => {
  const { new_idea } = req.body;

  if (typeof new_idea !== "string") {
    return res.status(400).json({ error: "Invalid input format" });
  }

  try {
    const result = await runIdeaChecker(new_idea);
    res.json(result);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Model or server error", details: err.message });
  }
};

// stack ranking
export const stackranking = async (req, res) => {
  // challenge id as body
  const { challenge } = req.body;

  if (typeof challenge !== "string" || challenge.trim() === "") {
    return res
      .status(400)
      .json({ error: "Invalid or empty challenge ID provided." });
  }
  try {
    const result = await runstackranking(challenge);
    res.json(result);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Model or server error", details: err.message });
  }
};

//snetideachecker
export const snetideachecker = async (req, res) => {
  const { newIdeaText } = req.body;

  if (typeof newIdeaText !== "string") {
    return res.status(400).json({ error: "Invalid input format" });
  }

  try {
    const result = await runSingularityNetIdeaChecker(newIdeaText);
    res.json(result);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Model or server error", details: err.message });
  }
};

// unified idea checker
export const unifiedIdeaChecker = async (req, res) => {
  const { newIdeaText } = req.body;

  if (typeof newIdeaText !== "string") {
    return res.status(400).json({ error: "Invalid input format" });
  }

  try {
    const result = await runUnifiedIdeaChecker(newIdeaText);
    res.json(result);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Model or server error", details: err.message });
  }
};

// RFP evaluator

export const evaluateRFP = async (req, res) => {
  const { rfp, proposal, proposals, criteria } = req.body;

  // Basic validation
  if (
    typeof rfp !== "object" ||
    !Array.isArray(criteria) ||
    (!proposal && !proposals)
  ) {
    return res.status(400).json({
      error:
        "Invalid input. Provide rfp (object), criteria (array), and proposal or proposals.",
    });
  }

  // Validate proposals
  if (proposal && typeof proposal !== "object") {
    return res.status(400).json({
      error: "proposal must be an object",
    });
  }

  if (proposals && !Array.isArray(proposals)) {
    return res.status(400).json({
      error: "proposals must be an array",
    });
  }

  try {
    const result = await evaluateProposals({
      rfp,
      proposal,
      proposals,
      criteria,
    });

    res.json(result);
  } catch (err) {
    console.error("RFP Evaluation Error:", err);

    res.status(500).json({
      error: "Model or server error",
      details: err.message,
    });
  }
};

// // script
// export const processIdeas = async (req, res) => {
//   try {
//     const result = await runProcessIdeas();
//     res.json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({error: 'Model or server error', details: error.message});
//   }
//}
