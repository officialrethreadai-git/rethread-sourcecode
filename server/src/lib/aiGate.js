// Global AI kill-switch the admin can toggle from /admin.html.
// When paused, /api/scan and /api/generate both return 503 AI_PAUSED
// so the admin can conserve the shared budget before a live demo.
const state = { paused: false };

export function isAiPaused() { return state.paused; }
export function setAiPaused(value) { state.paused = Boolean(value); }
export function getAiGateState() { return { paused: state.paused }; }
