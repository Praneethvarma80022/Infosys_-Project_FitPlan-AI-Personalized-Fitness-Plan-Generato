const router = require('express').Router();
const crypto = require('crypto');

// --- In-memory session store ---
const sessions = new Map();
const SESSION_TTL = 60 * 60 * 1000; // 1 hour

function pruneOldSessions() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) sessions.delete(id);
  }
}

// --- Crisis detection (mirrors Frontend/public/ai-assistant/js/safety-monitor.js) ---
const CRITICAL_WORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life',
  'self-harm', 'hurt myself', 'cut myself', 'harm myself',
  'want to die', 'better off dead', 'no point living',
  'hurt others', 'kill someone', 'harm others', 'end it all',
  'take my own life', 'not worth living', 'kill them'
];

const WARNING_WORDS = [
  'hopeless', 'worthless', 'trapped', 'burden',
  'desperate', 'overwhelmed', "can't cope", 'give up',
  'no way out', 'pointless', 'useless', 'hate myself'
];

function detectCrisis(text) {
  const lower = (text || '').toLowerCase();
  if (CRITICAL_WORDS.some(w => lower.includes(w))) return 'CRITICAL';
  if (WARNING_WORDS.some(w => lower.includes(w))) return 'WARNING';
  return 'NONE';
}

const CRISIS_RESPONSE = `I'm very concerned about what you've shared. Your safety is the most important thing right now.\n\nPlease reach out for immediate support:\n• Crisis Helpline: 988 (available 24/7)\n• Emergency Services: 911\n• Crisis Text Line: Text HOME to 741741\n\nYou don't have to go through this alone. There are people who want to help you.`;

const WARNING_RESPONSE = `I hear that you're going through a difficult time. Please remember that professional support is available if you need someone to talk to.\n\nConsider reaching out to:\n• Crisis Helpline: 988\n• Your healthcare provider\n• A trusted friend or family member\n\nWould you like to continue our conversation, or would you prefer information about mental health resources?`;

// --- Rule-based response engine ---
const RESPONSES = {
  greeting: [
    (name) => `Hello ${name}! I'm glad you reached out. I'm here with you. What would you like to talk about today?`,
    (name) => `Hi ${name}! Welcome. This is a safe space to share whatever is on your mind. How are you feeling right now?`,
    (name) => `Hey ${name}! Good to see you here. I'm ready to listen. What's going on?`
  ],
  stress: [
    () => "Stress can be really draining. If you're open to it, let's try a short breathing reset: inhale for 4 counts, hold for 4, exhale for 6. Repeat 4 times. Want to try it together?",
    () => "That sounds stressful. When pressure builds up, even small breaks can help. What's the biggest source of stress for you right now?",
    () => "I understand stress can feel overwhelming. One thing that helps is breaking things into smaller pieces. Can you tell me what feels most urgent to address?"
  ],
  anxiety: [
    () => "Feeling anxious can make everything feel louder. A grounding exercise can help: name 3 things you can see, 2 you can touch, and 1 sound you hear. Would you like to try that now?",
    () => "Anxiety is tough, but you're not alone in feeling this way. Let's try to slow things down together. What thought keeps coming back the most?",
    () => "When anxiety hits, our body goes into alert mode. Try placing one hand on your chest and breathing slowly. Notice how your hand rises and falls. This can help calm your nervous system."
  ],
  sadness: [
    () => "I'm sorry you're feeling down. It makes sense to feel low sometimes, and you don't have to handle it alone. What has been weighing on you the most lately?",
    () => "Sadness is a valid feeling, and it's okay to sit with it for a while. Is there something specific that triggered this, or has it been building up?",
    () => "I hear you. Feeling sad can be draining. Sometimes just acknowledging it is an important first step. What would feel comforting to you right now?"
  ],
  anger: [
    () => "It sounds like something has been really frustrating. It's completely valid to feel angry. Would you like to talk about what triggered this feeling?",
    () => "Anger often comes up when something feels unfair or when our boundaries are crossed. What happened that brought this up?",
    () => "I hear your frustration. Sometimes expressing anger is healthy. What feels like the core issue behind this feeling?"
  ],
  loneliness: [
    () => "I'm sorry you're feeling lonely. You deserve connection and care. Is there a person or place that usually feels a bit safer or kinder to you?",
    () => "Loneliness can be really painful. Even though I'm just a chat assistant, I want you to know you're not alone right now. What kind of connection are you missing most?",
    () => "Feeling isolated is hard. Sometimes small steps toward connection can help — even a short message to someone you trust. Is there anyone you feel comfortable reaching out to?"
  ],
  fatigue: [
    () => "That sounds exhausting. Rest is just as important as activity. If you could take just one small step to care for yourself right now, what would feel doable?",
    () => "Being tired affects everything — mood, motivation, focus. Have you been able to get enough sleep lately, or is something keeping you up?",
    () => "Fatigue can be your body's way of saying it needs a break. It's okay to slow down. What's been taking up most of your energy?"
  ],
  overwhelm: [
    () => "That sounds like a lot to carry. When things pile up, it can help to slow down and choose just one small thing to focus on. What feels most urgent right now?",
    () => "Being overwhelmed is a sign you're carrying more than usual. Let's try to untangle it together. Can you name the top thing on your mind?",
    () => "I hear you. When everything feels like too much, even thinking about it can be exhausting. What if we just focus on one thing for now?"
  ],
  positive: [
    (name) => `That's wonderful to hear, ${name}! What's been going well for you? Recognizing positive moments can help build resilience.`,
    (name) => `I'm glad you're feeling good, ${name}! That positive energy is worth holding onto. What do you think contributed to this feeling?`,
    (name) => `Great to hear that, ${name}! Celebrating the good moments is important. What made today a good day?`
  ],
  fitness: [
    () => "Exercise is a great way to support both your body and mind. How are you feeling about your fitness journey? Remember, progress isn't always linear.",
    () => "Working out can be a powerful mood booster. Are you enjoying your current routine, or is something feeling off about it?",
    () => "Fitness is as much mental as it is physical. How is your workout routine making you feel overall? Any challenges you'd like to talk about?"
  ],
  sleep: [
    () => "Sleep is so important for both physical and mental health. Have you been having trouble sleeping? Things like a consistent bedtime routine or reducing screen time before bed can help.",
    () => "Poor sleep can affect everything. Are you finding it hard to fall asleep, stay asleep, or both?",
    () => "Rest is recovery. If sleep has been tough, try a simple wind-down routine: dim lights, no screens for 30 minutes, and some deep breathing."
  ],
  gratitude: [
    () => "You're welcome! I'm always here whenever you need to talk. Take care of yourself.",
    () => "Anytime! Remember, reaching out is a sign of strength. I'm here whenever you need me.",
    () => "Glad I could help! Don't hesitate to come back whenever you want to chat."
  ],
  default: [
    () => "Thank you for sharing that with me. I'm here to listen and support you. What part of this feels the hardest right now?",
    () => "I appreciate you trusting me with that. Can you tell me more about how this is affecting you?",
    () => "I hear you. Sometimes just talking about things can help. What would you like to explore further?",
    () => "That's an important thing to bring up. How long have you been feeling this way?",
    () => "I'm here for you. Would it help to talk through what's on your mind step by step?"
  ]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function classifyMessage(text) {
  const lower = text.toLowerCase();

  if (/^(hello|hi|hey|good morning|good evening|good afternoon|howdy)\b/.test(lower)) return 'greeting';
  if (/overwhelm|too much|can'?t cope|piling up|so much to do/.test(lower)) return 'overwhelm';
  if (/stress|burnout|pressure|tense|strain/.test(lower)) return 'stress';
  if (/anxious|anxiety|panic|nervous|worried|worrying|fear/.test(lower)) return 'anxiety';
  if (/sad|down|depressed|hopeless|low|crying|cry|tears|miserable/.test(lower)) return 'sadness';
  if (/angry|frustrated|irritated|mad|furious|rage|annoyed/.test(lower)) return 'anger';
  if (/lonely|alone|isolated|no friends|nobody|no one/.test(lower)) return 'loneliness';
  if (/tired|exhausted|sleep|fatigue|drained|worn out|no energy/.test(lower)) return 'fatigue';
  if (/can'?t sleep|insomnia|sleepless|restless night/.test(lower)) return 'sleep';
  if (/happy|good|great|amazing|wonderful|motivated|excited|proud|better/.test(lower)) return 'positive';
  if (/workout|exercise|gym|fitness|training|running|muscle|cardio|diet|weight/.test(lower)) return 'fitness';
  if (/thank|thanks|thank you|appreciate/.test(lower)) return 'gratitude';

  return 'default';
}

function generateResponse(session, userText) {
  const category = classifyMessage(userText);
  const responsePool = RESPONSES[category];
  const fn = pickRandom(responsePool);

  // Some response functions accept the user's name
  if (category === 'greeting' || category === 'positive') {
    return fn(session.userName);
  }
  return fn();
}

// --- Routes ---

router.post('/session/start', (req, res) => {
  try {
    pruneOldSessions();

    const { user_name } = req.body;
    if (!user_name || typeof user_name !== 'string' || !user_name.trim()) {
      return res.status(400).json({ error: 'user_name is required' });
    }

    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, {
      userName: user_name.trim(),
      history: [],
      createdAt: Date.now()
    });

    console.log(`MindVoice session started: ${sessionId} for "${user_name.trim()}"`);
    res.json({ session_id: sessionId });
  } catch (err) {
    console.error('Session start error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

router.post('/conversation', (req, res) => {
  try {
    const { session_id, user_message } = req.body;

    if (!session_id || !user_message) {
      return res.status(400).json({ error: 'session_id and user_message are required' });
    }

    const session = sessions.get(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Crisis detection
    const crisisLevel = detectCrisis(user_message);

    if (crisisLevel === 'CRITICAL') {
      session.history.push({ role: 'user', text: user_message });
      session.history.push({ role: 'assistant', text: CRISIS_RESPONSE });
      return res.json({ ai_response: CRISIS_RESPONSE, crisis_detected: true });
    }

    // Generate response
    let aiResponse;
    if (crisisLevel === 'WARNING') {
      aiResponse = WARNING_RESPONSE;
    } else {
      aiResponse = generateResponse(session, user_message);
    }

    // Update history
    session.history.push({ role: 'user', text: user_message });
    session.history.push({ role: 'assistant', text: aiResponse });

    // Keep history bounded (last 50 messages)
    if (session.history.length > 50) {
      session.history = session.history.slice(-50);
    }

    res.json({ ai_response: aiResponse, crisis_detected: false });
  } catch (err) {
    console.error('Conversation error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
