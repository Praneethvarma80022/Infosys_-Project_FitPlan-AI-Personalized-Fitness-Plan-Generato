class AvatarComponent {
    constructor() {
        this.statusElement = document.getElementById('avatar-status');
        this.container = document.getElementById('avatar-container');
        this.videoElement = null;
        this.currentState = 'IDLE';
        this.currentGender = 'female';

        this.initialize();
    }

    initialize() {
        this.setGender('female');
        this.setState('IDLE');
    }

    setGender(gender) {
        if (!this.container) return;
        this.currentGender = gender;

        // Clear container and add video element
        this.container.innerHTML = `<div class="avatar-core-gradient"></div>`;

        this.videoElement = document.createElement('video');
        this.videoElement.className = 'human-video';
        this.videoElement.autoplay = true;
        this.videoElement.loop = true;
        this.videoElement.muted = true; // Required for autoplay
        this.videoElement.playsInline = true;
        this.videoElement.style.width = '100%';
        this.videoElement.style.height = '100%';
        this.videoElement.style.objectFit = 'cover';
        this.videoElement.style.borderRadius = '50%';
        this.videoElement.style.position = 'relative';
        this.videoElement.style.zIndex = '5';

        this.container.appendChild(this.videoElement);

        // Force update state to load correct video
        const savedState = this.currentState;
        this.currentState = null; // Reset to force update
        this.setState(savedState);
    }

    setState(newState) {
        if (this.currentState === newState) return;
        this.currentState = newState;

        if (this.statusElement) {
            const statusMap = { 'IDLE': 'Ready', 'LISTENING': 'Listening...', 'THINKING': 'Thinking...', 'SPEAKING': 'Speaking...' };
            this.statusElement.textContent = statusMap[newState] || 'Active';
            const dot = document.querySelector('.status-dot');
            if (dot) dot.style.background = (newState === 'SPEAKING' || newState === 'LISTENING') ? '#10B981' : '#cbd5e1';
        }
        this.updateVideoSource(newState);
        this.updateVisuals(newState);
    }

    updateVideoSource(state) {
        if (!this.videoElement) return;

        // Map states to filenames
        // IDLE -> idle_{gender}.mp4
        // LISTENING -> listening_{gender}.mp4
        // THINKING -> thinking_{gender}.mp4
        // SPEAKING -> speaking_{gender}.mp4

        const filenameMap = {
            'IDLE': 'idle',
            'LISTENING': 'listening',
            'THINKING': 'thinking',
            'SPEAKING': 'speaking'
        };

        const action = filenameMap[state] || 'idle';
        const videoPath = `assets/avatars/${this.currentGender}/${action}_${this.currentGender}.mp4`;

        this.videoElement.src = videoPath;
        this.videoElement.play().catch(e => {
            console.warn("Auto-play failed:", e);
        });
    }

    updateVisuals(state) {
        const stage = document.querySelector('.avatar-stage');
        if (stage) {
            stage.classList.remove('speaking');
            if (state === 'SPEAKING') {
                stage.classList.add('speaking');
            }
        }
    }
}
