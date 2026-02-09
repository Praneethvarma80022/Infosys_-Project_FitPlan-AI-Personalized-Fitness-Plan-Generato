import React, { useEffect, useRef, useState } from 'react';

const STARTER_MESSAGE = "Hi there, I'm here to listen and support you. You can share what is on your mind, and we can take it one step at a time. What feels most heavy right now?";

const QUICK_REPLIES = [
  "I feel overwhelmed.",
  "I'm stressed and tired.",
  "I'm feeling lonely.",
  "I need a quick calming tip.",
];

const SELF_HARM_PATTERNS = [
  /suicid(e|al)/i,
  /kill myself/i,
  /end it all/i,
  /end my life/i,
  /hurt myself/i,
  /self harm/i,
  /self-harm/i,
  /want to die/i,
];

const RESPONSES = {
  greeting: "Hello, I'm glad you reached out. I'm here with you. What would you like support with right now?",
  overwhelmed: "That sounds like a lot to carry. When things pile up, it can help to slow down and choose just one small thing to focus on. Would you like to name the one task or worry that feels most urgent?",
  stressed: "Stress can be really draining. If you're open to it, we can try a short breathing reset: inhale for 4, hold for 4, exhale for 6, repeat 4 times. Want to try it together?",
  anxious: "Feeling anxious can make everything feel louder. A grounding check can help: name 3 things you can see, 2 you can touch, and 1 sound you can hear. Would you like to try that now?",
  lonely: "I'm sorry you are feeling lonely. You deserve connection and care. Is there a person or place that usually feels a bit safer or kinder to you?",
  sad: "I'm sorry you are feeling down. It makes sense to feel low sometimes, and you don't have to handle it alone. What has been weighing on you the most lately?",
  tired: "That sounds exhausting. If you could take just one small step to care for yourself, what would feel doable right now?",
  default: "Thank you for sharing that with me. I'm here to listen and support you. What part of this feels the hardest right now?",
};

const isSelfHarmMentioned = (text) => SELF_HARM_PATTERNS.some((pattern) => pattern.test(text));

const getResponse = (text) => {
  const lower = text.toLowerCase();

  if (isSelfHarmMentioned(text)) {
    return "I'm really sorry you're feeling this way, and I'm glad you told me. You deserve support and safety. If you are in immediate danger or feel like you might act on these thoughts, please contact local emergency services right now. If you're in the US, you can call or text 988 for the Suicide and Crisis Lifeline. If you're elsewhere, I can help you find a local number. Are you somewhere safe right now?";
  }

  if (/hello|hi|hey|good morning|good evening/.test(lower)) {
    return RESPONSES.greeting;
  }

  if (/overwhelm|too much|cant cope|cannot cope/.test(lower)) {
    return RESPONSES.overwhelmed;
  }

  if (/stress|burnout|pressure/.test(lower)) {
    return RESPONSES.stressed;
  }

  if (/anxious|anxiety|panic|nervous/.test(lower)) {
    return RESPONSES.anxious;
  }

  if (/lonely|alone|isolated/.test(lower)) {
    return RESPONSES.lonely;
  }

  if (/sad|down|depressed|hopeless|low/.test(lower)) {
    return RESPONSES.sad;
  }

  if (/tired|exhausted|sleep|fatigue/.test(lower)) {
    return RESPONSES.tired;
  }

  return RESPONSES.default;
};

const MentalHealthWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: STARTER_MESSAGE },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMicSupported, setIsMicSupported] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0]?.transcript || '';
      if (!transcript) return;
      setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsMicSupported(true);

    return () => {
      recognition.abort();
    };
  }, []);

  const handleSend = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    const responseText = getResponse(trimmed);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', text: responseText },
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSend(inputValue);
  };

  const toggleListening = () => {
    if (!isMicSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  return (
    <div className="mh-widget">
      <button
        className="mh-widget__toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Toggle support chat"
      >
        <span className="mh-widget__toggle-label">Support</span>
        <span className="mh-widget__toggle-dot" />
      </button>

      {isOpen && (
        <section className="mh-widget__panel" aria-live="polite">
          <header className="mh-widget__header">
            <div>
              <p className="mh-widget__title">Wellbeing Support</p>
              <p className="mh-widget__subtitle">A calm space to talk things through.</p>
            </div>
            <button
              className="mh-widget__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close support chat"
            >
              Close
            </button>
          </header>

          <div className="mh-widget__messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mh-widget__message mh-widget__message--${message.role}`}
              >
                <div className="mh-widget__bubble">{message.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="mh-widget__message mh-widget__message--assistant">
                <div className="mh-widget__bubble mh-widget__bubble--typing">
                  <span className="mh-widget__typing-dot" />
                  <span className="mh-widget__typing-dot" />
                  <span className="mh-widget__typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="mh-widget__quick">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                className="mh-widget__quick-btn"
                onClick={() => handleSend(reply)}
              >
                {reply}
              </button>
            ))}
          </div>

          <form className="mh-widget__input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Share what you are feeling..."
              aria-label="Type your message"
            />
            <button
              type="button"
              className={`mh-widget__mic ${isListening ? 'is-listening' : ''}`}
              onClick={toggleListening}
              disabled={!isMicSupported}
              aria-pressed={isListening}
              aria-label={isMicSupported ? 'Toggle microphone' : 'Microphone not supported'}
              title={isMicSupported ? 'Use microphone' : 'Microphone not supported'}
            >
              {isListening ? 'Listening' : 'Mic'}
            </button>
            <button type="submit">Send</button>
          </form>

          <footer className="mh-widget__footer">
            This is not medical care. If you are in immediate danger, contact local emergency services.
          </footer>
        </section>
      )}
    </div>
  );
};

export default MentalHealthWidget;
