// ACTIVE TAB STATE
    let activeTab = 'landing';

    // INITIALIZE & STYLE ACTIVE TAB
    function init() {
      switchTab('landing');
      renderComingSoonGrid();
      initHero3D();
      initScrollAnimations();
      setupDropZone();
    }

    // Same-origin: this file is served by the Express server alongside /api/*
    const API_BASE = '';

    // MOBILE NAV SHEET (hamburger menu)
    function toggleMobileMenu() {
      const isOpen = document.getElementById('mobile-menu-panel').classList.contains('open');
      if (isOpen) closeMobileMenu(); else openMobileMenu();
    }

    function openMobileMenu() {
      document.getElementById('mobile-menu-panel').classList.add('open');
      document.getElementById('mobile-menu-overlay').classList.add('open');
      document.getElementById('mobile-menu-btn').setAttribute('aria-expanded', 'true');
      document.body.classList.add('overflow-hidden');
    }

    function closeMobileMenu() {
      document.getElementById('mobile-menu-panel').classList.remove('open');
      document.getElementById('mobile-menu-overlay').classList.remove('open');
      document.getElementById('mobile-menu-btn').setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overflow-hidden');
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });

    // TAB NAVIGATION CONTROLLER
    // Uses a pure CSS approach: sets data-tab on <main>.
    // CSS rules in <style> handle show/hide — zero JS display juggling,
    // zero Tailwind !important conflicts.
    function switchTab(tabId) {
      activeTab = tabId;

      const main = document.getElementById('main-content');
      const tabs = {
        landing: document.getElementById('tab-landing-btn'),
        dashboard: document.getElementById('tab-dashboard-btn'),
        marketplace: document.getElementById('tab-marketplace-btn'),
      };

      // Flip the data attribute — CSS does the rest
      main.setAttribute('data-tab', tabId);

      const inactive = "px-2 sm:px-6 h-full flex items-center gap-1.5 border-b-2 border-transparent font-medium text-xs sm:text-sm text-offwhite-muted hover:text-offwhite transition-all";
      const active = "px-2 sm:px-6 h-full flex items-center gap-1.5 border-b-2 font-medium text-xs sm:text-sm transition-all tab-active";

      Object.entries(tabs).forEach(([id, btn]) => {
        const isDashboard = id === 'dashboard';
        btn.className = (id === tabId ? active : inactive) + (isDashboard ? ' relative' : '');
      });

      if (tabId === 'marketplace') loadMarketplace();

      window.scrollTo(0, 0);
    }

    // WAITLIST SIGNUP HANDLER
    function handleWaitlistSubmit(event) {
      event.preventDefault();
      const emailInput = document.getElementById('waitlist-email');
      const successBlock = document.getElementById('waitlist-success');
      const waitlistForm = document.getElementById('waitlist-form');

      if (emailInput.value) {
        waitlistForm.classList.add('hidden');
        successBlock.classList.remove('hidden');
        showToast('Successfully joined waitlist!', 'success');
      }
    }

    // FILE UPLOAD
    function triggerFileInput() {
      document.getElementById('file-uploader').click();
    }

    function handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) runScan(file);
    }

    // REAL DRAG & DROP — the drop-zone visually implied this from the start
    // but had no event listeners wired up; clicking anywhere on it now also
    // opens the file picker (not just the small "Browse Files" button).
    function setupDropZone() {
      const zone = document.getElementById('drop-zone');
      if (!zone) return;

      zone.addEventListener('click', () => triggerFileInput());

      ['dragenter', 'dragover'].forEach((evt) => {
        zone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          zone.classList.add('border-mint/60', 'bg-white/60');
        });
      });

      ['dragleave', 'dragend'].forEach((evt) => {
        zone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          zone.classList.remove('border-mint/60', 'bg-white/60');
        });
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('border-mint/60', 'bg-white/60');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) runScan(file);
        else if (file) showToast('Please drop an image file', 'error');
      });
    }

    // DEMO FABRIC — uses the real bundled sample photo through the real AI pipeline
    async function runDemoFabric() {
      const lengthInput = document.getElementById('input-length');
      const widthInput = document.getElementById('input-width');
      const weightInput = document.getElementById('input-weight');
      if (!lengthInput.value) lengthInput.value = '0.60';
      if (!widthInput.value) widthInput.value = '0.50';
      if (!weightInput.value) weightInput.value = '0.40';

      const res = await fetch('img.jpg');
      const blob = await res.blob();
      const file = new File([blob], 'sample-ankara.jpg', { type: blob.type || 'image/jpeg' });
      runScan(file);
    }

    // Per-scan and per-card state, so multiple scans/cards don't clobber each other
    let scanCounter = 0;
    const scanStore = {};
    let cardCounter = 0;
    const productStore = {};

    // Rotates fun status text in an element while a real API call is in
    // flight, so waits (Claude vision ~3-8s, fal.ai render ~10-30s) don't
    // feel like a frozen/broken UI. Returns a stop function.
    function cycleMessages(elId, messages, intervalMs = 2200) {
      const el = document.getElementById(elId);
      if (!el) return () => {};
      let i = 0;
      el.textContent = messages[0];
      const timer = setInterval(() => {
        i = (i + 1) % messages.length;
        el.textContent = messages[i];
      }, intervalMs);
      return () => clearInterval(timer);
    }

    const SCAN_STATUS_MESSAGES = [
      'Reading weave patterns & calculating cutting shapes',
      'Checking fiber type and color profile',
      'Matching against zero-waste product ideas',
      'Estimating market value in Naira',
    ];

    const GENERATE_STATUS_MESSAGES = [
      'Mixing dyes to match your fabric…',
      'Sketching the concept…',
      'Rendering studio lighting…',
      'Adding finishing touches…',
    ];

    // REAL SCAN: uploads to /api/scan, which calls Claude's vision API server-side
    async function runScan(file) {
      const idleView = document.getElementById('upload-idle-view');
      const scanView = document.getElementById('upload-scanning-view');
      const previewBox = document.getElementById('fabric-scan-preview');

      const previewUrl = URL.createObjectURL(file);
      previewBox.style.backgroundSize = 'cover';
      previewBox.style.backgroundPosition = 'center';
      previewBox.style.backgroundImage = `url(${previewUrl})`;

      idleView.classList.add('hidden');
      scanView.classList.remove('hidden');
      showToast('Fabric scan sequence initiated', 'info');
      const stopScanMessages = cycleMessages('scan-status-text', SCAN_STATUS_MESSAGES);

      const length = document.getElementById('input-length').value;
      const width = document.getElementById('input-width').value;
      const weightKg = document.getElementById('input-weight').value;
      const preferredSize = document.getElementById('input-size').value;
      const dimensions = (length && width) ? `${length}m x ${width}m` : '';

      const formData = new FormData();
      formData.append('image', file);
      if (dimensions) formData.append('dimensions', dimensions);
      if (weightKg) formData.append('weightKg', weightKg);
      if (preferredSize) formData.append('preferredSize', preferredSize);

      try {
        const res = await fetch(`${API_BASE}/api/scan`, { method: 'POST', body: formData });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          if (errBody.code === 'INSUFFICIENT_CREDIT') {
            showToast('AI credit has run out — please contact the admin to top up, then try again.', 'error');
            return;
          }
          if (errBody.code === 'AI_UNAVAILABLE') {
            showToast('AI service is unavailable right now — please contact the admin.', 'error');
            return;
          }
          throw new Error(errBody.detail || errBody.error || `Scan failed (${res.status})`);
        }
        const result = await res.json();

        scanCounter += 1;
        const scanId = `scan-${scanCounter}`;
        scanStore[scanId] = { base64: result.sourceImageBase64, mediaType: result.sourceMediaType };

        renderScanSummary(result);
        (result.suggestedProducts || []).forEach((product) => addProductCard(product, scanId, result.materialType, preferredSize));
        incrementMetrics(weightKg, (result.suggestedProducts || []).length);
        showToast('Analysis complete — real AI suggestions added', 'success');
      } catch (err) {
        console.error(err);
        showToast(`Scan failed: ${err.message}`, 'error');
      } finally {
        stopScanMessages();
        scanView.classList.add('hidden');
        idleView.classList.remove('hidden');
      }
    }

    function renderScanSummary(result) {
      document.getElementById('scan-summary').classList.remove('hidden');
      document.getElementById('scan-material').textContent = result.materialType || '—';
      document.getElementById('scan-color').textContent = result.colorProfile || '—';
      document.getElementById('scan-condition').textContent = result.condition || '—';
      document.getElementById('scan-confidence').textContent = result.confidencePercent ? `${result.confidencePercent}%` : '—';
    }

    // RENDER A SUGGESTION CARD FROM REAL AI OUTPUT (Naira formatting)
    function addProductCard(product, scanId, materialType, preferredSize) {
      document.getElementById('gallery-empty')?.remove();

      cardCounter += 1;
      const cardId = `card-${cardCounter}`;
      productStore[cardId] = {
        scanId,
        name: product.name,
        description: product.description,
        valueNaira: product.estimatedValueNaira,
        materialType,
        preferredSize: preferredSize || null,
      };

      const gallery = document.getElementById('gallery-feed');
      const card = document.createElement('div');
      card.id = cardId;
      card.className = "glass-panel p-5 rounded-2xl hover:border-mint/20 transition-all flex flex-col justify-between gap-4 animate-fade-in relative group";
      card.innerHTML = `
          <div id="${cardId}-media" class="w-full h-36 rounded-xl bg-[#3D5A42]/5 border border-black/5 flex items-center justify-center shrink-0 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent"></div>
            <svg class="w-14 h-14 text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="absolute bottom-1.5 left-1.5 bg-[#1A1816]/80 backdrop-blur-sm text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/10">
              ${product.yieldPercent != null ? product.yieldPercent + '% YIELD' : 'AI MATCH'}
            </div>
          </div>
          <div class="flex-grow flex flex-col justify-between space-y-3">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-mint font-bold uppercase tracking-wider font-mono font-semibold">Matched Scrap: ${(materialType || 'FABRIC').toUpperCase()}</span>
              </div>
              <h3 class="font-display font-bold text-base text-offwhite mt-1">${product.name}</h3>
              <p class="text-xs text-offwhite-muted leading-relaxed mt-1">${product.description || ''}</p>
            </div>
            <div class="flex items-center justify-between border-t border-black/5 pt-3 mt-auto">
              <span class="text-xs font-mono font-bold text-mint">₦${Number(product.estimatedValueNaira || 0).toLocaleString()} EST. VALUE</span>
              <div id="${cardId}-actions" class="flex gap-2">
                <button id="${cardId}-gen" onclick="generateConcept('${cardId}')" class="sc-btn sc-btn-outline sc-btn-sm">
                  Generate Image
                </button>
                <button onclick="listMarketplace('${cardId}')" class="sc-btn sc-btn-primary sc-btn-sm">
                  List & Sell
                </button>
              </div>
            </div>
          </div>
        `;

      gallery.prepend(card);

      const countEl = document.getElementById('gallery-count');
      countEl.textContent = parseInt(countEl.textContent, 10) + 1;
    }

    // REAL CONCEPT IMAGE: sends the scrap photo + chosen product to /api/generate (fal.ai).
    // Gated by admin approval (see /api/generate-access) since fal.ai credit is limited —
    // only one image is generated per click, only for the one suggestion the user picked.
    async function generateConcept(cardId) {
      const product = productStore[cardId];
      const scan = scanStore[product.scanId];
      const btn = document.getElementById(`${cardId}-gen`);
      const media = document.getElementById(`${cardId}-media`);
      if (!product || !scan) return;

      btn.disabled = true;
      btn.textContent = 'Generating…';
      showToast('Rendering AI concept image via fal.ai…', 'info');

      const originalMediaHtml = media.innerHTML;
      media.innerHTML = `
        <div class="gen-shimmer absolute inset-0 bg-gradient-to-br from-mint/15 via-white/30 to-mint/15 flex flex-col items-center justify-center gap-2 text-center px-4">
          <svg class="animate-spin h-6 w-6 text-mint" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span id="${cardId}-gen-status" class="text-[10px] text-mint font-mono font-semibold"></span>
        </div>
      `;
      const stopGenMessages = cycleMessages(`${cardId}-gen-status`, GENERATE_STATUS_MESSAGES);

      const wornByModel = /dress|top|jacket|gown|bandana|hat|scarf|wrap|shirt/i.test(product.name);

      try {
        const res = await fetch(`${API_BASE}/api/generate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            imageBase64: scan.base64,
            mediaType: scan.mediaType,
            productName: product.name,
            productDescription: product.description,
            wornByModel,
            sizeHint: product.preferredSize || null,
          }),
        });
        if (res.status === 403) {
          const errBody = await res.json().catch(() => ({}));
          if (errBody.needsAccess) {
            media.innerHTML = originalMediaHtml;
            return renderAccessRequestPrompt(cardId);
          }
        }
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          if (errBody.code === 'INSUFFICIENT_CREDIT') {
            btn.disabled = false;
            btn.textContent = 'Generate Image';
            media.innerHTML = originalMediaHtml;
            showToast('AI credit has run out — please contact the admin to top up, then try again.', 'error');
            return;
          }
          if (errBody.code === 'AI_UNAVAILABLE') {
            btn.disabled = false;
            btn.textContent = 'Generate Image';
            media.innerHTML = originalMediaHtml;
            showToast('AI service is unavailable right now — please contact the admin.', 'error');
            return;
          }
          throw new Error(errBody.detail || errBody.error || `Generate failed (${res.status})`);
        }
        const { imageUrl } = await res.json();
        product.imageUrl = imageUrl;
        media.innerHTML = `<img src="${imageUrl}" class="absolute inset-0 w-full h-full object-cover" alt="${product.name}">`;
        btn.textContent = '✓ Image Ready';
        showToast('Concept image generated', 'success');
      } catch (err) {
        console.error(err);
        btn.disabled = false;
        btn.textContent = 'Generate Image';
        media.innerHTML = originalMediaHtml;
        showToast(`Generation failed: ${err.message}`, 'error');
      } finally {
        stopGenMessages();
      }
    }

    // ACCESS REQUEST PROMPT — shown inline on a card when /api/generate returns
    // 403 needsAccess. fal.ai credit is limited, so the admin approves who can
    // generate images rather than leaving it open to every visitor.
    function renderAccessRequestPrompt(cardId) {
      const actions = document.getElementById(`${cardId}-actions`);
      if (!actions) return;

      actions.innerHTML = `
        <div class="flex flex-col gap-1.5 w-full">
          <p class="text-[10px] text-offwhite-muted">Image generation needs admin approval (limited AI credit).</p>
          <div class="flex gap-1.5">
            <input id="${cardId}-access-name" placeholder="Your name" class="sc-input px-2.5 py-1.5 text-xs flex-grow">
            <button onclick="requestGenerateAccess('${cardId}')" class="sc-btn sc-btn-primary sc-btn-sm shrink-0">Request</button>
          </div>
        </div>
      `;
    }

    async function requestGenerateAccess(cardId) {
      const input = document.getElementById(`${cardId}-access-name`);
      const name = input.value.trim();
      if (!name) return showToast('Enter your name first', 'error');

      await fetch(`${API_BASE}/api/generate-access/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const actions = document.getElementById(`${cardId}-actions`);
      actions.innerHTML = `<p class="text-[11px] text-mint font-medium">Request sent — ask the admin to approve, then click Generate Image again.</p>
        <button onclick="restoreCardActions('${cardId}')" class="sc-btn sc-btn-outline sc-btn-sm">Try Again</button>`;
      showToast('Access request sent', 'success');
    }

    function restoreCardActions(cardId) {
      const product = productStore[cardId];
      const actions = document.getElementById(`${cardId}-actions`);
      if (!product || !actions) return;
      actions.innerHTML = `
        <button id="${cardId}-gen" onclick="generateConcept('${cardId}')" class="sc-btn sc-btn-outline sc-btn-sm">
          Generate Image
        </button>
        <button onclick="listMarketplace('${cardId}')" class="sc-btn sc-btn-primary sc-btn-sm">
          List & Sell
        </button>
      `;
    }

    // REAL LISTING: persists to /api/marketplace (in-memory store on the server)
    async function listMarketplace(cardId) {
      const product = productStore[cardId];
      if (!product) return;

      const length = document.getElementById('input-length').value;
      const width = document.getElementById('input-width').value;
      const weightKg = document.getElementById('input-weight').value;

      showToast(`Listing "${product.name}" on Circular Supply Board…`, 'info');

      try {
        const res = await fetch(`${API_BASE}/api/marketplace`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: product.name,
            materialType: product.materialType,
            dimensions: (length && width) ? `${length}m x ${width}m` : null,
            weightKg: weightKg ? Number(weightKg) : null,
            priceNaira: product.valueNaira,
            vendor: 'You',
            imageUrl: product.imageUrl || null,
          }),
        });
        if (!res.ok) throw new Error(`Listing failed (${res.status})`);
        const listing = await res.json();

        showToast(`Listed: "${listing.title}" for ₦${Number(listing.priceNaira).toLocaleString()}`, 'success');

        const revEl = document.getElementById('metric-revenue-qty');
        const currentRev = parseFloat(revEl.textContent.replace('₦', '').replace(/,/g, ''));
        revEl.textContent = '₦' + (currentRev + listing.priceNaira).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        if (activeTab === 'marketplace') loadMarketplace();
      } catch (err) {
        console.error(err);
        showToast(`Listing failed: ${err.message}`, 'error');
      }
    }

    // REAL MARKETPLACE BROWSE: GET /api/marketplace — the buyer-facing side
    async function loadMarketplace() {
      const grid = document.getElementById('marketplace-grid');
      grid.innerHTML = `<div class="col-span-2 lg:col-span-3 glass-panel p-8 rounded-2xl text-center"><p class="text-sm text-offwhite-muted">Loading listings…</p></div>`;

      try {
        const res = await fetch(`${API_BASE}/api/marketplace`);
        if (!res.ok) throw new Error(`Failed to load listings (${res.status})`);
        const listings = await res.json();
        renderMarketplaceGrid(listings);
      } catch (err) {
        console.error(err);
        grid.innerHTML = `<div class="col-span-2 lg:col-span-3 glass-panel p-8 rounded-2xl text-center"><p class="text-sm text-red-400">Couldn't load listings: ${err.message}</p></div>`;
      }
    }

    function renderMarketplaceGrid(listings) {
      const grid = document.getElementById('marketplace-grid');

      if (!listings.length) {
        grid.innerHTML = `<div class="col-span-2 lg:col-span-3 glass-panel p-8 rounded-2xl text-center"><p class="text-sm text-offwhite-muted">No listings yet — list something from the Creator Dashboard to see it here.</p></div>`;
        return;
      }

      grid.innerHTML = listings.map((item) => `
        <div class="glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div class="h-40 bg-black/10 ${item.imageUrl ? '' : 'flex items-center justify-center'}"
            style="${item.imageUrl ? `background-image:url(${item.imageUrl});background-size:cover;background-position:center;` : ''}">
            ${item.imageUrl ? '' : '<span class="text-[10px] text-offwhite-muted uppercase tracking-wider">No image generated</span>'}
          </div>
          <div class="p-4 flex flex-col gap-2 flex-grow">
            <h3 class="font-display font-bold text-sm text-offwhite">${item.title}</h3>
            <div class="flex flex-wrap gap-1.5 text-[10px] text-offwhite-muted">
              <span class="bg-mint/10 border border-mint/20 text-mint px-2 py-0.5 rounded-full font-semibold">${item.materialType}</span>
              ${item.dimensions ? `<span class="bg-black/5 px-2 py-0.5 rounded-full">${item.dimensions}</span>` : ''}
              ${item.weightKg ? `<span class="bg-black/5 px-2 py-0.5 rounded-full">${item.weightKg}kg</span>` : ''}
            </div>
            <div class="flex items-center justify-between mt-auto pt-2">
              <span class="font-display font-extrabold text-mint">₦${Number(item.priceNaira).toLocaleString()}</span>
              <span class="text-[10px] text-offwhite-muted">${item.vendor}</span>
            </div>
            <button disabled title="Coming soon — payments aren't wired up yet"
              class="sc-btn sc-btn-outline sc-btn-sm mt-2 w-full">
              Reserve (Coming Soon)
            </button>
          </div>
        </div>
      `).join('');
    }

    // UPDATE STATS COUNTER ACTION (driven by real weight input + real suggestion count)
    function incrementMetrics(weightKg, patternCount) {
      const scannedEl = document.getElementById('metric-scanned-qty');
      const patternsEl = document.getElementById('metric-patterns-qty');

      const oldWeight = parseFloat(scannedEl.textContent);
      const addWeight = weightKg ? parseFloat(weightKg) : 0.5;
      scannedEl.textContent = (oldWeight + addWeight).toFixed(1) + ' kg';

      const oldPatterns = parseInt(patternsEl.textContent, 10);
      patternsEl.textContent = (oldPatterns + patternCount) + ' Drafts';
    }

    // COMING SOON ROADMAP — from the business plan's future-feature list
    const comingSoonFeatures = [
      { name: 'AI Chat Assistant', desc: 'Ask "what can I make from these scraps?"' },
      { name: 'Voice AI Assistant', desc: 'Speak directly to the AI assistant' },
      { name: 'AI Pattern Generator', desc: 'Downloadable cutting patterns / DXF export' },
      { name: 'Advanced Analytics', desc: 'Revenue & waste-reduction reports' },
      { name: 'Supplier Verification', desc: 'Trusted-supplier badge' },
      { name: 'Mobile App', desc: 'Android & iOS access' },
      { name: 'Integrated Payments', desc: 'Pay and get paid inside the platform' },
      { name: 'Notifications', desc: 'New buyer requests & order updates' },
    ];

    function renderComingSoonGrid() {
      const grid = document.getElementById('coming-soon-grid');
      if (!grid) return;
      grid.innerHTML = comingSoonFeatures.map((f) => `
        <div class="glass-panel p-4 rounded-2xl opacity-70 hover:opacity-100 transition-opacity">
          <div class="w-9 h-9 rounded-lg bg-mint/10 border border-mint/20 flex items-center justify-center text-mint mb-3">
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h4 class="font-display font-bold text-sm text-offwhite">${f.name}</h4>
          <p class="text-[11px] text-offwhite-muted mt-1 leading-relaxed">${f.desc}</p>
          <span class="inline-block mt-3 text-[9px] uppercase font-bold tracking-wider text-mint bg-mint/10 border border-mint/20 px-2 py-0.5 rounded-full">Coming Soon</span>
        </div>
      `).join('');
    }

    // TOAST NOTIFICATIONS HELPER
    function showToast(message, type = 'info') {
      const wrapper = document.getElementById('toast-wrapper');

      const toast = document.createElement('div');
      toast.className = "flex items-center gap-3 glass-panel px-4 py-3 rounded-2xl border border-black/5 shadow-2xl translate-y-2 opacity-0 transition-all duration-300 pointer-events-auto min-w-[280px] max-w-sm";

      let iconColor = 'text-mint';
      let iconSvg = `<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

      if (type === 'info') {
        iconColor = 'text-blue-400';
        iconSvg = `<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
      } else if (type === 'error') {
        iconColor = 'text-red-400';
        iconSvg = `<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>`;
      }

      toast.innerHTML = `
          <div class="${iconColor}">
            ${iconSvg}
        </div>
          <div class="text-xs text-offwhite font-semibold flex-grow">${message}</div>
      `;

      wrapper.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      });

      setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, 3500);
    }

    // DECORATIVE 3D HERO BACKGROUND (Three.js) — purely visual, no app logic
    // depends on it. No-ops if the CDN script failed to load.
    function initHero3D() {
      const canvas = document.getElementById('hero-canvas');
      if (!canvas || !window.THREE) return;

      const section = canvas.parentElement;
      let width = section.clientWidth;
      let height = section.clientHeight;
      if (!width || !height) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.z = 6;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const outer = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2.3, 1),
        new THREE.MeshBasicMaterial({ color: 0x3d5a42, wireframe: true, transparent: true, opacity: 0.4 })
      );
      const inner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.3, 0),
        new THREE.MeshBasicMaterial({ color: 0x557a5c, wireframe: true, transparent: true, opacity: 0.3 })
      );
      scene.add(outer, inner);

      let frameId;
      function animate() {
        outer.rotation.x += 0.0015;
        outer.rotation.y += 0.0022;
        inner.rotation.x -= 0.0012;
        inner.rotation.y -= 0.0019;
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      }
      animate();

      window.addEventListener('resize', () => {
        width = section.clientWidth;
        height = section.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      });
    }

    // SCROLL-REVEAL ANIMATIONS (GSAP + ScrollTrigger) — purely visual.
    // No-ops if the CDN scripts failed to load.
    function initScrollAnimations() {
      if (!window.gsap || !window.ScrollTrigger) return;
      gsap.registerPlugin(ScrollTrigger);

      document.querySelectorAll('#landing-page-container > section').forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    }

    // RUN ON LOAD — use DOMContentLoaded so the function runs before
    // Tailwind CDN's deferred processing can interfere
    document.addEventListener('DOMContentLoaded', init);
