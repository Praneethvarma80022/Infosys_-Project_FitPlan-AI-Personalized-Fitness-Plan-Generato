import React, { useState } from 'react';

const MentalHealthWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div className="mh-widget">
      {/* Iframe panel */}
      <div className={`mh-widget__iframe-wrapper${isOpen ? ' open' : ''}`}>
        {isOpen && (
          <iframe
            className="mh-widget__iframe"
            src="/ai-assistant/widget.html"
            title="AI Support Assistant"
            allow="microphone; camera; autoplay"
          />
        )}
      </div>

      {/* Floating trigger button */}
      <button
        className={`mh-widget__trigger${isOpen ? ' open' : ''}`}
        onClick={toggle}
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default MentalHealthWidget;
