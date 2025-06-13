import { runCreativityAnalysis } from '../modules/creativity/analyse.js';

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
