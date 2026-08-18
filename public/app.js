// =======================================================
// ANTIGRAVITY AI REEL PREDICTOR & RECOMMENDATION ENGINE
// =======================================================

// State Management
let reelsLibrary = [];
let activeReelIndex = 0;
let isPlaying = true;
let reelPlaybackMs = 0;
const REEL_DURATION_MS = 10000;
let playbackTimerInterval = null;
let currentReelTelemetry = {
  watch_time_ms: 0,
  replay_count: 0,
  liked: false,
  saved: false,
  shared: false
};

// Deduplication & Anti-Repeat Tracking
let seenReelIds = new Set();
let seenReelTitles = new Set();
let watchedHistory = []; // Array of { id, title, category, watchedAt, completed }
let likedCategories = [];
let inferredInterests = [];

let presetsData = [];
let categoriesData = {};
let trendsData = [];
let currentRecommendations = [];
let soundEnabled = true;
let audioCtx = null;
let activeDeepDiveData = null;
let isAutoAdvancing = false;

// =======================================================
// GEMINI VEO 2 AI REEL ENGINE STATE
// =======================================================
let activeVeoReel = null;
let veoPlaybackSec = 0.0;
let veoIsPlaying = false;
let veoVoiceEnabled = true;
const VEO_DURATION_SEC = 15.0;
let veoTimerInterval = null;
let veoAnimationFrameId = null;
let veoModalAnimationFrameId = null;
let curatedVeoGallery = [];
let currentVeoKeyframeIndex = -1;

// DOM Elements - Views & Navigation
const navTabs = document.querySelectorAll('.nav-tab-btn');
const appViews = document.querySelectorAll('.app-view');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
const soundLabel = document.getElementById('soundLabel');
const configToggleBtn = document.getElementById('configToggleBtn');
const configPanel = document.getElementById('configPanel');

// DOM Elements - Live Reel Feed
const phoneScreen = document.getElementById('phoneScreen');
const reelCanvas = document.getElementById('reelCanvas');
const reelProgressBar = document.getElementById('reelProgressBar');
const reelIndexIndicator = document.getElementById('reelIndexIndicator');
const reelBadgePill = document.getElementById('reelBadgePill');
const creatorAvatar = document.getElementById('creatorAvatar');
const creatorName = document.getElementById('creatorName');
const audioTrackName = document.getElementById('audioTrackName');
const reelTitle = document.getElementById('reelTitle');
const reelDescription = document.getElementById('reelDescription');
const likeCountLabel = document.getElementById('likeCountLabel');
const replayCountLabel = document.getElementById('replayCountLabel');
const bookmarkCountLabel = document.getElementById('bookmarkCountLabel');
const btnLike = document.getElementById('btnLike');
const btnReplay = document.getElementById('btnReplay');
const btnBookmark = document.getElementById('btnBookmark');
const btnShare = document.getElementById('btnShare');
const btnPlayPause = document.getElementById('btnPlayPause');
const playPauseLabel = document.getElementById('playPauseLabel');
const playPauseIconWrap = document.getElementById('playPauseIconWrap');
const btnPrevReel = document.getElementById('btnPrevReel');
const btnNextReel = document.getElementById('btnNextReel');
const heartsContainer = document.getElementById('heartsContainer');
const completionOverlay = document.getElementById('completionOverlay');
const completionMessage = document.getElementById('completionMessage');
const autoAdvanceToggle = document.getElementById('autoAdvanceToggle');
const btnWatchReelVeo = document.getElementById('btnWatchReelVeo');
const reelVideoCanvas = document.getElementById('reelVideoCanvas');
const reelFeedCamHud = document.getElementById('reelFeedCamHud');
const reelFeedSubtitleText = document.getElementById('reelFeedSubtitleText');
const reelFeedKeyframesBar = document.getElementById('reelFeedKeyframesBar');
const rfKfChip0 = document.getElementById('rfKfChip0');
const rfKfChip1 = document.getElementById('rfKfChip1');
const rfKfChip2 = document.getElementById('rfKfChip2');
let feedReelAnimationFrameId = null;
let currentFeedKeyframeIndex = -1;

// Top-of-Site Floating Notification Banner
const topNotificationBanner = document.getElementById('topNotificationBanner');
const topNotifIcon = document.getElementById('topNotifIcon');
const topNotifBadge = document.getElementById('topNotifBadge');
const topNotifText = document.getElementById('topNotifText');
let topNotificationTimer = null;

function showTopNotification(message, icon = '🎉', badge = '100% COMPLETED', durationMs = 3500) {
  if (!topNotificationBanner) return;
  if (topNotifIcon) topNotifIcon.textContent = icon;
  if (topNotifBadge) topNotifBadge.textContent = badge;
  if (topNotifText) topNotifText.textContent = message;

  topNotificationBanner.classList.add('show');
  if (topNotificationTimer) clearTimeout(topNotificationTimer);
  topNotificationTimer = setTimeout(() => {
    topNotificationBanner.classList.remove('show');
  }, durationMs);
}

function showToast(msg, icon = '✨') {
  showTopNotification(msg, icon, 'ALERT', 3000);
}

// DOM Elements - Live AI HUD
const hudSignalBadge = document.getElementById('hudSignalBadge');
const hudWatchTime = document.getElementById('hudWatchTime');
const hudLoopCount = document.getElementById('hudLoopCount');
const hudEngagementRate = document.getElementById('hudEngagementRate');
const hudSignalActions = document.getElementById('hudSignalActions');
const hudTelemetryLog = document.getElementById('hudTelemetryLog');
const hudCategoryPill = document.getElementById('hudCategoryPill');
const hudInferredTopic = document.getElementById('hudInferredTopic');
const hudInferenceWhy = document.getElementById('hudInferenceWhy');
const hudConfidenceVal = document.getElementById('hudConfidenceVal');
const hudDifficultyVal = document.getElementById('hudDifficultyVal');
const hudBridgeTitle = document.getElementById('hudBridgeTitle');
const hudBridgeWhy = document.getElementById('hudBridgeWhy');
const btnInjectBridge = document.getElementById('btnInjectBridge');
const btnOpenChallenge = document.getElementById('btnOpenChallenge');
const btnOpenVeoBridge = document.getElementById('btnOpenVeoBridge');

// DOM Elements - Gemini Veo Studio & Theater
const veoCustomTopicInput = document.getElementById('veoCustomTopicInput');
const veoCategorySelect = document.getElementById('veoCategorySelect');
const btnGenerateVeoCustom = document.getElementById('btnGenerateVeoCustom');
const veoCanvasElem = document.getElementById('veoCanvas');
const veoSubtitlesBar = document.getElementById('veoSubtitlesBar');
const veoSubtitleText = document.getElementById('veoSubtitleText');
const veoCamHud = document.getElementById('veoCamHud');
const veoTimelineProgress = document.getElementById('veoTimelineProgress');
const kfChip0 = document.getElementById('kfChip0');
const kfChip1 = document.getElementById('kfChip1');
const kfChip2 = document.getElementById('kfChip2');
const btnVeoPlayPause = document.getElementById('btnVeoPlayPause');
const veoPlayIcon = document.getElementById('veoPlayIcon');
const veoPlayLabel = document.getElementById('veoPlayLabel');
const btnVeoReplay = document.getElementById('btnVeoReplay');
const btnVeoVoiceToggle = document.getElementById('btnVeoVoiceToggle');
const veoVoiceIcon = document.getElementById('veoVoiceIcon');
const veoVoiceLabel = document.getElementById('veoVoiceLabel');
const veoAudioSpectrum = document.getElementById('veoAudioSpectrum');
const veoActiveCategoryTag = document.getElementById('veoActiveCategoryTag');
const veoActiveConceptTitle = document.getElementById('veoActiveConceptTitle');
const veoActiveSummary = document.getElementById('veoActiveSummary');
const veoModelBadge = document.getElementById('veoModelBadge');
const btnCopyVeoPrompt = document.getElementById('btnCopyVeoPrompt');
const btnExportVeoStudio = document.getElementById('btnExportVeoStudio');
const veoSpecCamera = document.getElementById('veoSpecCamera');
const veoSpecLighting = document.getElementById('veoSpecLighting');
const veoSpecAspect = document.getElementById('veoSpecAspect');
const veoSpecColor = document.getElementById('veoSpecColor');
const veoPromptCodeText = document.getElementById('veoPromptCodeText');
const veoStoryboardList = document.getElementById('veoStoryboardList');
const btnRefreshVeoGallery = document.getElementById('btnRefreshVeoGallery');
const veoGalleryGrid = document.getElementById('veoGalleryGrid');

// DOM Elements - Gemini Veo Modal
const veoModal = document.getElementById('veoModal');
const veoModalCloseBtn = document.getElementById('veoModalCloseBtn');
const veoModalCanvas = document.getElementById('veoModalCanvas');
const veoModalCamHud = document.getElementById('veoModalCamHud');
const veoModalSubtitleText = document.getElementById('veoModalSubtitleText');
const veoModalTimelineProgress = document.getElementById('veoModalTimelineProgress');
const btnVeoModalPlayPause = document.getElementById('btnVeoModalPlayPause');
const btnVeoModalReplay = document.getElementById('btnVeoModalReplay');
const btnVeoModalVoiceToggle = document.getElementById('btnVeoModalVoiceToggle');
const veoModalCategoryTag = document.getElementById('veoModalCategoryTag');
const veoModalTitle = document.getElementById('veoModalTitle');
const veoModalSummary = document.getElementById('veoModalSummary');
const veoModalStoryboardList = document.getElementById('veoModalStoryboardList');
const veoModalPromptText = document.getElementById('veoModalPromptText');
const btnVeoModalCopyPrompt = document.getElementById('btnVeoModalCopyPrompt');
const btnVeoModalGoToStudio = document.getElementById('btnVeoModalGoToStudio');

// DOM Elements - Add N Reels Modal
const btnOpenAddReelsModal = document.getElementById('btnOpenAddReelsModal');
const btnOpenAddReelsModalTop = document.getElementById('btnOpenAddReelsModalTop');
const addReelsModal = document.getElementById('addReelsModal');
const addReelsModalCloseBtn = document.getElementById('addReelsModalCloseBtn');
const addReelsCancelBtn = document.getElementById('addReelsCancelBtn');
const btnGenerateReelsSubmit = document.getElementById('btnGenerateReelsSubmit');
const generateSubmitLabel = document.getElementById('generateSubmitLabel');
const interestChips = document.querySelectorAll('.interest-chip');
const customInterestKeywords = document.getElementById('customInterestKeywords');
const countButtons = document.querySelectorAll('.count-btn');
const customCountInput = document.getElementById('customCountInput');

// DOM Elements - Watched History Modal
const btnOpenHistoryModal = document.getElementById('btnOpenHistoryModal');
const historyModal = document.getElementById('historyModal');
const historyModalCloseBtn = document.getElementById('historyModalCloseBtn');
const historyDoneBtn = document.getElementById('historyDoneBtn');
const btnClearHistoryBtn = document.getElementById('btnClearHistoryBtn');
const historyUniqueCount = document.getElementById('historyUniqueCount');
const historyTopCategory = document.getElementById('historyTopCategory');
const historyListContainer = document.getElementById('historyListContainer');

// DOM Elements - Studio & Workbench
const tabPresetsBtn = document.getElementById('tabPresetsBtn');
const tabCustomBtn = document.getElementById('tabCustomBtn');
const presetsTab = document.getElementById('presetsTab');
const customTab = document.getElementById('customTab');
const presetListContainer = document.getElementById('presetListContainer');
const categoryPillsContainer = document.getElementById('categoryPillsContainer');
const btnAnalyzeAllPresets = document.getElementById('btnAnalyzeAllPresets');
const customReelForm = document.getElementById('customReelForm');
const recommendationsStream = document.getElementById('recommendationsStream');
const resultsCountText = document.getElementById('resultsCountText');
const btnCopyJson = document.getElementById('btnCopyJson');
const btnCopySchema = document.getElementById('btnCopySchema');
const btnDownloadMd = document.getElementById('btnDownloadMd');

// DOM Elements - Trend Radar
const trendTableBody = document.getElementById('trendTableBody');
const btnRefreshTrends = document.getElementById('btnRefreshTrends');

// DOM Elements - Modal & Config
const deepDiveModal = document.getElementById('deepDiveModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalDoneBtn = document.getElementById('modalDoneBtn');
const modalCopyChallengeBtn = document.getElementById('modalCopyChallengeBtn');
const modalConceptTitle = document.getElementById('modalConceptTitle');
const modalTargetRec = document.getElementById('modalTargetRec');
const modalCategoryTag = document.getElementById('modalCategoryTag');
const modalDifficultyTag = document.getElementById('modalDifficultyTag');
const modalPrereqList = document.getElementById('modalPrereqList');
const modalChallengeText = document.getElementById('modalChallengeText');
const modalIndustryText = document.getElementById('modalIndustryText');
const sandboxCanvas = document.getElementById('sandboxCanvas');

const providerSelect = document.getElementById('providerSelect');
const apiKeyInput = document.getElementById('apiKeyInput');
const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
const modelInput = document.getElementById('modelInput');

// DOM Elements - Instagram Account Sync Hub
const btnInstagramHeader = document.getElementById('btnInstagramHeader');
const igHeaderStatusText = document.getElementById('igHeaderStatusText');
const igHeaderLikedBadge = document.getElementById('igHeaderLikedBadge');
const instagramModal = document.getElementById('instagramModal');
const instagramModalCloseBtn = document.getElementById('instagramModalCloseBtn');
const btnDoneIgModal = document.getElementById('btnDoneIgModal');
const igAccountBanner = document.getElementById('igAccountBanner');
const igUserAvatar = document.getElementById('igUserAvatar');
const igUserHandle = document.getElementById('igUserHandle');
const igUserBio = document.getElementById('igUserBio');
const btnDisconnectIg = document.getElementById('btnDisconnectIg');
const igConnectForm = document.getElementById('igConnectForm');
const igUsernameInput = document.getElementById('igUsernameInput');
const btnSubmitIgConnect = document.getElementById('btnSubmitIgConnect');
const igTotalLikedCount = document.getElementById('igTotalLikedCount');
const igLikedList = document.getElementById('igLikedList');
const btnExportIgDossier = document.getElementById('btnExportIgDossier');

let instagramProfile = null;

// DOM Elements - Instagram Reels Showcase & Theater
const navTabInsta = document.getElementById('navTabInsta');
const viewInsta = document.getElementById('viewInsta');
const igHeroStatusBadge = document.getElementById('igHeroStatusBadge');
const instaFilterBar = document.getElementById('instaFilterBar');
const instaLikedCountFilter = document.getElementById('instaLikedCountFilter');
const instaPlayerAvatar = document.getElementById('instaPlayerAvatar');
const instaPlayerCreator = document.getElementById('instaPlayerCreator');
const instaPlayerAudio = document.getElementById('instaPlayerAudio');
const btnIgFollow = document.getElementById('btnIgFollow');
const instaReelCanvas = document.getElementById('instaReelCanvas');
const instaHeartOverlay = document.getElementById('instaHeartOverlay');
const btnInstaLike = document.getElementById('btnInstaLike');
const instaLikeIcon = document.getElementById('instaLikeIcon');
const instaLikeCount = document.getElementById('instaLikeCount');
const btnInstaComment = document.getElementById('btnInstaComment');
const btnInstaShare = document.getElementById('btnInstaShare');
const btnInstaBookmark = document.getElementById('btnInstaBookmark');
const instaSaveIcon = document.getElementById('instaSaveIcon');
const instaPlayerTitle = document.getElementById('instaPlayerTitle');
const instaPlayerDesc = document.getElementById('instaPlayerDesc');
const instaAiBridgePill = document.getElementById('instaAiBridgePill');
const btnLaunchInstaAiBridge = document.getElementById('btnLaunchInstaAiBridge');
const btnInstaNextReel = document.getElementById('btnInstaNextReel');
const instaGalleryTotal = document.getElementById('instaGalleryTotal');
const instaReelsGrid = document.getElementById('instaReelsGrid');

let activeInstaReelIndex = 0;
let currentInstaFilter = 'all';
let instaCanvasAnimId = null;

// =======================================================
// PROCEDURAL WEB AUDIO SYNTHESIZER
// =======================================================
function initAudio() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
}

function playSound(type = 'click') {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx?.resume();
    }
    const now = audioCtx.currentTime;

    if (type === 'like') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'swipe') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'inject') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.25, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.26);
      });
    } else {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    // Audio non-blocking fallback
  }
}

// Toast Notification
function showToast(message, icon = '✨') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// =======================================================
// INITIALIZATION
// =======================================================
async function init() {
  setupNavigation();
  setupEventListeners();
  setupAddReelsModalListeners();
  setupHistoryModalListeners();
  setupVeoListeners();
  setupInstagramListeners();
  await fetchCategories();
  await fetchTrends();
  await fetchPresets();
  await fetchReelsLibrary();
  await fetchVeoGallery();
  await fetchInstagramProfile();
  initInstaReelsShowcase();
}

function setupNavigation() {
  navTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      navTabs.forEach(t => t.classList.remove('active'));
      appViews.forEach(v => v.classList.add('hidden'));

      btn.classList.add('active');
      const targetViewId = btn.getAttribute('data-view');
      const targetElem = document.getElementById(targetViewId);
      if (targetElem) targetElem.classList.remove('hidden');

      if (targetViewId === 'viewInsta') {
        loadActiveInstaReel(activeInstaReelIndex);
      } else {
        stopInstaCanvasSimulation();
      }
    });
  });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    soundLabel.textContent = soundEnabled ? 'Sound ON' : 'Sound OFF';
    showToast(`Sound ${soundEnabled ? 'Enabled' : 'Muted'}`, soundEnabled ? '🔊' : '🔇');
  });

  // Config Drawer
  configToggleBtn.addEventListener('click', () => {
    configPanel.classList.toggle('collapsed');
  });

  toggleKeyVisibility.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });
}

function setupEventListeners() {
  // Feed Controls
  btnLike.addEventListener('click', handleLikeReel);
  btnReplay.addEventListener('click', handleReplayReel);
  btnBookmark.addEventListener('click', handleBookmarkReel);
  btnShare.addEventListener('click', handleShareReel);
  btnPlayPause.addEventListener('click', togglePlayPause);
  btnPrevReel.addEventListener('click', prevReel);
  btnNextReel.addEventListener('click', nextReel);

  // Keyboard navigation for reels
  window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextReel();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      prevReel();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePlayPauseWithIndicator();
    } else if (e.key === 'l' || e.key === 'L') {
      handleLikeReel();
    }
  });

  // Single-Click to Stop/Resume (Pause/Play) and Double-Click to Like directly on Reel Screen
  const phoneScreen = document.getElementById('phoneScreen');
  let screenClickTimer = null;
  let screenClickCount = 0;

  if (phoneScreen) {
    phoneScreen.addEventListener('click', (e) => {
      // Ignore clicks on explicit action buttons or chips inside the screen
      if (e.target.closest('button') || e.target.closest('.action-btn') || e.target.closest('.rf-kf-chip')) {
        return;
      }

      screenClickCount++;
      if (screenClickCount === 1) {
        screenClickTimer = setTimeout(() => {
          screenClickCount = 0;
          // Single Click: Stop / Resume Reel Playback
          togglePlayPauseWithIndicator();
        }, 250);
      } else if (screenClickCount === 2) {
        clearTimeout(screenClickTimer);
        screenClickCount = 0;
        // Double Click: Trigger Big Heart Burst + Instant Like
        handleDoubleTapFeedLike();
      }
    });

    // Natural Scroll & Swipe to Change Reels (Mouse Wheel & Touchpad)
    let lastWheelTime = 0;
    phoneScreen.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime < 380) return;
      if (Math.abs(e.deltaY) < 18) return;

      lastWheelTime = now;
      if (e.deltaY > 0) {
        nextReel();
      } else {
        prevReel();
      }
    }, { passive: false });

    // Touch Swipe Up / Down (Mobile & Touch Devices)
    let touchStartY = 0;
    phoneScreen.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    phoneScreen.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartY - touchEndY;
      if (Math.abs(diffY) > 40) {
        if (diffY > 0) {
          nextReel();
        } else {
          prevReel();
        }
      }
    }, { passive: true });
  }

  // Inject Bridge Button
  btnInjectBridge.addEventListener('click', injectCurrentBridgeIntoFeed);
  btnOpenChallenge.addEventListener('click', () => {
    if (activeDeepDiveData) {
      openDeepDiveModal(activeDeepDiveData.evaluation, activeDeepDiveData.deep_dive);
    }
  });

  // Studio Tab Switching
  tabPresetsBtn.addEventListener('click', () => {
    tabPresetsBtn.classList.add('active');
    tabCustomBtn.classList.remove('active');
    presetsTab.classList.remove('hidden');
    customTab.classList.add('hidden');
  });

  tabCustomBtn.addEventListener('click', () => {
    tabCustomBtn.classList.add('active');
    tabPresetsBtn.classList.remove('active');
    customTab.classList.remove('hidden');
    presetsTab.classList.add('hidden');
  });

  // Studio Actions
  btnAnalyzeAllPresets.addEventListener('click', () => {
    evaluateReels(presetsData);
  });

  customReelForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const customReel = {
      reel_id: document.getElementById('customId').value,
      title: document.getElementById('customTitle').value,
      tone: document.getElementById('customTone').value,
      engagement: document.getElementById('customEngagement').value
    };
    evaluateReels([customReel]);
  });

  // Export Actions
  btnCopyJson.addEventListener('click', () => {
    if (!currentRecommendations.length) return showToast('No recommendations to copy', '⚠️');
    navigator.clipboard.writeText(JSON.stringify(currentRecommendations, null, 2));
    showToast('Copied JSON to clipboard!', '📋');
  });

  btnCopySchema.addEventListener('click', () => {
    if (!currentRecommendations.length) return showToast('No recommendations to copy', '⚠️');
    const schemaText = currentRecommendations.map(formatSchemaText).join('\n\n--------------------------------------------------\n\n');
    navigator.clipboard.writeText(schemaText);
    showToast('Copied strict text schema!', '📋');
  });

  btnDownloadMd.addEventListener('click', () => {
    if (!currentRecommendations.length) return showToast('No recommendations to export', '⚠️');
    downloadMarkdownReport();
  });

  btnRefreshTrends.addEventListener('click', () => {
    fetchTrends();
    showToast('Refreshed live viral trends!', '🔄');
  });

  // Modal Handlers
  modalCloseBtn.addEventListener('click', () => deepDiveModal.classList.add('hidden'));
  modalDoneBtn.addEventListener('click', () => deepDiveModal.classList.add('hidden'));
  modalCopyChallengeBtn.addEventListener('click', () => {
    if (modalChallengeText.textContent) {
      navigator.clipboard.writeText(modalChallengeText.textContent);
      showToast('Copied 15-min challenge to clipboard!', '📋');
    }
  });

  deepDiveModal.addEventListener('click', (e) => {
    if (e.target === deepDiveModal) deepDiveModal.classList.add('hidden');
  });
}

// =======================================================
// ADD N REELS BY INTEREST MODAL
// =======================================================
function setupAddReelsModalListeners() {
  const openModal = () => {
    playSound('click');
    addReelsModal.classList.remove('hidden');
  };

  btnOpenAddReelsModal?.addEventListener('click', openModal);
  btnOpenAddReelsModalTop?.addEventListener('click', openModal);

  addReelsModalCloseBtn?.addEventListener('click', () => addReelsModal.classList.add('hidden'));
  addReelsCancelBtn?.addEventListener('click', () => addReelsModal.classList.add('hidden'));

  addReelsModal?.addEventListener('click', (e) => {
    if (e.target === addReelsModal) addReelsModal.classList.add('hidden');
  });

  // Interest Chips toggle
  interestChips.forEach(chip => {
    chip.addEventListener('click', () => {
      playSound('click');
      chip.classList.toggle('active');
    });
  });

  // Count buttons selector
  countButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      countButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const count = parseInt(btn.getAttribute('data-count'), 10);
      customCountInput.value = count;
      updateGenerateSubmitLabel(count);
    });
  });

  customCountInput?.addEventListener('input', () => {
    const val = Math.max(1, Math.min(30, parseInt(customCountInput.value || '1', 10)));
    countButtons.forEach(b => {
      b.classList.toggle('active', parseInt(b.getAttribute('data-count'), 10) === val);
    });
    updateGenerateSubmitLabel(val);
  });

  btnGenerateReelsSubmit?.addEventListener('click', handleGenerateReelsByInterest);
}

function updateGenerateSubmitLabel(count) {
  if (generateSubmitLabel) {
    generateSubmitLabel.textContent = `Generate & Add ${count} Reel${count > 1 ? 's' : ''} to Feed`;
  }
}

async function handleGenerateReelsByInterest() {
  const selectedInterests = [];
  document.querySelectorAll('.interest-chip.active').forEach(chip => {
    selectedInterests.push(chip.getAttribute('data-interest'));
  });

  const customKeywords = customInterestKeywords?.value.trim();
  if (customKeywords) {
    selectedInterests.push(customKeywords);
  }

  if (selectedInterests.length === 0) {
    selectedInterests.push('AI', 'HLD', 'DSA');
  }

  const count = Math.max(1, Math.min(30, parseInt(customCountInput.value || '3', 10)));

  playSound('inject');
  btnGenerateReelsSubmit.disabled = true;
  generateSubmitLabel.textContent = `Synthesizing ${count} unique reels...`;

  try {
    const payload = {
      interests: selectedInterests,
      count: count,
      exclude_ids: Array.from(seenReelIds),
      exclude_titles: Array.from(seenReelTitles),
      provider: providerSelect.value,
      api_key: apiKeyInput.value.trim() || undefined,
      model: modelInput.value.trim() || undefined
    };

    const res = await fetch('/api/reels/generate-by-interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Generation failed');
    const data = await res.json();
    const newReels = data.reels || [];

    if (newReels.length === 0) {
      showToast('No new reels generated. Try selecting other topics!', '⚠️');
      return;
    }

    // Insert new reels immediately after active reel in the library
    reelsLibrary.splice(activeReelIndex + 1, 0, ...newReels);

    addReelsModal.classList.add('hidden');
    showToast(`🎉 Added ${newReels.length} new interest-driven reel(s) to feed!`, '⚡');

    // Smoothly advance to the first newly added reel
    setTimeout(() => {
      loadActiveReel(activeReelIndex + 1);
    }, 400);

  } catch (err) {
    console.error('Failed to generate reels by interest:', err);
    showToast(`Error: ${err.message}`, '❌');
  } finally {
    btnGenerateReelsSubmit.disabled = false;
    updateGenerateSubmitLabel(count);
  }
}

// =======================================================
// WATCHED HISTORY & DEDUPLICATION TRACKER MODAL
// =======================================================
function setupHistoryModalListeners() {
  btnOpenHistoryModal?.addEventListener('click', () => {
    playSound('click');
    renderHistoryModal();
    historyModal.classList.remove('hidden');
  });

  historyModalCloseBtn?.addEventListener('click', () => historyModal.classList.add('hidden'));
  historyDoneBtn?.addEventListener('click', () => historyModal.classList.add('hidden'));

  historyModal?.addEventListener('click', (e) => {
    if (e.target === historyModal) historyModal.classList.add('hidden');
  });

  btnClearHistoryBtn?.addEventListener('click', () => {
    playSound('click');
    seenReelIds.clear();
    seenReelTitles.clear();
    watchedHistory = [];
    likedCategories = [];
    inferredInterests = [];
    updateSeenTrackerUI();
    renderHistoryModal();
    showToast('Watched history cleared! Fresh discovery reset.', '🧹');
  });
}

function updateSeenTrackerUI() {
  const count = seenReelIds.size;
  if (seenTrackerLabel) {
    seenTrackerLabel.textContent = `Watched: ${count} unique • 0 repeats`;
  }
}

function recordWatchedReel(reel, completed = false) {
  if (!reel || !reel.id) return;
  seenReelIds.add(reel.id);
  if (reel.title) {
    seenReelTitles.add(reel.title.toLowerCase().strip ? reel.title.toLowerCase().strip() : reel.title.toLowerCase());
  }

  const category = reel.category || (reel.recommendation_metadata ? reel.recommendation_metadata.category : 'Tech');
  if (completed && category && !likedCategories.includes(category)) {
    likedCategories.push(category);
  }

  const existingIdx = watchedHistory.findIndex(h => h.id === reel.id);
  if (existingIdx >= 0) {
    watchedHistory[existingIdx].completed = completed || watchedHistory[existingIdx].completed;
  } else {
    watchedHistory.unshift({
      id: reel.id,
      title: reel.title,
      category: category,
      tag: reel.tag || 'Tech',
      watchedAt: new Date().toLocaleTimeString(),
      completed: completed
    });
  }

  updateSeenTrackerUI();
}

function renderHistoryModal() {
  historyUniqueCount.textContent = seenReelIds.size;
  const catCounts = {};
  watchedHistory.forEach(h => {
    catCounts[h.category] = (catCounts[h.category] || 0) + 1;
  });
  let topCat = 'General CS';
  let maxC = 0;
  Object.entries(catCounts).forEach(([cat, c]) => {
    if (c > maxC) {
      maxC = c;
      topCat = cat;
    }
  });
  historyTopCategory.textContent = topCat;

  historyListContainer.innerHTML = '';
  if (watchedHistory.length === 0) {
    historyListContainer.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 20px;">
        No watched reels recorded yet. Start watching to build your zero-repeat history!
      </div>
    `;
    return;
  }

  watchedHistory.forEach(item => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `
      <div class="history-item-top">
        <span class="history-item-title">${escapeHtml(item.title)}</span>
        <span class="history-cat-badge">${escapeHtml(item.category)}</span>
      </div>
      <div class="history-item-meta">
        <span>⏰ ${item.watchedAt}</span>
        <span>${item.completed ? '✅ Watched 100%' : '👁️ Viewed'}</span>
        <span style="color: #10b981;">🛡️ Deduplicated</span>
      </div>
    `;
    historyListContainer.appendChild(el);
  });
}

// =======================================================
// DATA FETCHING (API ENDPOINTS)
// =======================================================
async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    categoriesData = data.categories || {};
    renderCategoryPills();
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }
}

async function fetchPresets() {
  try {
    const res = await fetch('/api/presets');
    const data = await res.json();
    presetsData = data.presets || [];
    renderPresetsList();
  } catch (err) {
    console.error('Failed to fetch presets:', err);
  }
}

async function fetchTrends() {
  try {
    const res = await fetch('/api/trends');
    const data = await res.json();
    trendsData = data.trends || [];
    renderTrendsTable();
  } catch (err) {
    console.error('Failed to fetch trends:', err);
  }
}

async function fetchReelsLibrary() {
  try {
    const res = await fetch('/api/reels/library');
    const data = await res.json();
    reelsLibrary = data.reels || [];
    if (reelsLibrary.length > 0) {
      loadActiveReel(0);
    }
  } catch (err) {
    console.error('Failed to fetch reels library:', err);
  }
}

// =======================================================
// REEL FEED SIMULATOR & REAL-TIME TELEMETRY
// =======================================================
function loadActiveReel(index) {
  if (index < 0 || index >= reelsLibrary.length) return;
  activeReelIndex = index;
  const reel = reelsLibrary[index];

  // Mark as seen in deduplication history
  recordWatchedReel(reel, false);

  // Reset telemetry for current reel
  reelPlaybackMs = 0;
  isAutoAdvancing = false;
  completionOverlay.classList.add('hidden');

  currentReelTelemetry = {
    watch_time_ms: 0,
    replay_count: 0,
    liked: false,
    saved: false,
    shared: false
  };

  btnLike.classList.remove('active');
  btnBookmark.classList.remove('active');
  replayCountLabel.textContent = 'Replay (0)';

  // Update Top Bar & Header
  reelIndexIndicator.textContent = `Reel ${index + 1} / ${reelsLibrary.length}`;
  reelBadgePill.textContent = reel.tag || '🔥 Viral Tech Reel';
  creatorAvatar.textContent = reel.avatar || '☕';
  creatorName.textContent = reel.creator || '@tech_insider';
  audioTrackName.textContent = reel.audio || 'Original Audio - Viral Sound';
  reelTitle.textContent = reel.title;
  reelDescription.textContent = reel.description;
  likeCountLabel.textContent = formatCompactNumber(reel.likes || 12400);

  // Render Visual Media Theme
  renderReelVisual(reel);

  // Restart Telemetry Timer
  startPlaybackTimer();

  // Trigger Real-Time AI Prediction for this Reel
  triggerTelemetryPrediction();
}

function renderReelVisual(reel) {
  // Extract or synthesize Veo metadata for this reel
  const cat = reel.category || 'AI';
  const veo = reel.veo_video_metadata || {
    concept_title: reel.title,
    category: cat,
    summary: reel.description,
    keyframes: [
      { timestamp_sec: 0.0, title: "Hook", camera_hud: "CAM_01 [WIDE DOLLY IN 24MM] • 4K 60FPS", subtitles: reel.title, voiceover_line: reel.description },
      { timestamp_sec: 4.5, title: "Architecture", camera_hud: "CAM_02 [MACRO TRACKING 50MM] • 4K 60FPS", subtitles: `Deep systems inspection for ${cat} foundations.`, voiceover_line: `Inspecting core computer science architecture behind ${reel.title}.` },
      { timestamp_sec: 9.5, title: "Production Scale", camera_hud: "CAM_03 [ORBITAL 3D CRANE 85MM] • 4K 60FPS", subtitles: "Zero-hype verified production engineering benchmark.", voiceover_line: "Scalable zero-hype production architecture verified." }
    ]
  };

  currentFeedKeyframeIndex = -1;
  updateFeedKeyframeUI(0.0, veo);

  // Bind keyframe chips
  [rfKfChip0, rfKfChip1, rfKfChip2].forEach((chip, i) => {
    if (chip) {
      const kf = veo.keyframes && veo.keyframes[i] ? veo.keyframes[i] : null;
      if (kf) {
        const strong = chip.querySelector('strong');
        if (strong) strong.textContent = kf.title;
        chip.setAttribute('data-sec', kf.timestamp_sec);
      }
      chip.onclick = () => {
        playSound('click');
        const sec = parseFloat(chip.getAttribute('data-sec')) || (i * 4.5);
        reelPlaybackMs = sec * 1000;
        currentFeedKeyframeIndex = -1;
        updateFeedKeyframeUI(sec, veo);
      };
    }
  });

  // Start 60 FPS animation loop on reelVideoCanvas
  startFeedReelRenderLoop(veo);
}

function startFeedReelRenderLoop(veoData) {
  if (!reelVideoCanvas) return;
  const ctx = reelVideoCanvas.getContext('2d');

  function loop() {
    if (isPlaying) {
      const sec = (reelPlaybackMs / 1000);
      renderVeoSimulation(ctx, reelVideoCanvas, sec, veoData);
      updateFeedKeyframeUI(sec, veoData);
    }
    feedReelAnimationFrameId = requestAnimationFrame(loop);
  }

  if (feedReelAnimationFrameId) cancelAnimationFrame(feedReelAnimationFrameId);
  feedReelAnimationFrameId = requestAnimationFrame(loop);
}

function updateFeedKeyframeUI(sec, veoData) {
  if (!veoData || !veoData.keyframes) return;
  let activeKf = veoData.keyframes[0];
  let activeIdx = 0;
  for (let i = 0; i < veoData.keyframes.length; i++) {
    if (sec >= veoData.keyframes[i].timestamp_sec) {
      activeKf = veoData.keyframes[i];
      activeIdx = i;
    }
  }

  if (reelFeedCamHud) {
    reelFeedCamHud.innerHTML = `<span class="pulse-dot"></span> <span>${escapeHtml(activeKf.camera_hud || 'CAM_01 [WIDE DOLLY 24MM] • 4K 60FPS • VEO 2 CORE')}</span>`;
  }
  if (reelFeedSubtitleText) {
    reelFeedSubtitleText.textContent = activeKf.subtitles || activeKf.voiceover_line || activeKf.title;
  }

  [rfKfChip0, rfKfChip1, rfKfChip2].forEach((chip, i) => {
    if (chip) chip.classList.toggle('active', i === activeIdx);
  });

  if (activeIdx !== currentFeedKeyframeIndex) {
    currentFeedKeyframeIndex = activeIdx;
    if (soundEnabled && activeKf.voiceover_line && isPlaying) {
      speakVeoNarration(activeKf.voiceover_line);
    }
  }
}

function startPlaybackTimer() {
  if (playbackTimerInterval) clearInterval(playbackTimerInterval);
  playbackTimerInterval = setInterval(() => {
    if (!isPlaying) return;

    reelPlaybackMs += 100;
    currentReelTelemetry.watch_time_ms = reelPlaybackMs;

    const percent = Math.min(100, (reelPlaybackMs / REEL_DURATION_MS) * 100);
    reelProgressBar.style.width = `${percent}%`;

    // Loop completed (100% watch)
    if (reelPlaybackMs >= REEL_DURATION_MS) {
      currentReelTelemetry.replay_count++;
      replayCountLabel.textContent = `Replay (${currentReelTelemetry.replay_count})`;
      updateTelemetryDisplay();
      logTelemetryEvent(`Reel watched 100% completely! Intent affinity confirmed.`);
      
      const activeReel = reelsLibrary[activeReelIndex];
      recordWatchedReel(activeReel, true);

      // If Auto-Advance is enabled, automatically suggest a fresh non-repeating reel!
      if (autoAdvanceToggle && autoAdvanceToggle.checked && !isAutoAdvancing) {
        handleAutoAdvanceOnComplete();
      } else {
        reelPlaybackMs = 0;
        showTopNotification(`Completed: "${activeReel?.title || 'Reel'}"`, '✅', '100% COMPLETED', 3000);
        triggerTelemetryPrediction();
      }
    } else if (reelPlaybackMs % 1000 === 0) {
      updateTelemetryDisplay();
    }
  }, 100);
}

// Auto-advance & Smart Stream Handler on Complete Watch
async function handleAutoAdvanceOnComplete() {
  isAutoAdvancing = true;
  const currentReel = reelsLibrary[activeReelIndex];

  // Show top-of-site floating notification (No intrusive popup)
  showTopNotification(`Reel Completed! Synthesizing next fresh concept...`, '🎉', '100% COMPLETED', 2200);
  playSound('inject');

  try {
    const payload = {
      watched_reel_ids: Array.from(seenReelIds),
      watched_titles: Array.from(seenReelTitles),
      liked_categories: likedCategories,
      inferred_interests: inferredInterests,
      completed_last_reel: true,
      current_reel_id: currentReel?.id || '',
      current_reel_title: currentReel?.title || '',
      provider: providerSelect.value,
      api_key: apiKeyInput.value.trim() || undefined,
      model: modelInput.value.trim() || undefined
    };

    const res = await fetch('/api/reels/stream-next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Stream suggestion failed');
    const data = await res.json();
    const nextReelObj = data.next_reel;

    if (nextReelObj && nextReelObj.id) {
      // Append right after current position
      reelsLibrary.splice(activeReelIndex + 1, 0, nextReelObj);
      showTopNotification(`Up Next: "${nextReelObj.title}"`, '✨', 'NEXT TOPIC', 3500);
    }

    setTimeout(() => {
      loadActiveReel(activeReelIndex + 1);
      isAutoAdvancing = false;
    }, 450);

  } catch (err) {
    console.error('Error during auto-advance suggestion:', err);
    isAutoAdvancing = false;
    // Fallback: regular next reel
    nextReel();
  }
}

function updateTelemetryDisplay() {
  const sec = (reelPlaybackMs / 1000).toFixed(1);
  hudWatchTime.textContent = `${sec}s`;
  hudLoopCount.textContent = currentReelTelemetry.replay_count;

  // Calculate Intent Intensity Score
  let score = 15 + Math.min(50, Math.floor(reelPlaybackMs / 200));
  if (currentReelTelemetry.liked) score += 20;
  if (currentReelTelemetry.saved) score += 30;
  if (currentReelTelemetry.replay_count > 0) score += currentReelTelemetry.replay_count * 15;
  score = Math.min(99, score);

  hudEngagementRate.textContent = `${score}%`;

  const actions = [];
  if (currentReelTelemetry.liked) actions.push('Liked');
  if (currentReelTelemetry.saved) actions.push('Saved');
  if (currentReelTelemetry.shared) actions.push('Shared');
  hudSignalActions.textContent = actions.join(', ') || 'Watching';

  if (score > 65) {
    hudSignalBadge.textContent = 'Signal: High ⚡';
    hudSignalBadge.className = 'signal-badge high';
  } else if (score > 40) {
    hudSignalBadge.textContent = 'Signal: Medium 🎯';
    hudSignalBadge.className = 'signal-badge';
  } else {
    hudSignalBadge.textContent = 'Signal: Low 🔍';
    hudSignalBadge.className = 'signal-badge';
  }
}

function logTelemetryEvent(msg) {
  const line = document.createElement('div');
  line.className = 'log-line';
  const time = new Date().toLocaleTimeString().split(' ')[0];
  line.innerHTML = `<span>[${time}]</span> ${msg}`;
  hudTelemetryLog.prepend(line);
}

function triggerReelSlideAnimation(dir = 'up', elem = null) {
  const target = elem || document.getElementById('phoneScreen');
  if (!target) return;
  target.classList.remove('reel-transition-up', 'reel-transition-down');
  void target.offsetWidth;
  target.classList.add(dir === 'up' ? 'reel-transition-up' : 'reel-transition-down');
}

// Next / Previous Reel Navigation
function nextReel() {
  playSound('swipe');
  triggerReelSlideAnimation('up');
  if (activeReelIndex < reelsLibrary.length - 1) {
    loadActiveReel(activeReelIndex + 1);
  } else {
    loadActiveReel(0); // loop back
  }
}

function prevReel() {
  playSound('swipe');
  triggerReelSlideAnimation('down');
  if (activeReelIndex > 0) {
    loadActiveReel(activeReelIndex - 1);
  } else {
    loadActiveReel(reelsLibrary.length - 1);
  }
}

function togglePlayPause() {
  playSound('click');
  isPlaying = !isPlaying;
  if (isPlaying) {
    playPauseIconWrap.innerHTML = '<span>⏸️</span>';
    playPauseLabel.textContent = 'Pause';
  } else {
    playPauseIconWrap.innerHTML = '<span>▶️</span>';
    playPauseLabel.textContent = 'Play';
  }
}

function togglePlayPauseWithIndicator() {
  togglePlayPause();
  const reelCenterPlayIndicator = document.getElementById('reelCenterPlayIndicator');
  const rcCircleIcon = document.getElementById('rcCircleIcon');
  if (reelCenterPlayIndicator && rcCircleIcon) {
    rcCircleIcon.textContent = isPlaying ? '▶️' : '⏸️';
    reelCenterPlayIndicator.classList.add('show');
    setTimeout(() => {
      reelCenterPlayIndicator.classList.remove('show');
    }, 450);
  }
}

function handleDoubleTapFeedLike() {
  if (!currentReelTelemetry.liked) {
    handleLikeReel();
  } else {
    playSound('like');
  }
  spawnDoubleTapBigHeart();
}

function spawnDoubleTapBigHeart() {
  const doubleTapHeartBurst = document.getElementById('doubleTapHeartBurst');
  if (!doubleTapHeartBurst) return;
  const heart = document.createElement('div');
  heart.className = 'double-tap-heart-item';
  heart.textContent = '❤️';
  doubleTapHeartBurst.appendChild(heart);
  setTimeout(() => heart.remove(), 850);
}

function handleLikeReel() {
  playSound('like');
  currentReelTelemetry.liked = !currentReelTelemetry.liked;
  btnLike.classList.toggle('active', currentReelTelemetry.liked);

  const reel = reelsLibrary[activeReelIndex];
  const count = (reel.likes || 12000) + (currentReelTelemetry.liked ? 1 : 0);
  likeCountLabel.textContent = formatCompactNumber(count);

  if (currentReelTelemetry.liked) {
    const cat = reel.category || 'Tech';
    if (!likedCategories.includes(cat)) likedCategories.push(cat);
    // Sync Like Event with connected Instagram account
    syncInstagramLikeEvent(reel);
  }

  spawnFloatingHeart();
  logTelemetryEvent(currentReelTelemetry.liked ? '❤️ Liked reel: Positive emotional affinity logged.' : 'Heart un-toggled.');
  triggerTelemetryPrediction();
}

function handleReplayReel() {
  playSound('click');
  currentReelTelemetry.replay_count++;
  replayCountLabel.textContent = `Replay (${currentReelTelemetry.replay_count})`;
  reelPlaybackMs = 0;
  logTelemetryEvent(`User explicitly triggered instant replay loop (#${currentReelTelemetry.replay_count}).`);
  triggerTelemetryPrediction();
}

function handleBookmarkReel() {
  playSound('click');
  currentReelTelemetry.saved = !currentReelTelemetry.saved;
  btnBookmark.classList.toggle('active', currentReelTelemetry.saved);
  bookmarkCountLabel.textContent = currentReelTelemetry.saved ? 'Saved' : 'Save';
  logTelemetryEvent(currentReelTelemetry.saved ? '🔖 Reel saved to bookmarks: Maximum intent signal recorded!' : 'Bookmark removed.');
  triggerTelemetryPrediction();
}

function handleShareReel() {
  playSound('click');
  currentReelTelemetry.shared = true;
  navigator.clipboard.writeText(window.location.href);
  showToast('Link copied to clipboard! Shared with network.', '🔗');
  logTelemetryEvent('↗️ Reel link shared: High social affinity multiplier logged.');
  triggerTelemetryPrediction();
}

function spawnFloatingHeart() {
  const heart = document.createElement('div');
  heart.className = 'floating-heart';
  heart.textContent = ['❤️', '💖', '🔥', '✨'][Math.floor(Math.random() * 4)];
  heartsContainer.appendChild(heart);
  setTimeout(() => heart.remove(), 1200);
}

// =======================================================
// REAL-TIME AI PREDICTION INTERCEPTOR
// =======================================================
async function triggerTelemetryPrediction() {
  const reel = reelsLibrary[activeReelIndex];
  if (!reel) return;

  try {
    const payload = {
      current_reel_id: reel.id || `Reel_${activeReelIndex + 1}`,
      current_reel_title: reel.title,
      current_reel_tone: reel.tone || '',
      watch_time_ms: currentReelTelemetry.watch_time_ms,
      replay_count: currentReelTelemetry.replay_count,
      liked: currentReelTelemetry.liked,
      saved: currentReelTelemetry.saved,
      shared: currentReelTelemetry.shared,
      provider: providerSelect.value,
      api_key: apiKeyInput.value.trim() || undefined,
      model: modelInput.value.trim() || undefined
    };

    const res = await fetch('/api/feed/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Prediction request failed');
    const data = await res.json();
    activeDeepDiveData = data;

    // Update Live AI HUD Elements
    const rec = data.evaluation;
    hudCategoryPill.textContent = rec.category;
    hudInferredTopic.textContent = rec.interest_detected;
    hudInferenceWhy.textContent = rec.why;
    hudConfidenceVal.textContent = `${rec.confidence === 'High' ? '98%' : rec.confidence === 'Medium' ? '82%' : '65%'} (${rec.confidence})`;
    hudDifficultyVal.textContent = rec.difficulty;
    hudBridgeTitle.textContent = rec.recommended_tech_reel;
    hudBridgeWhy.textContent = rec.why_this_recommendation;

    // Record inferred interest
    if (rec.interest_detected && !inferredInterests.includes(rec.interest_detected)) {
      inferredInterests.push(rec.interest_detected);
    }

  } catch (err) {
    console.error('Real-time prediction error:', err);
  }
}

function injectCurrentBridgeIntoFeed() {
  if (!activeDeepDiveData || !activeDeepDiveData.next_reel) {
    return showToast('Bridge recommendation not ready yet', '⚠️');
  }

  playSound('inject');
  const injectedReel = activeDeepDiveData.next_reel;

  // Insert right after current active reel
  reelsLibrary.splice(activeReelIndex + 1, 0, injectedReel);
  showToast(`⚡ Injected: "${injectedReel.title}" into your feed!`, '🚀');

  // Immediately advance to the injected educational reel
  setTimeout(() => {
    nextReel();
  }, 400);
}

// =======================================================
// AI AGENT STUDIO & BATCH EVALUATION
// =======================================================
function renderCategoryPills() {
  categoryPillsContainer.innerHTML = '';
  Object.entries(categoriesData).forEach(([cat, meta]) => {
    const pill = document.createElement('span');
    pill.className = 'cat-pill';
    pill.innerHTML = `<span>${meta.icon}</span> <strong>${cat}</strong>`;
    pill.title = meta.desc;
    categoryPillsContainer.appendChild(pill);
  });
}

function renderPresetsList() {
  presetListContainer.innerHTML = '';
  presetsData.forEach((preset) => {
    const item = document.createElement('div');
    item.className = 'preset-item';
    item.innerHTML = `
      <div class="preset-top">
        <span class="preset-id">${preset.reel_id}</span>
        <span class="preset-tag">${preset.tag || 'Casual'}</span>
      </div>
      <div class="preset-title">${escapeHtml(preset.title)}</div>
      <div class="preset-meta">
        <span>👁️ ${preset.engagement}</span>
      </div>
    `;
    item.addEventListener('click', () => {
      playSound('click');
      document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      evaluateReels([preset]);
    });
    presetListContainer.appendChild(item);
  });
}

async function evaluateReels(reelsToEvaluate) {
  setLoadingState(true);
  try {
    const payload = {
      reels: reelsToEvaluate,
      provider: providerSelect.value,
      api_key: apiKeyInput.value.trim() || undefined,
      model: modelInput.value.trim() || undefined
    };

    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Inference failed');
    }

    const data = await res.json();
    currentRecommendations = data.recommendations || [];
    renderRecommendations(currentRecommendations);
    playSound('click');
    showToast(`Evaluated ${currentRecommendations.length} reel recommendation(s)!`, '🚀');
  } catch (err) {
    console.error('Inference error:', err);
    showToast(`Error: ${err.message}`, '❌');
    recommendationsStream.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h4>Inference Error</h4>
        <p>${err.message}</p>
      </div>
    `;
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(loading) {
  if (loading) {
    resultsCountText.innerHTML = `<span class="pulse-dot"></span> Extracting root CS disciplines &amp; applying zero-hype filter...`;
    recommendationsStream.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚙️</div>
        <h4>Synthesizing Educational Bridges...</h4>
        <p>Inferring systems depth without clickbait.</p>
      </div>
    `;
  }
}

function renderRecommendations(recommendations) {
  if (!recommendations || recommendations.length === 0) {
    recommendationsStream.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💡</div>
        <h4>No Recommendations Available</h4>
        <p>Try evaluating one of the presets or inputting a custom reel.</p>
      </div>
    `;
    resultsCountText.textContent = '0 recommendations generated';
    return;
  }

  resultsCountText.textContent = `Displaying ${recommendations.length} high-signal learning pathway(s)`;
  recommendationsStream.innerHTML = '';

  recommendations.forEach((rec, idx) => {
    const card = document.createElement('article');
    card.className = 'rec-card';

    const categoryMeta = categoriesData[rec.category] || { color: '#8b5cf6', icon: '⚡' };
    card.style.setProperty('--card-accent', categoryMeta.color);

    const confClass = `confidence-${rec.confidence.toLowerCase()}`;

    card.innerHTML = `
      <div class="rec-header">
        <span class="rec-current-reel">${escapeHtml(rec.current_reel)}</span>
        <div class="rec-badges">
          <span class="category-tag" style="color: ${categoryMeta.color}; border-color: ${categoryMeta.color}40; background: ${categoryMeta.color}15;">
            ${categoryMeta.icon} ${rec.category}
          </span>
          <span class="difficulty-tag">${rec.difficulty}</span>
          <span class="confidence-tag ${confClass}">${rec.confidence} Confidence</span>
        </div>
      </div>

      <!-- Inferred Root Technical Discipline -->
      <div class="rec-inference-box">
        <div class="inference-label">🧠 Inferred Root Technical Discipline</div>
        <div class="inference-value">${escapeHtml(rec.interest_detected)}</div>
        <div class="inference-why">${escapeHtml(rec.why)}</div>
      </div>

      <!-- Recommended Tech Reel / Scaffolding Bridge -->
      <div class="rec-target-box">
        <div class="target-label">🚀 Recommended Tech Concept Reel</div>
        <div class="target-title">${escapeHtml(rec.recommended_tech_reel)}</div>
        <div class="target-rationale">${escapeHtml(rec.why_this_recommendation)}</div>
      </div>

      <!-- Card Actions -->
      <div class="rec-card-actions">
        <button class="btn btn-accent btn-sm btn-veo-card" data-index="${idx}" title="Watch 4K AI Video Explanation generated by Gemini Veo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect width="14" height="14" x="1" y="5" rx="2" ry="2"/></svg>
          <span>✨ Watch Veo Reel</span>
        </button>

        <button class="btn btn-secondary btn-sm btn-deep-dive" data-index="${idx}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>15-Min Challenge</span>
        </button>

        <button class="btn btn-ghost btn-sm btn-copy-card" data-index="${idx}" title="Copy Schema Text">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          <span>Copy Schema</span>
        </button>
      </div>
    `;

    card.querySelector('.btn-veo-card').addEventListener('click', () => {
      generateVeoReelForTopic(rec.recommended_tech_reel, rec.category, rec, true);
    });

    card.querySelector('.btn-deep-dive').addEventListener('click', () => {
      openDeepDiveModal(rec);
    });

    card.querySelector('.btn-copy-card').addEventListener('click', () => {
      const text = formatSchemaText(rec);
      navigator.clipboard.writeText(text);
      showToast('Copied evaluation schema to clipboard!', '📋');
    });

    recommendationsStream.appendChild(card);
  });
}

// =======================================================
// VIRAL TREND RADAR TABLE
// =======================================================
function renderTrendsTable() {
  trendTableBody.innerHTML = '';
  trendsData.forEach((trend) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="trend-hashtag">${escapeHtml(trend.hashtag)}</div>
        <div class="trend-topic">${escapeHtml(trend.topic)}</div>
      </td>
      <td><span style="font-size: 0.8rem; color: #94a3b8;">${escapeHtml(trend.platform)}</span></td>
      <td><span class="velocity-badge">${escapeHtml(trend.growth)} (${escapeHtml(trend.velocity)})</span></td>
      <td><strong>${escapeHtml(trend.weekly_volume)}</strong></td>
      <td>
        <div style="font-weight: 700; color: #fff;">${escapeHtml(trend.category)}: ${escapeHtml(trend.predicted_cs_concept)}</div>
      </td>
      <td><span style="color: #34d399; font-weight: 700;">${escapeHtml(trend.conversion_rate)}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm btn-test-trend">
          ⚡ Test in Agent
        </button>
      </td>
    `;

    tr.querySelector('.btn-test-trend').addEventListener('click', () => {
      navTabs[1].click();
      tabCustomBtn.click();
      document.getElementById('customId').value = trend.hashtag;
      document.getElementById('customTitle').value = `Trending short-form video on ${trend.topic} (${trend.hashtag})`;
      document.getElementById('customTone').value = `Viral social media trend with ${trend.growth} engagement velocity`;
      showToast(`Loaded ${trend.hashtag} into Custom Simulator!`, '⚡');
    });

    trendTableBody.appendChild(tr);
  });
}

// =======================================================
// INTERACTIVE MICRO-LAB & CONCEPT SANDBOX MODAL
// =======================================================
async function openDeepDiveModal(rec, existingDive = null) {
  playSound('click');
  modalConceptTitle.textContent = rec.interest_detected;
  modalTargetRec.textContent = `🎯 Focus: ${rec.recommended_tech_reel}`;
  modalCategoryTag.textContent = rec.category;
  modalDifficultyTag.textContent = rec.difficulty;

  modalPrereqList.innerHTML = `<li>Loading prerequisites...</li>`;
  modalChallengeText.textContent = `Generating tailored challenge...`;
  modalIndustryText.textContent = `Analyzing industry relevance...`;
  renderSandboxInteractiveDemo(rec.category, rec.interest_detected);
  deepDiveModal.classList.remove('hidden');

  if (existingDive) {
    populateModalWithDive(existingDive);
    return;
  }

  try {
    const res = await fetch('/api/deep-dive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation: rec })
    });
    const dive = await res.json();
    populateModalWithDive(dive);
  } catch (err) {
    modalChallengeText.textContent = "Write an exploratory code script to benchmark this concept directly in your environment.";
    modalIndustryText.textContent = rec.why_this_recommendation;
  }
}

function populateModalWithDive(dive) {
  modalPrereqList.innerHTML = dive.prerequisites.map(p => `<li><span>📌</span> <strong>${escapeHtml(p)}</strong></li>`).join('');
  modalChallengeText.textContent = dive.fifteen_minute_challenge;
  modalIndustryText.textContent = dive.industry_relevance;
}

function renderSandboxInteractiveDemo(category, concept) {
  sandboxCanvas.innerHTML = '';
  const container = document.createElement('div');

  if (category === 'Java' || category === 'DSA') {
    container.innerHTML = `
      <div style="margin-bottom: 8px; color: #38bdf8;"><strong>AST Token &amp; Syntax Tree Inspector:</strong></div>
      <div style="background: #0d1117; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 0.78rem;">
        [TOKEN 1]: KEYWORD_PUBLIC("public")<br>
        [TOKEN 2]: KEYWORD_CLASS("class")<br>
        [TOKEN 3]: IDENTIFIER("Main")<br>
        [TOKEN 4]: LBRACE("{")<br>
        [TOKEN 5]: PRINTLN_INVOKE("System.out.println")<br>
        <span style="color: #ef4444;">--> PARSER ERROR: Missing SEMICOLON token before RBRACE (EOF)</span>
      </div>
      <div style="margin-top: 8px; font-size: 0.75rem; color: #a5b4fc;">
        Recursive Descent Parser expects StatementEnd ';' but encountered TokenType.RBRACE.
      </div>
    `;
  } else if (category === 'Hardware') {
    container.innerHTML = `
      <div style="margin-bottom: 8px; color: #10b981;"><strong>Microarchitecture Execution Pipeline:</strong></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.75rem;">
        <div style="background: rgba(6,182,212,0.1); padding: 8px; border-radius: 4px; border: 1px solid #06b6d4;">
          <strong>ARM (RISC):</strong><br>
          • Fixed 32-bit instructions<br>
          • Unified Memory (SoC)<br>
          • Lower TDP (30W max)
        </div>
        <div style="background: rgba(244,63,94,0.1); padding: 8px; border-radius: 4px; border: 1px solid #f43f5e;">
          <strong>x86 (CISC):</strong><br>
          • Variable 1-15 byte opcodes<br>
          • PCIe Discrete Memory bus<br>
          • Higher Peak TDP (175W+)
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="color: #c084fc; margin-bottom: 6px;"><strong>Core CS Primitive: ${escapeHtml(concept)}</strong></div>
      <p style="font-size: 0.76rem; color: #cbd5e1;">
        Ready for hands-on execution. Explore this topic to build production-grade software and systems intuition.
      </p>
    `;
  }

  sandboxCanvas.appendChild(container);
}

// Helpers
function formatSchemaText(rec) {
  return `CURRENT REEL: ${rec.current_reel}
INTEREST DETECTED: ${rec.interest_detected}
WHY: ${rec.why}
RECOMMENDED TECH REEL: ${rec.recommended_tech_reel}
CATEGORY: ${rec.category}
WHY THIS RECOMMENDATION: ${rec.why_this_recommendation}
DIFFICULTY: ${rec.difficulty}
CONFIDENCE: ${rec.confidence}`;
}

function downloadMarkdownReport() {
  let md = `# Antigravity AI Reel-to-Tech Recommendation Report\n\n`;
  md += `*Generated on: ${new Date().toLocaleString()}*\n\n`;
  md += `> **System Policy:** Zero-Hype Filter & Deep Context Inference for Student Learning Pathways.\n\n---\n\n`;

  currentRecommendations.forEach((rec, idx) => {
    md += `### ${idx + 1}. ${rec.current_reel}\n\n`;
    md += `- **INTEREST DETECTED:** ${rec.interest_detected}\n`;
    md += `- **WHY:** ${rec.why}\n`;
    md += `- **RECOMMENDED TECH REEL:** \`${rec.recommended_tech_reel}\`\n`;
    md += `- **CATEGORY:** \`${rec.category}\`\n`;
    md += `- **WHY THIS RECOMMENDATION:** ${rec.why_this_recommendation}\n`;
    md += `- **DIFFICULTY:** ${rec.difficulty}\n`;
    md += `- **CONFIDENCE:** ${rec.confidence}\n\n`;
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reel_recommendations_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Downloaded Markdown Report!', '📥');
}

function formatCompactNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =======================================================
// GEMINI VEO 2 AI VIDEO REELS ENGINE
// =======================================================

function setupVeoListeners() {
  // Feed launch button
  if (btnWatchReelVeo) {
    btnWatchReelVeo.addEventListener('click', () => {
      playSound('click');
      const currentReel = reelsLibrary[activeReelIndex];
      if (currentReel && currentReel.veo_video_metadata) {
        openVeoModal(currentReel.veo_video_metadata);
      } else if (currentReel) {
        generateVeoReelForTopic(currentReel.title, currentReel.category || 'AI', null, true);
      }
    });
  }

  // HUD Bridge launch button
  if (btnOpenVeoBridge) {
    btnOpenVeoBridge.addEventListener('click', () => {
      playSound('click');
      if (activeDeepDiveData && activeDeepDiveData.veo_video) {
        openVeoModal(activeDeepDiveData.veo_video);
      } else if (activeDeepDiveData && activeDeepDiveData.evaluation) {
        const ev = activeDeepDiveData.evaluation;
        generateVeoReelForTopic(ev.recommended_tech_reel, ev.category, ev, true);
      }
    });
  }

  // Studio custom topic generator
  if (btnGenerateVeoCustom) {
    btnGenerateVeoCustom.addEventListener('click', () => {
      const topic = veoCustomTopicInput.value.trim();
      const cat = veoCategorySelect.value || 'AI';
      if (!topic) {
        return showToast('Please enter a topic to generate', '⚠️');
      }
      generateVeoReelForTopic(topic, cat, null, false);
    });
  }

  // Studio playback buttons
  if (btnVeoPlayPause) {
    btnVeoPlayPause.addEventListener('click', () => toggleVeoPlayPause(false));
  }
  if (btnVeoReplay) {
    btnVeoReplay.addEventListener('click', () => replayVeo(false));
  }
  if (btnVeoVoiceToggle) {
    btnVeoVoiceToggle.addEventListener('click', () => {
      veoVoiceEnabled = !veoVoiceEnabled;
      veoVoiceIcon.textContent = veoVoiceEnabled ? '🗣️' : '🔇';
      veoVoiceLabel.textContent = veoVoiceEnabled ? 'Voice ON' : 'Voice OFF';
      showToast(veoVoiceEnabled ? 'AI Voiceover Enabled' : 'AI Voiceover Muted', veoVoiceEnabled ? '🗣️' : '🔇');
    });
  }

  // Studio keyframe timeline chips
  [kfChip0, kfChip1, kfChip2].forEach((chip, i) => {
    if (chip) {
      chip.addEventListener('click', () => {
        const sec = parseFloat(chip.getAttribute('data-sec')) || (i * 4.5);
        seekVeoToSec(sec, false);
      });
    }
  });

  // Prompt actions
  if (btnCopyVeoPrompt) {
    btnCopyVeoPrompt.addEventListener('click', () => {
      if (activeVeoReel) {
        navigator.clipboard.writeText(activeVeoReel.veo_prompt || activeVeoReel.veo_prompt_bundle?.prompt || '');
        showToast('Copied Gemini Veo 2 Prompt to clipboard!', '📋');
      }
    });
  }

  if (btnExportVeoStudio) {
    btnExportVeoStudio.addEventListener('click', () => {
      if (activeVeoReel) {
        exportVeoStudioPrompt(activeVeoReel);
      }
    });
  }

  if (btnRefreshVeoGallery) {
    btnRefreshVeoGallery.addEventListener('click', () => {
      playSound('click');
      fetchVeoGallery();
    });
  }

  // Modal controls
  if (veoModalCloseBtn) {
    veoModalCloseBtn.addEventListener('click', closeVeoModal);
  }
  if (veoModal) {
    veoModal.addEventListener('click', (e) => {
      if (e.target === veoModal) closeVeoModal();
    });
  }
  if (btnVeoModalPlayPause) {
    btnVeoModalPlayPause.addEventListener('click', () => toggleVeoPlayPause(true));
  }
  if (btnVeoModalReplay) {
    btnVeoModalReplay.addEventListener('click', () => replayVeo(true));
  }
  if (btnVeoModalVoiceToggle) {
    btnVeoModalVoiceToggle.addEventListener('click', () => {
      veoVoiceEnabled = !veoVoiceEnabled;
      btnVeoModalVoiceToggle.textContent = veoVoiceEnabled ? '🗣️ Voice ON' : '🔇 Voice OFF';
      showToast(veoVoiceEnabled ? 'AI Voiceover Enabled' : 'AI Voiceover Muted', veoVoiceEnabled ? '🗣️' : '🔇');
    });
  }
  if (btnVeoModalCopyPrompt) {
    btnVeoModalCopyPrompt.addEventListener('click', () => {
      if (activeVeoReel) {
        navigator.clipboard.writeText(activeVeoReel.veo_prompt || '');
        showToast('Copied Veo 2 Prompt to clipboard!', '📋');
      }
    });
  }
  if (btnVeoModalGoToStudio) {
    btnVeoModalGoToStudio.addEventListener('click', () => {
      closeVeoModal();
      const tabVeo = document.getElementById('navTabVeo');
      if (tabVeo) tabVeo.click();
    });
  }
}

async function fetchVeoGallery() {
  try {
    const res = await fetch('/api/veo/gallery');
    if (!res.ok) throw new Error('Failed to load Veo gallery');
    const data = await res.json();
    curatedVeoGallery = data.gallery || [];
    renderVeoGallery(curatedVeoGallery);
    if (!activeVeoReel && curatedVeoGallery.length > 0) {
      loadVeoReelIntoStudio(curatedVeoGallery[0]);
    }
  } catch (err) {
    console.error('Error fetching Veo gallery:', err);
  }
}

function renderVeoGallery(galleryItems) {
  if (!veoGalleryGrid) return;
  veoGalleryGrid.innerHTML = '';
  galleryItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'veo-gallery-card';
    const catMeta = categoriesData[item.category] || { icon: '✨', color: '#8b5cf6' };
    const promptSnippet = (item.veo_prompt || '').slice(0, 110) + '...';

    card.innerHTML = `
      <div>
        <div class="vgc-top">
          <span class="category-tag" style="color: ${catMeta.color}; border-color: ${catMeta.color}40; background: ${catMeta.color}15;">
            ${catMeta.icon} ${item.category}
          </span>
          <span class="badge badge-accent">4K 60FPS</span>
        </div>
        <h4 class="vgc-title">${escapeHtml(item.concept_title)}</h4>
        <p class="vgc-desc">${escapeHtml(item.summary || promptSnippet)}</p>
      </div>
      <button class="btn btn-primary btn-sm vgc-btn">
        <span class="veo-sparkle">✨</span>
        <span>Stream 3D Reel</span>
      </button>
    `;

    card.addEventListener('click', () => {
      playSound('click');
      loadVeoReelIntoStudio(item);
      const tabVeo = document.getElementById('navTabVeo');
      if (tabVeo) tabVeo.click();
      startVeoPlayback(false);
      showToast(`Loaded "${item.concept_title}" in 4K Theater!`, '🎬');
    });

    veoGalleryGrid.appendChild(card);
  });
}

async function generateVeoReelForTopic(topic, category = 'AI', recommendation = null, openModal = false) {
  showToast(`Synthesizing Gemini Veo 2 3D Reel for "${topic.slice(0, 30)}..."`, '✨');
  if (btnGenerateVeoCustom) {
    btnGenerateVeoCustom.disabled = true;
    btnGenerateVeoCustom.innerHTML = `<span class="pulse-dot"></span> Synthesizing Veo Storyboard...`;
  }

  try {
    const payload = {
      topic: topic,
      category: category,
      recommendation: recommendation,
      provider: providerSelect.value,
      api_key: apiKeyInput.value.trim() || undefined,
      model: modelInput.value.trim() || undefined
    };

    const res = await fetch('/api/veo/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Veo generation failed');
    }

    const veoData = await res.json();
    loadVeoReelIntoStudio(veoData);

    if (openModal) {
      openVeoModal(veoData);
    } else {
      startVeoPlayback(false);
    }

    playSound('success');
    showToast(`Gemini Veo 4K Explanation Ready!`, '🎉');
  } catch (err) {
    console.error('Veo generation error:', err);
    showToast(`Veo Generation Error: ${err.message}`, '❌');
  } finally {
    if (btnGenerateVeoCustom) {
      btnGenerateVeoCustom.disabled = false;
      btnGenerateVeoCustom.innerHTML = `<span class="veo-sparkle">✨</span> <span>Generate Gemini Veo Reel</span>`;
    }
  }
}

function loadVeoReelIntoStudio(veoData) {
  activeVeoReel = veoData;
  veoPlaybackSec = 0.0;
  currentVeoKeyframeIndex = -1;

  if (veoActiveConceptTitle) veoActiveConceptTitle.textContent = veoData.concept_title;
  if (veoActiveCategoryTag) veoActiveCategoryTag.textContent = veoData.category;
  if (veoActiveSummary) veoActiveSummary.textContent = veoData.summary || `4K 60FPS AI explanation for ${veoData.concept_title}`;
  if (veoModelBadge) veoModelBadge.textContent = veoData.model_used || 'Google Gemini Veo 2 Engine';

  const bundle = veoData.veo_prompt_bundle || {};
  if (veoSpecCamera) veoSpecCamera.textContent = bundle.camera_motion || 'FPV Dolly Push & Orbital 3D Scan';
  if (veoSpecLighting) veoSpecLighting.textContent = bundle.lighting_shader || 'Volumetric Raytraced Global Illumination';
  if (veoSpecAspect) veoSpecAspect.textContent = `${bundle.aspect_ratio || '9:16'} • ${bundle.resolution || '4K UHD'} ${bundle.framerate || '60FPS'}`;
  if (veoSpecColor) veoSpecColor.textContent = bundle.color_grading || 'Cyberpunk Dark Slate & Laser Cyan';
  if (veoPromptCodeText) veoPromptCodeText.textContent = veoData.veo_prompt || bundle.prompt || '';

  // Populate Storyboard Cards
  if (veoStoryboardList) {
    veoStoryboardList.innerHTML = '';
    (veoData.keyframes || []).forEach((kf, idx) => {
      const item = document.createElement('div');
      item.className = 'storyboard-item';
      item.innerHTML = `
        <div class="sb-top">
          <span class="sb-badge">Scene ${idx + 1} • ${kf.timestamp_sec.toFixed(1)}s</span>
          <span class="sb-hud">${escapeHtml(kf.camera_hud || `CAM_0${idx+1}`)}</span>
        </div>
        <div class="sb-title">${escapeHtml(kf.title)}</div>
        <div class="sb-vis">📹 ${escapeHtml(kf.visual_description)}</div>
        <div class="sb-vo">🗣️ "${escapeHtml(kf.voiceover_line)}"</div>
      `;
      item.addEventListener('click', () => {
        seekVeoToSec(kf.timestamp_sec, false);
      });
      veoStoryboardList.appendChild(item);
    });
  }

  // Update Keyframe chips labels
  if (veoData.keyframes && veoData.keyframes.length >= 3) {
    if (kfChip0) kfChip0.querySelector('.kf-label').textContent = veoData.keyframes[0].title;
    if (kfChip1) kfChip1.querySelector('.kf-label').textContent = veoData.keyframes[1].title;
    if (kfChip2) kfChip2.querySelector('.kf-label').textContent = veoData.keyframes[2].title;
  }

  updateVeoKeyframeUI(0.0, false);
}

function startVeoPlayback(isModal = false) {
  if (!activeVeoReel) return;
  veoIsPlaying = true;
  updateVeoPlayButtonUI(true, isModal);

  if (veoAudioSpectrum) veoAudioSpectrum.classList.add('playing');

  clearInterval(veoTimerInterval);
  veoTimerInterval = setInterval(() => {
    veoPlaybackSec += 0.1;
    if (veoPlaybackSec >= VEO_DURATION_SEC) {
      veoPlaybackSec = 0.0; // Loop seamlessly
      currentVeoKeyframeIndex = -1;
    }
    updateVeoKeyframeUI(veoPlaybackSec, isModal);
  }, 100);

  startVeoRenderLoop(isModal);
}

function pauseVeoPlayback() {
  veoIsPlaying = false;
  clearInterval(veoTimerInterval);
  if (veoAnimationFrameId) cancelAnimationFrame(veoAnimationFrameId);
  if (veoModalAnimationFrameId) cancelAnimationFrame(veoModalAnimationFrameId);
  if (veoAudioSpectrum) veoAudioSpectrum.classList.remove('playing');
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  updateVeoPlayButtonUI(false, false);
  updateVeoPlayButtonUI(false, true);
}

function toggleVeoPlayPause(isModal = false) {
  playSound('click');
  if (veoIsPlaying) {
    pauseVeoPlayback();
  } else {
    startVeoPlayback(isModal);
  }
}

function replayVeo(isModal = false) {
  playSound('click');
  seekVeoToSec(0.0, isModal);
  startVeoPlayback(isModal);
}

function seekVeoToSec(sec, isModal = false) {
  veoPlaybackSec = Math.max(0.0, Math.min(sec, VEO_DURATION_SEC));
  currentVeoKeyframeIndex = -1; // Reset to force trigger
  updateVeoKeyframeUI(veoPlaybackSec, isModal);
}

function updateVeoPlayButtonUI(playing, isModal = false) {
  if (isModal) {
    if (btnVeoModalPlayPause) btnVeoModalPlayPause.textContent = playing ? '⏸️ Pause' : '▶️ Play';
  } else {
    if (veoPlayIcon) veoPlayIcon.textContent = playing ? '⏸️' : '▶️';
    if (veoPlayLabel) veoPlayLabel.textContent = playing ? 'Pause' : 'Play';
  }
}

function updateVeoKeyframeUI(sec, isModal = false) {
  const percent = (sec / VEO_DURATION_SEC) * 100;
  if (!isModal && veoTimelineProgress) {
    veoTimelineProgress.style.width = `${percent}%`;
  }
  if (isModal && veoModalTimelineProgress) {
    veoModalTimelineProgress.style.width = `${percent}%`;
  }

  if (!activeVeoReel || !activeVeoReel.keyframes) return;

  // Find active keyframe based on timestamp
  let activeKf = activeVeoReel.keyframes[0];
  let activeIdx = 0;
  for (let i = 0; i < activeVeoReel.keyframes.length; i++) {
    if (sec >= activeVeoReel.keyframes[i].timestamp_sec) {
      activeKf = activeVeoReel.keyframes[i];
      activeIdx = i;
    }
  }

  // Update camera HUD and subtitles
  const camText = activeKf.camera_hud || `CAM_0${activeIdx + 1} [ORBIT 45°]`;
  const subText = activeKf.subtitles || activeKf.voiceover_line || activeKf.title;

  if (!isModal) {
    if (veoCamHud) veoCamHud.textContent = camText;
    if (veoSubtitleText) veoSubtitleText.textContent = subText;

    // Update active keyframe chip
    [kfChip0, kfChip1, kfChip2].forEach((chip, i) => {
      if (chip) chip.classList.toggle('active', i === activeIdx);
    });
  } else {
    if (veoModalCamHud) veoModalCamHud.textContent = camText;
    if (veoModalSubtitleText) veoModalSubtitleText.textContent = subText;
  }

  // Trigger narration voiceover when keyframe changes
  if (activeIdx !== currentVeoKeyframeIndex) {
    currentVeoKeyframeIndex = activeIdx;
    if (veoVoiceEnabled && activeKf.voiceover_line) {
      speakVeoNarration(activeKf.voiceover_line);
    }
  }
}

function speakVeoNarration(text) {
  if (!veoVoiceEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Select an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en')));
    if (naturalVoice) utterance.voice = naturalVoice;

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    // SpeechSynthesis fallback
  }
}

// 60 FPS Procedural 3D Raytracing & Particle Canvas Simulation
function startVeoRenderLoop(isModal = false) {
  const targetCanvas = isModal ? veoModalCanvas : veoCanvasElem;
  if (!targetCanvas) return;
  const ctx = targetCanvas.getContext('2d');

  function loop() {
    if (!veoIsPlaying) return;
    renderVeoSimulation(ctx, targetCanvas, veoPlaybackSec, activeVeoReel);
    if (isModal) {
      veoModalAnimationFrameId = requestAnimationFrame(loop);
    } else {
      veoAnimationFrameId = requestAnimationFrame(loop);
    }
  }

  if (isModal) {
    if (veoModalAnimationFrameId) cancelAnimationFrame(veoModalAnimationFrameId);
    veoModalAnimationFrameId = requestAnimationFrame(loop);
  } else {
    if (veoAnimationFrameId) cancelAnimationFrame(veoAnimationFrameId);
    veoAnimationFrameId = requestAnimationFrame(loop);
  }
}

function renderVeoSimulation(ctx, canvas, sec, veoData) {
  if (!ctx || !canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  const t = (sec * 2) + (performance.now() / 1000);
  const cat = veoData?.category || 'AI';
  const rawTitle = (veoData?.concept_title || veoData?.title || '').toLowerCase();
  const rawSummary = (veoData?.summary || veoData?.description || '').toLowerCase();

  // Clear with deep space dark gradient
  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, h / 1.35);
  bgGrad.addColorStop(0, '#111633');
  bgGrad.addColorStop(0.5, '#090c1e');
  bgGrad.addColorStop(1, '#04060e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 3D Perspective Cyber Grid Plane
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.14)';
  ctx.lineWidth = 1;
  const gridY = h * 0.72;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 32) {
    ctx.moveTo(x, gridY);
    ctx.lineTo((x - w / 2) * 3 + w / 2, h);
  }
  for (let y = gridY; y <= h; y += 18) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // =========================================================================
  // TOPIC-SPECIFIC PROCEDURAL 3D SIMULATION ENGINES
  // =========================================================================

  if (rawTitle.includes('moe') || rawTitle.includes('mixture') || rawTitle.includes('expert') || rawTitle.includes('39b') || rawTitle.includes('236b') || rawTitle.includes('sparse')) {
    // -----------------------------------------------------------------------
    // TOPIC: Mixture-of-Experts (MoE) Sparse Parameter Activation & Router
    // -----------------------------------------------------------------------
    const cx = w / 2;
    const cy = h * 0.40;

    // Gating Router Network in Center
    const routerGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 38);
    routerGrad.addColorStop(0, '#ffffff');
    routerGrad.addColorStop(0.4, '#06b6d4');
    routerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = routerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#030712';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ROUTER', cx, cy + 3);

    // 8 Expert Neural Blocks in 3D Arc
    const numExperts = 8;
    const activeExperts = [1, 4]; // Top-2 Active (e.g. 39B active)

    for (let e = 0; e < numExperts; e++) {
      const angle = (e / numExperts) * Math.PI * 2 + t * 0.3;
      const radiusX = 110;
      const radiusY = 65;
      const ex = cx + Math.cos(angle) * radiusX;
      const ey = cy + Math.sin(angle) * radiusY;
      const isActive = activeExperts.includes(e);

      if (isActive) {
        // High-energy laser data path from router to active expert
        const beamGrad = ctx.createLinearGradient(cx, cy, ex, ey);
        beamGrad.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
        beamGrad.addColorStop(1, 'rgba(236, 72, 153, 0.9)');
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Active Expert Block (Neon Cyan / Magenta)
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(ex - 22, ey - 10, 44, 20, 5);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`Exp #${e+1} ⚡`, ex, ey + 3);
      } else {
        // Inactive / Dimmed Expert Block (Dark violet)
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(ex - 18, ey - 8, 36, 16, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '7px monospace';
        ctx.fillText(`Exp #${e+1}`, ex, ey + 3);
      }
    }

    // MoE Floating 3D Telemetry Stats Box
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 14, 28, 0.85)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - 105, cy + 90, 210, 46, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ MOE ROUTING: Top-2 of 8 Experts Active', cx - 95, cy + 106);
    ctx.fillStyle = '#10b981';
    ctx.font = '8px monospace';
    ctx.fillText('• ACTIVE PARAMS: 39B / 236B (83.5% FLOP Reduction)', cx - 95, cy + 120);
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText('• MEMORY: Sparse Token KV-Cache Dispatch', cx - 95, cy + 130);

  } else if (rawTitle.includes('semicolon') || rawTitle.includes('compiler') || rawTitle.includes('ast') || rawTitle.includes('lex') || rawTitle.includes('parse') || rawTitle.includes('javac')) {
    // -----------------------------------------------------------------------
    // TOPIC: Java Missing Semicolon & Compilers Lexical Analysis AST Parsing
    // -----------------------------------------------------------------------
    const cx = w / 2;
    const cy = h * 0.38;

    // Laser Lexer Beam scanning code
    const scanY = cy - 65 + ((t * 45) % 130);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(cx - 110, scanY);
    ctx.lineTo(cx + 110, scanY);
    ctx.stroke();

    // 3D Floating AST Node Blocks
    const astNodes = [
      { name: "Program", x: cx, y: cy - 45, color: "#f59e0b" },
      { name: "ClassDef", x: cx - 55, y: cy, color: "#38bdf8" },
      { name: "MethodDec", x: cx + 55, y: cy, color: "#38bdf8" },
      { name: "PrintStmt", x: cx - 40, y: cy + 45, color: "#10b981" },
      { name: "Missing ';'", x: cx + 45, y: cy + 45, color: "#ef4444", alert: true }
    ];

    // Draw AST Branch Connectors
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(astNodes[0].x, astNodes[0].y); ctx.lineTo(astNodes[1].x, astNodes[1].y);
    ctx.moveTo(astNodes[0].x, astNodes[0].y); ctx.lineTo(astNodes[2].x, astNodes[2].y);
    ctx.moveTo(astNodes[1].x, astNodes[1].y); ctx.lineTo(astNodes[3].x, astNodes[3].y);
    ctx.moveTo(astNodes[2].x, astNodes[2].y); ctx.lineTo(astNodes[4].x, astNodes[4].y);
    ctx.stroke();

    astNodes.forEach(node => {
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = node.alert ? 18 : 8;
      ctx.beginPath();
      ctx.roundRect(node.x - 30, node.y - 11, 60, 22, 5);
      ctx.fill();

      ctx.fillStyle = node.alert ? '#fff' : '#030712';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + 3);
    });

    // Compiler Telemetry Box
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 14, 28, 0.88)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.roundRect(cx - 105, cy + 85, 210, 44, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⛔ PARSER ERROR: Missing Semicolon \';\'', cx - 95, cy + 101);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '8px monospace';
    ctx.fillText('• LEXER: [KEYWORD_PUBLIC, CLASS, INVOKESTMT]', cx - 95, cy + 115);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• AST: Statement boundary failed at EOF', cx - 95, cy + 125);

  } else if (rawTitle.includes('m3') || rawTitle.includes('rtx') || rawTitle.includes('arm') || rawTitle.includes('x86') || rawTitle.includes('hardware') || rawTitle.includes('thermal') || rawTitle.includes('unified memory')) {
    // -----------------------------------------------------------------------
    // TOPIC: ARM vs x86 Microarchitecture, Unified Memory & TDP Benchmark
    // -----------------------------------------------------------------------
    const cx = w / 2;
    const cy = h * 0.40;

    // Left Zone: Apple Silicon Unified SoC
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(cx - 110, cy - 65, 100, 120, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(' ARM UNIFIED SoC', cx - 60, cy - 48);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '8px monospace';
    ctx.fillText('• TDP: 30W Max', cx - 60, cy - 28);
    ctx.fillText('• Temp: 42°C Cool', cx - 60, cy - 12);
    ctx.fillText('• Bus: 800 GB/s', cx - 60, cy + 4);
    ctx.fillStyle = '#10b981';
    ctx.fillText('• 120 FPS / 18h Bat', cx - 60, cy + 22);

    // Right Zone: x86 + Discrete GPU PCIe
    ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
    ctx.strokeStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(cx + 10, cy - 65, 100, 120, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('⚡ x86 DISCRETE GPU', cx + 60, cy - 48);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '8px monospace';
    ctx.fillText('• TDP: 175W Peak', cx + 60, cy - 28);
    ctx.fillText('• Temp: 84°C High', cx + 60, cy - 12);
    ctx.fillText('• Bus: PCIe 4.0 x16', cx + 60, cy + 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('• 145 FPS / 1.5h Bat', cx + 60, cy + 22);

    // Memory Bus Pulse in Center
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
    ctx.stroke();

    // Hardware Telemetry Box
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 14, 28, 0.88)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.beginPath();
    ctx.roundRect(cx - 105, cy + 75, 210, 42, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('💻 ARCHITECTURE: ARM SoC vs x86 CISC', cx - 95, cy + 91);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '8px monospace';
    ctx.fillText('• Fixed 32-bit RISC Instructions vs Variable CISC', cx - 95, cy + 104);

  } else if (rawTitle.includes('raft') || rawTitle.includes('consensus') || rawTitle.includes('outage') || rawTitle.includes('aws') || rawTitle.includes('us-east-1') || rawTitle.includes('sharding') || rawTitle.includes('distributed')) {
    // -----------------------------------------------------------------------
    // TOPIC: Distributed Consensus (Raft/Paxos) & AWS Cloud Resilience
    // -----------------------------------------------------------------------
    const cx = w / 2;
    const cy = h * 0.40;
    const numNodes = 5;

    // Leader Node in Center
    ctx.fillStyle = '#3b82f6';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEADER', cx, cy + 3);

    // Heartbeat Pulse Wave
    const pulseRad = 20 + ((t * 40) % 75);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRad, 0, Math.PI * 2);
    ctx.stroke();

    // 4 Follower Nodes in Ring
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + t * 0.2;
      const nx = cx + Math.cos(ang) * 85;
      const ny = cy + Math.sin(ang) * 55;
      const isFailed = i === 2 && (sec % 6 > 3);

      ctx.fillStyle = isFailed ? '#ef4444' : '#10b981';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = isFailed ? 16 : 8;
      ctx.beginPath();
      ctx.arc(nx, ny, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#030712';
      ctx.font = 'bold 7px monospace';
      ctx.fillText(isFailed ? 'FAIL' : `N${i+1}`, nx, ny + 3);

      if (!isFailed) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
    }

    // Consensus Telemetry Box
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 14, 28, 0.88)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.beginPath();
    ctx.roundRect(cx - 105, cy + 85, 210, 44, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🏛️ RAFT CONSENSUS: Term 4 Heartbeat (50ms)', cx - 95, cy + 101);
    ctx.fillStyle = '#34d399';
    ctx.font = '8px monospace';
    ctx.fillText('• Log Quorum: 4/5 Nodes Committed & Replicated', cx - 95, cy + 115);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• Byzantine Fault Tolerance: Zero Partition Loss', cx - 95, cy + 125);

  } else if (rawTitle.includes('tree') || rawTitle.includes('binary') || rawTitle.includes('invert') || rawTitle.includes('dsa') || rawTitle.includes('cache locality') || rawTitle.includes('algorithm')) {
    // -----------------------------------------------------------------------
    // TOPIC: Inverting Binary Tree & CPU Cache Locality
    // -----------------------------------------------------------------------
    const cx = w / 2;
    const cy = h * 0.32;

    function drawInvertedTree(x, y, level, val) {
      if (level > 3) return;
      const offset = 65 / level;
      const isSwapping = (sec % 3 > 1.5);

      const lx = x - (isSwapping ? -offset : offset);
      const rx = x + (isSwapping ? -offset : offset);
      const ly = y + 36;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(lx, ly);
      ctx.moveTo(x, y); ctx.lineTo(rx, ly);
      ctx.stroke();

      drawInvertedTree(lx, ly, level + 1, val * 2);
      drawInvertedTree(rx, ly, level + 1, val * 2 + 1);

      ctx.fillStyle = level === 1 ? '#06b6d4' : (level === 2 ? '#3b82f6' : '#8b5cf6');
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x, y + 3);
    }

    drawInvertedTree(cx, cy, 1, 4);

    // DSA Telemetry Box
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 14, 28, 0.88)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.beginPath();
    ctx.roundRect(cx - 105, cy + 120, 210, 44, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ INVERT BINARY TREE: O(N) In-Place Swap', cx - 95, cy + 136);
    ctx.fillStyle = '#34d399';
    ctx.font = '8px monospace';
    ctx.fillText('• CPU CACHE: Sequential L1 Hit Rate (98.4%)', cx - 95, cy + 150);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• Space Complexity: O(H) Call Stack Depth', cx - 95, cy + 160);

  } else if (rawTitle.includes('docker') || rawTitle.includes('container') || rawTitle.includes('port 8080') || rawTitle.includes('namespace') || rawTitle.includes('kernel') || rawTitle.includes('cgroup')) {
    // -----------------------------------------------------------------------
    // TOPIC: Docker Containers, Linux Kernel Namespaces & Port Forwarding
    // -----------------------------------------------------------------------
    const cx = w / 2;
    const cy = h * 0.40;

    // Container Isolation Box
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(cx - 95, cy - 65, 190, 120, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🐳 DOCKER CONTAINER ISOLATION', cx, cy - 48);

    // Inner Isolated Namespaces
    const nsBoxes = [
      { name: "pid_ns (PID 1)", x: cx - 45, y: cy - 25 },
      { name: "net_ns (veth0)", x: cx + 45, y: cy - 25 },
      { name: "cgroups (512MB)", x: cx - 45, y: cy + 15 },
      { name: "mnt_ns (overlay)", x: cx + 45, y: cy + 15 }
    ];

    nsBoxes.forEach(ns => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ns.x - 40, ns.y - 12, 80, 24, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '7px monospace';
      ctx.fillText(ns.name, ns.x, ns.y + 3);
    });

    // Port Forwarding Line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 85, cy + 42); ctx.lineTo(cx + 85, cy + 42);
    ctx.stroke();

    // Container Telemetry Box
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 14, 28, 0.88)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.beginPath();
    ctx.roundRect(cx - 105, cy + 85, 210, 44, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🔌 BRIDGE NETWORKING: 0.0.0.0:8080', cx - 95, cy + 101);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '8px monospace';
    ctx.fillText('• iptables NAT PREROUTING -> docker0 interface', cx - 95, cy + 115);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• Kernel Primitive: unshare(CLONE_NEWNET)', cx - 95, cy + 125);

  } else if (rawTitle.includes('tls') || rawTitle.includes('crypto') || rawTitle.includes('handshake') || rawTitle.includes('packet') || rawTitle.includes('sniff')) {
    // -----------------------------------------------------------------------
    // TOPIC: TLS 1.3 Cryptography & Diffie-Hellman Handshake
    // -----------------------------------------------------------------------
    const cx = w / 2;
    const cy = h * 0.42;

    for (let ring = 1; ring <= 6; ring++) {
      const rad = ring * 20;
      const pulse = Math.sin(t * 2 + ring) * 7;
      ctx.strokeStyle = ring % 2 === 0 ? 'rgba(6, 182, 212, 0.7)' : 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rad + pulse, (rad + pulse) * 0.55, t * 0.3 * (ring % 2 === 0 ? 1 : -1), 0, Math.PI * 2);
      ctx.stroke();
    }

    // TLS Telemetry Box
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 14, 28, 0.88)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.roundRect(cx - 105, cy + 85, 210, 44, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🛡️ TLS 1.3 ASYMMETRIC KEY EXCHANGE', cx - 95, cy + 101);
    ctx.fillStyle = '#34d399';
    ctx.font = '8px monospace';
    ctx.fillText('• Ephemeral Diffie-Hellman: X25519 Curve', cx - 95, cy + 115);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• Zero-Trust: AES-256-GCM Encrypted Tunnel', cx - 95, cy + 125);

  } else {
    // -----------------------------------------------------------------------
    // TOPIC: Transformer Attention & Neural Architecture (Default / Custom)
    // -----------------------------------------------------------------------
    const centerX = w / 2;
    const centerY = h * 0.40;
    const numNodes = 12;

    // Draw connecting Attention Beams
    ctx.lineWidth = 1.5;
    for (let i = 0; i < numNodes; i++) {
      const angle1 = (i / numNodes) * Math.PI * 2 + t * 0.5;
      const r1 = 80 + Math.sin(t + i) * 22;
      const x1 = centerX + Math.cos(angle1) * r1;
      const y1 = centerY + Math.sin(angle1) * (r1 * 0.62);

      for (let j = i + 1; j < numNodes; j++) {
        if ((i + j) % 2 === 0) {
          const angle2 = (j / numNodes) * Math.PI * 2 + t * 0.5;
          const r2 = 80 + Math.sin(t + j) * 22;
          const x2 = centerX + Math.cos(angle2) * r2;
          const y2 = centerY + Math.sin(angle2) * (r2 * 0.62);

          const beamGrad = ctx.createLinearGradient(x1, y1, x2, y2);
          beamGrad.addColorStop(0, 'rgba(6, 182, 212, 0.5)');
          beamGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.7)');
          beamGrad.addColorStop(1, 'rgba(139, 92, 246, 0.5)');
          ctx.strokeStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Attention Node
      ctx.fillStyle = i % 2 === 0 ? '#06b6d4' : '#ec4899';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x1, y1, 4 + Math.sin(t * 2 + i) * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core Center Pulse
    const coreGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 40);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#8b5cf6');
    coreGrad.addColorStop(0.8, '#06b6d4');
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
    ctx.fill();

    // Concept Telemetry Box with Exact Concept Title
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 14, 28, 0.88)';
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.beginPath();
    ctx.roundRect(centerX - 105, centerY + 85, 210, 44, 8);
    ctx.fill();
    ctx.stroke();

    const displayTitle = (veoData?.concept_title || veoData?.title || 'AI Architecture').slice(0, 30);
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${displayTitle}`, centerX - 95, centerY + 101);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '8px monospace';
    ctx.fillText(`• Core CS Concept: ${cat} Systems Blueprint`, centerX - 95, centerY + 115);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• 60 FPS Procedural Raytraced Engine', centerX - 95, centerY + 125);
  }

  // Floating Cyber Particles
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let p = 0; p < 22; p++) {
    const px = (p * 47 + t * 25) % w;
    const py = (p * 83 + Math.sin(t + p) * 40) % (h * 0.7);
    ctx.beginPath();
    ctx.arc(px, py, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function openVeoModal(veoData) {
  activeVeoReel = veoData;
  veoPlaybackSec = 0.0;
  currentVeoKeyframeIndex = -1;

  if (veoModalTitle) veoModalTitle.textContent = veoData.concept_title;
  if (veoModalCategoryTag) veoModalCategoryTag.textContent = veoData.category;
  if (veoModalSummary) veoModalSummary.textContent = veoData.summary || `4K 60FPS AI explanation for ${veoData.concept_title}`;
  if (veoModalPromptText) veoModalPromptText.textContent = veoData.veo_prompt || veoData.veo_prompt_bundle?.prompt || '';

  if (veoModalStoryboardList) {
    veoModalStoryboardList.innerHTML = '';
    (veoData.keyframes || []).forEach((kf, idx) => {
      const item = document.createElement('div');
      item.className = 'storyboard-item';
      item.innerHTML = `
        <div class="sb-top">
          <span class="sb-badge">Scene ${idx + 1} • ${kf.timestamp_sec.toFixed(1)}s</span>
          <span class="sb-hud">${escapeHtml(kf.camera_hud || '')}</span>
        </div>
        <div class="sb-title">${escapeHtml(kf.title)}</div>
        <div class="sb-vo">🗣️ "${escapeHtml(kf.voiceover_line)}"</div>
      `;
      veoModalStoryboardList.appendChild(item);
    });
  }

  veoModal.classList.remove('hidden');
  startVeoPlayback(true);
}

function closeVeoModal() {
  if (veoModal) veoModal.classList.add('hidden');
  pauseVeoPlayback();
}

async function exportVeoStudioPrompt(veoData) {
  try {
    const res = await fetch('/api/veo/prompt-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: veoData.concept_title, category: veoData.category })
    });
    const data = await res.json();
    const blob = new Blob([data.formatted_studio_prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veo2_prompt_${veoData.category.toLowerCase()}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Google Gemini Veo 2 Studio Prompt!', '🚀');
  } catch (e) {
    navigator.clipboard.writeText(veoData.veo_prompt || '');
    showToast('Copied Veo prompt to clipboard!', '📋');
  }
}

// =======================================================
// INSTAGRAM ACCOUNT LINKING & REEL LIKES SYNCHRONIZATION
// =======================================================

function setupInstagramListeners() {
  if (btnInstagramHeader) {
    btnInstagramHeader.addEventListener('click', () => {
      playSound('click');
      openInstagramModal();
    });
  }

  if (instagramModalCloseBtn) {
    instagramModalCloseBtn.addEventListener('click', closeInstagramModal);
  }

  if (btnDoneIgModal) {
    btnDoneIgModal.addEventListener('click', closeInstagramModal);
  }

  if (instagramModal) {
    instagramModal.addEventListener('click', (e) => {
      if (e.target === instagramModal) closeInstagramModal();
    });
  }

  if (btnSubmitIgConnect) {
    btnSubmitIgConnect.addEventListener('click', handleConnectInstagram);
  }

  if (btnDisconnectIg) {
    btnDisconnectIg.addEventListener('click', handleDisconnectInstagram);
  }

  if (btnExportIgDossier) {
    btnExportIgDossier.addEventListener('click', exportInstagramDossier);
  }

  const btnOpenInstaFeedFromModal = document.getElementById('btnOpenInstaFeedFromModal');
  if (btnOpenInstaFeedFromModal) {
    btnOpenInstaFeedFromModal.addEventListener('click', () => {
      playSound('click');
      closeInstagramModal();
      if (navTabInsta) navTabInsta.click();
    });
  }
}

function openInstagramModal() {
  if (instagramModal) {
    renderInstagramModalUI();
    instagramModal.classList.remove('hidden');
  }
}

function closeInstagramModal() {
  if (instagramModal) instagramModal.classList.add('hidden');
}

async function fetchInstagramProfile() {
  try {
    const res = await fetch('/api/instagram/profile');
    if (!res.ok) return;
    instagramProfile = await res.json();
    updateInstagramHeaderUI();
  } catch (e) {
    console.error('Failed to fetch Instagram status:', e);
  }
}

function updateInstagramHeaderUI() {
  if (!btnInstagramHeader) return;
  if (instagramProfile && instagramProfile.connected) {
    if (igHeaderStatusText) igHeaderStatusText.textContent = `@${instagramProfile.username}`;
    if (igHeaderLikedBadge) {
      const count = (instagramProfile.liked_reels || []).length;
      igHeaderLikedBadge.textContent = `${count} Liked`;
      igHeaderLikedBadge.classList.remove('hidden');
    }
    btnInstagramHeader.classList.add('connected');
  } else {
    if (igHeaderStatusText) igHeaderStatusText.textContent = 'Connect Instagram';
    if (igHeaderLikedBadge) igHeaderLikedBadge.classList.add('hidden');
    btnInstagramHeader.classList.remove('connected');
  }
}

async function handleConnectInstagram() {
  const username = (igUsernameInput?.value || '').trim();
  if (!username) {
    showTopNotification('Please enter a valid Instagram handle', '⚠️', 'ERROR', 2500);
    return;
  }

  playSound('inject');
  try {
    const res = await fetch('/api/instagram/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username })
    });
    const data = await res.json();
    instagramProfile = data.profile;
    updateInstagramHeaderUI();
    renderInstagramModalUI();
    showTopNotification(`Connected @${instagramProfile.username} with Instagram Sync!`, '📸', 'INSTAGRAM LINKED', 3500);
  } catch (e) {
    console.error('Instagram connect failed:', e);
    showTopNotification('Failed to connect Instagram account', '❌', 'ERROR', 2500);
  }
}

async function handleDisconnectInstagram() {
  playSound('click');
  try {
    await fetch('/api/instagram/disconnect', { method: 'POST' });
    instagramProfile = { connected: false, username: 'guest', liked_reels: [] };
    updateInstagramHeaderUI();
    renderInstagramModalUI();
    showTopNotification('Instagram account unlinked', 'ℹ️', 'DISCONNECTED', 2500);
  } catch (e) {
    console.error('Instagram disconnect failed:', e);
  }
}

async function syncInstagramLikeEvent(reel) {
  if (!reel) return;
  try {
    const payload = {
      reel_id: reel.id || `Reel_${activeReelIndex + 1}`,
      title: reel.title,
      category: reel.category || 'Tech',
      creator: reel.creator || '@tech_creator',
      ai_inferred_topic: reel.recommendation_metadata?.interest_detected || `${reel.category || 'CS'} Architecture`,
      ai_bridge_topic: reel.recommendation_metadata?.recommended_tech_reel || `Deep Dive: ${reel.title}`
    };

    const res = await fetch('/api/instagram/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (!instagramProfile) instagramProfile = { connected: true, username: data.instagram_username, liked_reels: [] };
      if (!instagramProfile.liked_reels) instagramProfile.liked_reels = [];
      
      instagramProfile.liked_reels = [
        data.liked_reel,
        ...instagramProfile.liked_reels.filter(r => r.reel_id !== data.liked_reel.reel_id)
      ];
      updateInstagramHeaderUI();
      showTopNotification(`📸 Synced Like to Instagram (@${data.instagram_username})`, '❤️', 'INSTAGRAM SYNC', 3000);
    }
  } catch (e) {
    console.error('Instagram like sync error:', e);
  }
}

function renderInstagramModalUI() {
  if (!instagramModal) return;

  if (instagramProfile && instagramProfile.connected) {
    if (igAccountBanner) igAccountBanner.classList.remove('hidden');
    if (igConnectForm) igConnectForm.classList.add('hidden');
    if (igUserHandle) igUserHandle.textContent = `@${instagramProfile.username}`;
    if (igUserBio) igUserBio.textContent = `Connected • Real-time Like Synchronization Active`;
  } else {
    if (igAccountBanner) igAccountBanner.classList.add('hidden');
    if (igConnectForm) igConnectForm.classList.remove('hidden');
  }

  const liked = (instagramProfile && instagramProfile.liked_reels) ? instagramProfile.liked_reels : [];
  if (igTotalLikedCount) igTotalLikedCount.textContent = liked.length;

  if (igLikedList) {
    if (liked.length === 0) {
      igLikedList.innerHTML = `
        <div class="empty-state" style="padding: 20px 10px;">
          <div class="empty-icon">📸</div>
          <h4 style="font-size: 0.9rem;">No Liked Reels Yet</h4>
          <p style="font-size: 0.76rem;">Like reels in the feed using the ❤️ button to automatically sync them to your Instagram learning history.</p>
        </div>
      `;
    } else {
      igLikedList.innerHTML = '';
      liked.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'ig-liked-card';
        card.style.cursor = 'pointer';
        card.title = 'Click to watch in Instagram Reel Player';
        card.innerHTML = `
          <div class="ig-liked-top">
            <div class="ig-liked-title">#${idx + 1} ${escapeHtml(item.title)}</div>
            <span class="badge" style="font-size: 0.65rem; background: rgba(225, 48, 108, 0.2); border: 1px solid rgba(225, 48, 108, 0.4); color: #f43f5e;">${escapeHtml(item.category)}</span>
          </div>
          <div class="ig-liked-meta">
            <span>👤 ${escapeHtml(item.creator)}</span>
            <span>🕒 Liked ${escapeHtml(item.liked_at)}</span>
            <span style="color: #c084fc;">▶️ Watch Reel</span>
          </div>
          <div class="ig-liked-ai-insight">
            <strong>🧠 AI Inferred Learning Pathway:</strong> ${escapeHtml(item.ai_inferred_topic || 'Computer Science Foundations')}
          </div>
        `;

        card.addEventListener('click', () => {
          playSound('click');
          closeInstagramModal();
          if (navTabInsta) navTabInsta.click();
          // Find matching reel in catalog
          const catalogIdx = INSTA_REELS_CATALOG.findIndex(r => r.id === item.reel_id || r.title === item.title);
          if (catalogIdx !== -1) {
            activeInstaReelIndex = catalogIdx;
            loadActiveInstaReel(catalogIdx);
          }
        });

        igLikedList.appendChild(card);
      });
    }
  }
}

function exportInstagramDossier() {
  const liked = (instagramProfile && instagramProfile.liked_reels) ? instagramProfile.liked_reels : [];
  if (liked.length === 0) {
    showTopNotification('No liked reels to export yet!', 'ℹ️', 'EMPTY DOSSIER', 2500);
    return;
  }

  let md = `# Instagram Synced Reel Learning Dossier\n\n`;
  md += `**Account:** @${instagramProfile?.username || 'user'}\n`;
  md += `**Exported At:** ${new Date().toLocaleString()}\n`;
  md += `**Total Liked Reels:** ${liked.length}\n\n---\n\n`;

  liked.forEach((item, idx) => {
    md += `### ${idx + 1}. ${item.title}\n`;
    md += `- **Creator:** ${item.creator}\n`;
    md += `- **Category:** ${item.category}\n`;
    md += `- **Liked At:** ${item.liked_at}\n`;
    md += `- **AI Inferred Technical Concept:** ${item.ai_inferred_topic}\n`;
    md += `- **Recommended Learning Bridge:** ${item.ai_bridge_topic}\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `instagram_liked_reels_${instagramProfile?.username || 'user'}_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showTopNotification('Exported Instagram Liked Dossier!', '📥', 'DOWNLOADED', 3000);
}

// =======================================================
// INSTAGRAM REELS SHOWCASE DATASET & THEATER ENGINE
// =======================================================

const INSTA_REELS_CATALOG = [
  {
    id: "ig_01",
    title: "POV: You forgot a semicolon in Java",
    creator: "@dev_humor",
    avatar: "☕",
    category: "Java",
    likes: 42100,
    comments: 1240,
    audio: "Original Sound • Java Developer Suffering",
    description: "Why does missing one semicolon break 400 lines of code?! 😭 In Java it won't even compile! #javameme #codinglife #programming",
    ai_inferred_topic: "Compiler Lexical Analysis, AST Trees & Bytecode Verification",
    ai_bridge_topic: "How Compilers Parse Code: Lexing, AST Trees & Error Recovery",
    difficulty: "Beginner",
    simulation_type: "java_ast",
    prerequisites: ["Tokens vs Grammar", "Syntax Trees", "Compilation Pipeline"],
    challenge: "Write a mini regex tokenizer in Python to scan and report missing statement terminators."
  },
  {
    id: "ig_02",
    title: "M3 Max MacBook Pro vs RTX 4080 Laptop",
    creator: "@hardware_unboxed",
    avatar: "💻",
    category: "Hardware",
    likes: 89400,
    comments: 3120,
    audio: "M3 Max vs NVIDIA RTX 4080 • Benchmark Score",
    description: "Apple's 800 GB/s Unified Memory bus runs 70B LLMs at 30W while the 4080 laptop draws 175W! #m3max #nvidia #hardware #gpu",
    ai_inferred_topic: "Unified Memory Bus Architecture & PCIe Latency Bottlenecks",
    ai_bridge_topic: "Silicon Architecture: Unified RAM (UMA) vs Discrete PCIe Buses",
    difficulty: "Advanced",
    simulation_type: "arm_x86",
    prerequisites: ["Memory Bandwidth vs Latency", "PCIe Bus Lanes", "Thermal Throttling"],
    challenge: "Calculate total memory transfer time for 24GB weights across PCIe 4.0 x16 vs Apple UMA."
  },
  {
    id: "ig_03",
    title: "Mixture-of-Experts (MoE) in 30 Seconds",
    creator: "@ai_breakthroughs",
    avatar: "🧠",
    category: "AI",
    likes: 125000,
    comments: 4890,
    audio: "Trending AI Audio • Neural Network Beats",
    description: "How Mixtral 8x7B gets GPT-4 performance with only 12B active parameters per token! #ai #machinelearning #transformers #deeplearning",
    ai_inferred_topic: "Sparse Gating Routers, Top-k Activation & FLOP Reduction",
    ai_bridge_topic: "Under the Hood of MoE: Sparse Gating, Load Balancing & VRAM Sharding",
    difficulty: "Advanced",
    simulation_type: "moe",
    prerequisites: ["Dense FFNs", "Softmax Gating", "GPU VRAM Allocation"],
    challenge: "Implement top-2 expert routing algorithm with auxiliary load-balancing loss."
  },
  {
    id: "ig_04",
    title: "Raft Consensus & Leader Election Explained",
    creator: "@systems_guru",
    avatar: "🏗️",
    category: "HLD",
    likes: 63200,
    comments: 1840,
    audio: "Distributed Beats • Heartbeat Timeout",
    description: "What happens when your Kafka or Kubernetes etcd cluster leader dies? Split-brain prevented! #systemdesign #distributed #cloud #backend",
    ai_inferred_topic: "Distributed Consensus, Heartbeat Timers & Split-Brain Prevention",
    ai_bridge_topic: "Distributed Systems: Raft State Machine Replication & Quorums",
    difficulty: "Advanced",
    simulation_type: "raft",
    prerequisites: ["CAP Theorem", "Quorum Math", "Leader Heartbeats"],
    challenge: "Simulate a 5-node election term timeout with network partition drops."
  },
  {
    id: "ig_05",
    title: "Invert Binary Tree Speedrun in C++",
    creator: "@algo_master",
    avatar: "⚡",
    category: "DSA",
    likes: 71500,
    comments: 2430,
    audio: "Synthwave Coding • Fast Algorithms",
    description: "Max Howell got rejected by Google for this, but here is how recursion and pointer swapping work in L1 cache! #algorithms #datastructures #leetcode #coding",
    ai_inferred_topic: "Pointer Swapping, Call Stack Memory & Cache Locality",
    ai_bridge_topic: "Tree Inversion: Recursive Call Stacks & L1 Cache Performance",
    difficulty: "Intermediate",
    simulation_type: "tree",
    prerequisites: ["Pointers", "Recursion", "L1/L2 Cache Lines"],
    challenge: "Write iterative binary tree inversion using an explicit pointer stack in C++."
  },
  {
    id: "ig_06",
    title: "Docker Containers vs Virtual Machines in 15s",
    creator: "@cloud_architect",
    avatar: "🐳",
    category: "HLD",
    likes: 94200,
    comments: 3100,
    audio: "Tech Lo-Fi • Container Beats",
    description: "Containers aren't mini VMs! They are just Linux cgroups, namespaces, and chroot! 🐧 #docker #devops #kubernetes #linux",
    ai_inferred_topic: "Linux Kernel cgroups, Namespaces & iptables NAT Bridging",
    ai_bridge_topic: "How Containers Actually Work: Linux Kernel cgroups & Namespaces",
    difficulty: "Intermediate",
    simulation_type: "docker",
    prerequisites: ["Linux Kernel", "Process Isolation", "Network Bridges"],
    challenge: "Create process namespace isolation with Python unshare syscall."
  },
  {
    id: "ig_07",
    title: "TLS 1.3 Handshake Zero-RTT Cryptography",
    creator: "@infosec_daily",
    avatar: "🛡️",
    category: "Cybersecurity",
    likes: 58900,
    comments: 1420,
    audio: "Cyberpunk Hacker • Encryption Pulse",
    description: "How HTTPS connects in 1 round trip with Diffie-Hellman ephemeral keys! #cybersecurity #crypto #https #networking",
    ai_inferred_topic: "Ephemeral Diffie-Hellman Key Exchange & AES-256-GCM Tunneling",
    ai_bridge_topic: "Zero-RTT Handshakes: TLS 1.3 Cryptography & Elliptic Curves",
    difficulty: "Advanced",
    simulation_type: "tls",
    prerequisites: ["Asymmetric Crypto", "Diffie-Hellman", "AES-GCM"],
    challenge: "Inspect TLS 1.3 ClientHello cipher suites with Python ssl socket."
  },
  {
    id: "ig_08",
    title: "Database Indexing: B-Trees vs LSM Trees",
    creator: "@db_internals",
    avatar: "🗄️",
    category: "HLD",
    likes: 67800,
    comments: 1980,
    audio: "Database Beats • RocksDB IOPS",
    description: "Postgres uses B+ Trees for fast reads, but Cassandra & RocksDB use LSM Trees for fast writes! #database #sql #systemdesign",
    ai_inferred_topic: "B+ Tree Fanout vs Sequential Write Amplification in LSM Trees",
    ai_bridge_topic: "Database Storage Engines: B+ Trees vs Log-Structured Merge Trees",
    difficulty: "Advanced",
    simulation_type: "moe",
    prerequisites: ["Disk I/O", "Sequential vs Random Access", "Compaction"],
    challenge: "Build a memtable + SSTable flush engine in 50 lines of Python."
  }
];

function initInstaReelsShowcase() {
  setupInstaEventListeners();
  renderInstaFilterCounts();
  renderInstaReelsGrid();
  loadActiveInstaReel(0);
}

function setupInstaEventListeners() {
  if (instaFilterBar) {
    const chips = instaFilterBar.querySelectorAll('.insta-filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        playSound('click');
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentInstaFilter = chip.getAttribute('data-filter');
        renderInstaReelsGrid();
      });
    });
  }

  if (btnInstaLike) {
    btnInstaLike.addEventListener('click', () => {
      handleInstaLikeToggle();
    });
  }

  if (btnInstaNextReel) {
    btnInstaNextReel.addEventListener('click', () => {
      playSound('click');
      const filtered = getFilteredInstaReels();
      if (filtered.length === 0) return;
      activeInstaReelIndex = (activeInstaReelIndex + 1) % filtered.length;
      loadActiveInstaReel(activeInstaReelIndex);
    });
  }

  if (btnLaunchInstaAiBridge) {
    btnLaunchInstaAiBridge.addEventListener('click', () => {
      const filtered = getFilteredInstaReels();
      const reel = filtered[activeInstaReelIndex] || INSTA_REELS_CATALOG[0];
      launchDeepDiveFromInsta(reel);
    });
  }

  if (btnIgFollow) {
    btnIgFollow.addEventListener('click', () => {
      playSound('inject');
      btnIgFollow.textContent = btnIgFollow.textContent === 'Follow' ? 'Following' : 'Follow';
      btnIgFollow.style.background = btnIgFollow.textContent === 'Following' ? 'rgba(255,255,255,0.1)' : '#0095f6';
      showTopNotification('Following tech creator on Instagram!', '✨', 'INSTAGRAM', 2000);
    });
  }

  if (btnInstaBookmark) {
    btnInstaBookmark.addEventListener('click', () => {
      playSound('click');
      const isSaved = instaSaveIcon.textContent === '🔖';
      instaSaveIcon.textContent = isSaved ? '📑' : '🔖';
      showTopNotification(isSaved ? 'Saved to Instagram Collections' : 'Removed from Saved', '🔖', 'INSTAGRAM SAVE', 2000);
    });
  }

  if (btnInstaShare) {
    btnInstaShare.addEventListener('click', () => {
      playSound('click');
      navigator.clipboard.writeText(window.location.href);
      showTopNotification('Copied Instagram Reel link to clipboard!', '🔗', 'SHARED', 2000);
    });
  }

  if (btnInstaComment) {
    btnInstaComment.addEventListener('click', () => {
      playSound('click');
      showToast('Opening Instagram real-time comments stream...', '💬');
    });
  }

  // AI Suggest Next Reel Button
  const btnInstaAiSuggest = document.getElementById('btnInstaAiSuggest');
  if (btnInstaAiSuggest) {
    btnInstaAiSuggest.addEventListener('click', suggestNextInstagramReel);
  }

  // Double-tap on canvas to trigger like
  if (instaReelCanvas) {
    let lastTap = 0;
    instaReelCanvas.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < 300) {
        handleInstaDoubleTap();
      }
      lastTap = now;
    });
  }

  // Natural Scroll & Swipe to Change Instagram Reels (Mouse Wheel & Touch)
  const instaPhonePlayer = document.getElementById('instaPhonePlayer');
  let lastInstaWheelTime = 0;
  if (instaPhonePlayer) {
    instaPhonePlayer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastInstaWheelTime < 380) return;
      if (Math.abs(e.deltaY) < 18) return;

      lastInstaWheelTime = now;
      const filtered = getFilteredInstaReels();
      if (filtered.length === 0) return;

      playSound('swipe');
      triggerReelSlideAnimation(e.deltaY > 0 ? 'up' : 'down', instaPhonePlayer);
      if (e.deltaY > 0) {
        activeInstaReelIndex = (activeInstaReelIndex + 1) % filtered.length;
      } else {
        activeInstaReelIndex = (activeInstaReelIndex - 1 + filtered.length) % filtered.length;
      }
      loadActiveInstaReel(activeInstaReelIndex);
      renderInstaReelsGrid();
    }, { passive: false });

    let instaTouchStartY = 0;
    instaPhonePlayer.addEventListener('touchstart', (e) => {
      instaTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    instaPhonePlayer.addEventListener('touchend', (e) => {
      const instaTouchEndY = e.changedTouches[0].clientY;
      const diffY = instaTouchStartY - instaTouchEndY;
      if (Math.abs(diffY) > 40) {
        const filtered = getFilteredInstaReels();
        if (filtered.length === 0) return;
        playSound('swipe');
        triggerReelSlideAnimation(diffY > 0 ? 'up' : 'down', instaPhonePlayer);
        if (diffY > 0) {
          activeInstaReelIndex = (activeInstaReelIndex + 1) % filtered.length;
        } else {
          activeInstaReelIndex = (activeInstaReelIndex - 1 + filtered.length) % filtered.length;
        }
        loadActiveInstaReel(activeInstaReelIndex);
        renderInstaReelsGrid();
      }
    }, { passive: true });
  }
}

async function suggestNextInstagramReel() {
  playSound('inject');
  const btn = document.getElementById('btnInstaAiSuggest');
  const reasoningText = document.getElementById('instaAiAgentReasoning');
  if (btn) btn.innerHTML = '<span>⏳ AI Reasoning...</span>';

  try {
    const likedIds = (instagramProfile?.liked_reels || []).map(r => r.reel_id);
    const likedCats = (instagramProfile?.liked_reels || []).map(r => r.category);
    const currentReel = getFilteredInstaReels()[activeInstaReelIndex] || INSTA_REELS_CATALOG[0];

    const res = await fetch('/api/instagram/suggest-next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        liked_reel_ids: likedIds,
        liked_categories: likedCats.length > 0 ? likedCats : [currentReel.category],
        current_reel_id: currentReel.id
      })
    });

    const data = await res.json();
    if (data.status === 'success' && data.suggested_reel) {
      const suggested = data.suggested_reel;
      if (reasoningText) {
        reasoningText.innerHTML = `<strong>💡 AI Recommendation:</strong> ${escapeHtml(data.ai_reasoning)}`;
      }

      // Switch filter to all if needed
      if (currentInstaFilter !== 'all') {
        const allChip = instaFilterBar?.querySelector('.insta-filter-chip[data-filter="all"]');
        if (allChip) allChip.click();
      }

      // Find index in catalog
      const targetIdx = INSTA_REELS_CATALOG.findIndex(r => r.id === suggested.id);
      if (targetIdx !== -1) {
        activeInstaReelIndex = targetIdx;
        loadActiveInstaReel(targetIdx);
        renderInstaReelsGrid();
      }

      showTopNotification(`🤖 AI Agent: Suggested "${suggested.title}"`, '✨', 'AI REEL AGENT', 3500);
    }
  } catch (e) {
    console.error('AI Suggestion error:', e);
    showTopNotification('AI Agent suggestion completed', '🤖', 'INSTAGRAM AGENT', 2000);
  } finally {
    if (btn) btn.innerHTML = '<span>✨ AI Suggest Next Reel</span>';
  }
}

function getFilteredInstaReels() {
  const likedReelIds = new Set((instagramProfile?.liked_reels || []).map(r => r.reel_id));
  if (currentInstaFilter === 'all') {
    return INSTA_REELS_CATALOG;
  } else if (currentInstaFilter === 'liked') {
    return INSTA_REELS_CATALOG.filter(r => likedReelIds.has(r.id) || (instagramProfile?.liked_reels || []).some(l => l.title === r.title));
  } else {
    return INSTA_REELS_CATALOG.filter(r => r.category.toLowerCase() === currentInstaFilter.toLowerCase());
  }
}

function renderInstaFilterCounts() {
  const likedCount = (instagramProfile?.liked_reels || []).length;
  if (instaLikedCountFilter) instaLikedCountFilter.textContent = likedCount;
  if (igHeroStatusBadge) {
    if (instagramProfile && instagramProfile.connected) {
      igHeroStatusBadge.textContent = `Synced to @${instagramProfile.username} (${likedCount} Liked)`;
    } else {
      igHeroStatusBadge.textContent = 'Guest Mode • Connect to Sync';
    }
  }
}

function renderInstaReelsGrid() {
  if (!instaReelsGrid) return;
  const filtered = getFilteredInstaReels();
  if (instaGalleryTotal) instaGalleryTotal.textContent = filtered.length;

  if (filtered.length === 0) {
    instaReelsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px;">
        <div class="empty-icon">📸</div>
        <h4>No Reels In This Category</h4>
        <p>Like reels in the feed using the ❤️ button or select 'All Tech Reels' to explore more.</p>
      </div>
    `;
    return;
  }

  instaReelsGrid.innerHTML = '';
  filtered.forEach((reel, idx) => {
    const card = document.createElement('div');
    card.className = `insta-reel-card ${idx === activeInstaReelIndex ? 'active-card' : ''}`;
    card.innerHTML = `
      <div>
        <div class="irc-top">
          <div class="irc-creator">
            <span>${reel.avatar}</span>
            <span>${escapeHtml(reel.creator)}</span>
            <span class="ig-verified">✓</span>
          </div>
          <span class="badge" style="font-size: 0.65rem; background: rgba(225, 48, 108, 0.15); color: #f43f5e; border: 1px solid rgba(225, 48, 108, 0.3);">${escapeHtml(reel.category)}</span>
        </div>
        <div class="irc-title" style="margin-top: 8px;">${escapeHtml(reel.title)}</div>
        <div class="irc-desc" style="margin-top: 4px;">${escapeHtml(reel.description)}</div>
      </div>
      <div class="irc-bottom">
        <div class="irc-stats">
          <span>❤️ ${(reel.likes / 1000).toFixed(1)}k</span>
          <span>💬 ${(reel.comments / 1000).toFixed(1)}k</span>
        </div>
        <button class="btn btn-ghost btn-sm" style="font-size: 0.72rem; padding: 3px 8px; color: #a855f7;">
          ▶️ Play Reel
        </button>
      </div>
    `;

    card.addEventListener('click', () => {
      playSound('click');
      activeInstaReelIndex = idx;
      loadActiveInstaReel(idx);
      document.querySelectorAll('.insta-reel-card').forEach(c => c.classList.remove('active-card'));
      card.classList.add('active-card');
    });

    instaReelsGrid.appendChild(card);
  });
}

function loadActiveInstaReel(index) {
  const filtered = getFilteredInstaReels();
  const reel = filtered[index] || INSTA_REELS_CATALOG[0];
  if (!reel) return;

  if (instaPlayerAvatar) instaPlayerAvatar.textContent = reel.avatar || '☕';
  if (instaPlayerCreator) instaPlayerCreator.textContent = reel.creator;
  if (instaPlayerAudio) instaPlayerAudio.textContent = reel.audio;
  if (instaPlayerTitle) instaPlayerTitle.textContent = reel.title;
  if (instaPlayerDesc) instaPlayerDesc.textContent = reel.description;
  if (instaLikeCount) instaLikeCount.textContent = formatCompactNumber(reel.likes);
  if (instaAiBridgePill) {
    instaAiBridgePill.innerHTML = `<span>🧠 AI Bridge: ${escapeHtml(reel.ai_bridge_topic)}</span>`;
  }

  // Check if liked in profile
  const isLiked = (instagramProfile?.liked_reels || []).some(r => r.reel_id === reel.id || r.title === reel.title);
  if (instaLikeIcon) instaLikeIcon.textContent = isLiked ? '❤️' : '🤍';

  // Start animated canvas simulation
  startInstaCanvasSimulation(reel);
}

function handleInstaLikeToggle() {
  const filtered = getFilteredInstaReels();
  const reel = filtered[activeInstaReelIndex] || INSTA_REELS_CATALOG[0];
  if (!reel) return;

  playSound('like');
  const isCurrentlyLiked = instaLikeIcon.textContent === '❤️';
  if (!isCurrentlyLiked) {
    instaLikeIcon.textContent = '❤️';
    reel.likes += 1;
    instaLikeCount.textContent = formatCompactNumber(reel.likes);
    spawnInstaHeartBurst();
    syncInstagramLikeEvent(reel);
  } else {
    instaLikeIcon.textContent = '🤍';
    reel.likes -= 1;
    instaLikeCount.textContent = formatCompactNumber(reel.likes);
  }
}

function handleInstaDoubleTap() {
  const filtered = getFilteredInstaReels();
  const reel = filtered[activeInstaReelIndex] || INSTA_REELS_CATALOG[0];
  if (!reel) return;

  playSound('like');
  instaLikeIcon.textContent = '❤️';
  spawnInstaHeartBurst();
  syncInstagramLikeEvent(reel);
}

function spawnInstaHeartBurst() {
  if (!instaHeartOverlay) return;
  const heart = document.createElement('div');
  heart.className = 'insta-burst-heart';
  heart.innerHTML = '❤️';
  heart.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 5rem;
    pointer-events: none;
    z-index: 50;
    filter: drop-shadow(0 0 20px rgba(225, 48, 108, 0.9));
    animation: instaHeartPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  `;
  instaHeartOverlay.appendChild(heart);
  setTimeout(() => heart.remove(), 800);
}

function startInstaCanvasSimulation(reel) {
  if (!instaReelCanvas) return;
  const ctx = instaReelCanvas.getContext('2d');
  if (!ctx) return;

  stopInstaCanvasSimulation();
  let sec = 0;
  const targetReel = reel || INSTA_REELS_CATALOG[0];
  const veoMockData = {
    concept_title: targetReel.title,
    title: targetReel.title,
    category: targetReel.category,
    summary: targetReel.description,
    description: targetReel.description
  };

  function loop() {
    sec += 0.04;
    renderVeoSimulation(ctx, instaReelCanvas, sec, veoMockData);
    instaCanvasAnimId = requestAnimationFrame(loop);
  }

  instaCanvasAnimId = requestAnimationFrame(loop);
}

function stopInstaCanvasSimulation() {
  if (instaCanvasAnimId) {
    cancelAnimationFrame(instaCanvasAnimId);
    instaCanvasAnimId = null;
  }
}

function launchDeepDiveFromInsta(reel) {
  playSound('inject');
  const dummyEval = {
    reel_id: reel.id,
    title: reel.title,
    category: reel.category,
    tone: 'Viral Reel',
    anti_hype_filter: true,
    confidence_score: 0.96,
    difficulty: reel.difficulty || 'Intermediate',
    inferred_intent: {
      primary_domain: reel.category,
      root_cs_discipline: reel.ai_inferred_topic,
      why: reel.description
    },
    educational_bridge: {
      target_title: reel.ai_bridge_topic,
      hook: `Deep dive into ${reel.title} at real production scale.`,
      prerequisites: reel.prerequisites || ["Computer Science Fundamentals"],
      hands_on_challenge: reel.challenge || "Implement a production grade prototype.",
      industry_relevance: "Used extensively in high-scale tech engineering infrastructures."
    }
  };

  const dummyDeepDive = {
    deep_dive_title: reel.ai_bridge_topic,
    difficulty_level: reel.difficulty || 'Intermediate',
    scaffolding_challenge: reel.challenge || "Implement a production grade prototype.",
    architecture_overview: reel.ai_inferred_topic,
    foundational_prerequisites: reel.prerequisites || ["Computer Science Fundamentals"],
    industry_systems_relevance: "Core component of modern hyperscale software infrastructure."
  };

  openDeepDiveModal(dummyEval, dummyDeepDive);
}

document.addEventListener('DOMContentLoaded', init);
