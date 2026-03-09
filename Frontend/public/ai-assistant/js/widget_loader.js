(function () {
    // Avoid double initialization
    if (document.getElementById('mindvoice-widget-container')) return;

    // --- Configuration ---
    const WIDGET_URL = 'widget.html'; // Path to your widget app

    // --- Styles ---
    const styles = `
        #mindvoice-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 15px;
        }

        #mindvoice-widget-iframe-wrapper {
            width: 380px;
            height: 600px;
            max-height: 80vh;
            background: transparent;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
            transform-origin: bottom right;
        }

        #mindvoice-widget-iframe-wrapper.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: all;
        }

        #mindvoice-widget-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: transparent;
        }

        #mindvoice-widget-trigger {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0F766E 0%, #2DD4BF 100%);
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(15, 118, 110, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        #mindvoice-widget-trigger:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(15, 118, 110, 0.5);
        }

        #mindvoice-widget-trigger svg {
            width: 32px;
            height: 32px;
            fill: white;
            transition: opacity 0.2s;
        }

        #mindvoice-widget-trigger .close-icon {
            display: none;
            position: absolute;
        }

        #mindvoice-widget-trigger.open .chat-icon {
            opacity: 0;
        }
        
        #mindvoice-widget-trigger.open .close-icon {
            display: block;
            opacity: 1;
        }
    `;

    // Inject Styles
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // --- DOM Elements ---
    const container = document.createElement('div');
    container.id = 'mindvoice-widget-container';

    // Iframe Wrapper
    const iframeWrapper = document.createElement('div');
    iframeWrapper.id = 'mindvoice-widget-iframe-wrapper';

    // Iframe (Lazy load source on first click if optimization needed, but here we load immediately/on-demand)
    const iframe = document.createElement('iframe');
    iframe.id = 'mindvoice-widget-iframe';
    iframe.src = WIDGET_URL;
    iframe.allow = "microphone; camera; autoplay"; // Important for voice features

    iframeWrapper.appendChild(iframe);

    // Trigger Button
    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'mindvoice-widget-trigger';
    triggerBtn.innerHTML = `
        <svg class="chat-icon" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <svg class="close-icon" viewBox="0 0 24 24">
             <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
    `;

    // Assemble
    container.appendChild(iframeWrapper);
    container.appendChild(triggerBtn);
    document.body.appendChild(container);

    // --- Event Listeners ---
    let isOpen = false;

    triggerBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            iframeWrapper.classList.add('open');
            triggerBtn.classList.add('open');
        } else {
            iframeWrapper.classList.remove('open');
            triggerBtn.classList.remove('open');
        }
    });

})();
