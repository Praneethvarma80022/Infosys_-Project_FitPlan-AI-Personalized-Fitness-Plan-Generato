const fs = require('fs');
const path = require('path');
const router = require('express').Router();

const exercisesDir = path.join(__dirname, '..', '..', 'exercises');
const normalizedIndex = new Map();
const exerciseList = [];

const normalizeText = (value) => (value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '');

const tokenize = (value) => (value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .split(' ')
  .filter((token) => token.length > 2);

const loadExercises = () => {
  if (!fs.existsSync(exercisesDir)) {
    console.warn('Exercise dataset not found at', exercisesDir);
    return;
  }

  const files = fs.readdirSync(exercisesDir)
    .filter((file) => file.endsWith('.json'));

  files.forEach((fileName) => {
    const filePath = path.join(exercisesDir, fileName);
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      const id = data.id || fileName.replace(/\.json$/i, '');
      const name = data.name || id;
      const entry = {
        id,
        name,
        force: data.force || null,
        level: data.level || null,
        mechanic: data.mechanic || null,
        equipment: data.equipment || null,
        primaryMuscles: data.primaryMuscles || [],
        secondaryMuscles: data.secondaryMuscles || [],
        instructions: data.instructions || [],
        category: data.category || null,
        images: data.images || []
      };

      const normalizedName = normalizeText(name);
      const normalizedId = normalizeText(id);

      exerciseList.push({
        ...entry,
        normalizedName,
        normalizedId
      });

      if (normalizedName) normalizedIndex.set(normalizedName, entry);
      if (normalizedId) normalizedIndex.set(normalizedId, entry);
    } catch (err) {
      console.warn('Failed to load exercise', fileName, err.message);
    }
  });
};

const scoreMatch = (tokens, entry) => {
  let score = 0;
  tokens.forEach((token) => {
    if (entry.normalizedName.includes(token)) score += 2;
    if (entry.normalizedId.includes(token)) score += 1;
  });
  return score;
};

const findBestMatch = (name) => {
  const normalized = normalizeText(name);
  if (normalizedIndex.has(normalized)) {
    return normalizedIndex.get(normalized);
  }

  const tokens = tokenize(name);
  if (!tokens.length) return null;

  let best = null;
  let bestScore = 0;

  exerciseList.forEach((entry) => {
    const score = scoreMatch(tokens, entry);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  });

  return bestScore >= 2 ? best : null;
};

router.get('/lookup', (req, res) => {
  const queryName = (req.query.name || '').toString();
  if (!queryName) {
    return res.status(400).json({ message: 'Exercise name is required.' });
  }

  const match = findBestMatch(queryName);
  if (!match) {
    return res.status(404).json({ message: 'Exercise not found.' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const imageUrls = match.images.map((img) => `${baseUrl}/exercises/${img}`);

  return res.json({
    id: match.id,
    name: match.name,
    force: match.force,
    level: match.level,
    mechanic: match.mechanic,
    equipment: match.equipment,
    primaryMuscles: match.primaryMuscles,
    secondaryMuscles: match.secondaryMuscles,
    instructions: match.instructions,
    category: match.category,
    imageUrls
  });
});

loadExercises();

module.exports = router;
