// ACTIVE TAB STATE
    let activeTab = 'landing';

    // INITIALIZE & STYLE ACTIVE TAB
    function init() {
      switchTab('landing');
      renderComingSoonGrid();
      initHero3D();
      initScrollAnimations();
      setupDropZone();
      refreshAuthUI();
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
        mydashboard: document.getElementById('tab-mydashboard-btn'),
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
      if (tabId === 'mydashboard') loadMyDashboard();

      window.scrollTo(0, 0);
    }

    // FABRIC EDUCATION — shown after scan for known Nigerian fabric types
    const FABRIC_LORE = {
      ankara: {
        label: "Ankara (African Wax Print)",
        origin: "West Africa",
        also: "Also called: Dutch Wax · African Print · Chitenge",
        description: "The most popular fabric in Nigeria — bold geometric and floral patterns, 100% cotton with a wax coating for that signature feel and sheen. Every occasion from owambe parties to everyday wear. Sold by the yard at Balogun, Yaba, and Oke-Arin markets.",
        marketValue: "₦1,500 – ₦5,000 / yard",
      },
      "aso-oke": {
        label: "Aso-Oke",
        origin: "Yoruba, Southwest Nigeria",
        also: "Also called: Aso Ofi · Hand-woven ceremonial cloth",
        description: "Hand-woven in narrow strips by Yoruba weavers and sewn together into fabric. The prestige cloth for Nigerian weddings, naming ceremonies, and chieftaincy titles. Three main types: Etu (blue/white), Sanyan (brown/beige), Alaari (red). You can tell real Aso-Oke by the slight rough texture and visible weft threads.",
        marketValue: "₦8,000 – ₦40,000 / yard",
      },
      adire: {
        label: "Adire",
        origin: "Yoruba (Abeokuta & Ibadan)",
        also: "Also called: Tie & Dye · Batik · Kampala",
        description: "Hand-made indigo resist-dye fabric by Yoruba women. Two main types: Adire Eleko (cassava starch resist, creates detailed patterns) and Adire Oniko (tied with raffia before dyeing). No two pieces are identical — the irregularity and imperfection IS the value. Rising fast in international fashion.",
        marketValue: "₦2,000 – ₦15,000 / yard",
      },
      kente: {
        label: "Kente",
        origin: "Ghana (widely worn across West Africa)",
        also: "Also called: Nwentoma · Strip-woven cloth",
        description: "Hand-woven silk and cotton strips in bright, intricate geometric patterns — each pattern has a name and meaning. Ghanaian in origin but deeply loved and worn at Nigerian ceremonies. Colors carry meaning: gold = royalty, green = growth, red = political strength, blue = peace.",
        marketValue: "₦15,000 – ₦80,000 / yard",
      },
      denim: {
        label: "Denim",
        origin: "Industrial / Global",
        also: "Also called: Jeans fabric · Jean material",
        description: "Heavy cotton twill weave, durable and colour-fast. In Nigerian fashion: huge demand for custom-fit jeans, Ankara-denim combination pieces, and streetwear. Scraps work excellently for patches, bag panels, and accessories. Buyers at Yaba market pay well for good-quality denim remnants.",
        marketValue: "₦1,200 – ₦4,000 / yard",
      },
      lace: {
        label: "Lace Fabric",
        origin: "Imported (Austria, Switzerland, France)",
        also: "Also called: Swiss lace · French lace · George lace",
        description: "Delicate net fabric with decorative patterns — a staple of Nigerian high fashion and formal wear. Quality ranges from affordable polyester lace to premium Swiss voile lace (₦80,000+ per yard). Even small lace scraps are valuable: sleeves, necklines, and overlays.",
        marketValue: "₦3,000 – ₦80,000 / yard",
      },
      george: {
        label: "George Fabric",
        origin: "Southeast Nigeria (Igbo traditional)",
        also: "Also called: Indian George · Italian George",
        description: "A heavy, richly-coloured fabric — the ceremonial fabric of Igbo people. Worn at traditional weddings, title ceremonies, and naming events. Usually comes with a complementary blouse fabric. Imported mainly from India and Italy; George 'wrappers' are status symbols, the quality visible in the weight and sheen.",
        marketValue: "₦12,000 – ₦120,000 / piece",
      },
      damask: {
        label: "Brocade / Guinea Brocade",
        origin: "West Africa (widely used across Nigeria)",
        also: "Also called: Shadda · Guinea · Damask",
        description: "A heavy woven fabric with a raised, self-coloured pattern — the go-to fabric for Nigerian aso-ebi (coordinated family wear at events). Available in hundreds of colours. Holds shape very well, making it excellent for structured garments like agbada, babariga, and formal dresses.",
        marketValue: "₦2,500 – ₦8,000 / yard",
      },
      hollandaise: {
        label: "Hollandaise",
        origin: "Netherlands / West Africa",
        also: "Also called: Hollandais · Premium wax print",
        description: "The premium cousin of Ankara — same wax-print tradition but made with better-quality cotton, richer colours, and softer feel. Made in the Netherlands and considered more prestigious than regular Ankara. You can tell it by the more vivid print on BOTH sides of the fabric (double-sided print).",
        marketValue: "₦4,000 – ₦15,000 / yard",
      },
      atiku: {
        label: "Atiku / Plain Silk Cotton",
        origin: "Northern Nigeria",
        also: "Also called: Senator fabric · Plain weave",
        description: "A lightweight off-white or cream plain-woven fabric popular for men's traditional wear — especially 'Senator' two-piece outfits (top + trousers) and babariga. Associated with Hausa-Fulani fashion. Easy to dye; often embroidered at the collar and cuffs with intricate aso-oke-style thread patterns.",
        marketValue: "₦1,800 – ₦6,000 / yard",
      },
      velvet: {
        label: "Velvet",
        origin: "Imported (used widely in Nigeria)",
        also: "Also called: Velvety cloth",
        description: "A soft, dense woven fabric with a distinctive cut-pile finish — used for high-end Nigerian traditional garments especially Yoruba gele (headwraps) and evening wear. Deep colours like burgundy, royal blue, and emerald are most popular. Even small velvet scraps are sought for gele-making.",
        marketValue: "₦3,500 – ₦12,000 / yard",
      },
      chiffon: {
        label: "Chiffon",
        origin: "Imported (widely used in Nigeria)",
        also: "Also called: Sheer fabric · Overlay fabric",
        description: "A lightweight, sheer woven fabric with a slightly rough texture — very popular for Nigerian evening wear, overlays on Ankara outfits, and flowing blouses. Often layered over satin or cotton for a premium look. Flows beautifully in photos and videos.",
        marketValue: "₦1,200 – ₦4,500 / yard",
      },
      satin: {
        label: "Satin",
        origin: "Imported (widely used in Nigeria)",
        also: "Also called: Charmeuse · Silk satin",
        description: "A smooth, glossy woven fabric with a luxurious sheen on one side. Used for bridal wear, evening gowns, and Ankara-satin combination pieces. Nigerian brides frequently use satin as lining for Aso-Oke and lace garments. Scraps are excellent for gele lining.",
        marketValue: "₦1,500 – ₦6,000 / yard",
      },
      cotton: {
        label: "Plain Cotton",
        origin: "Global / Industrial",
        also: "Also called: Cotton fabric · Plain weave cotton",
        description: "The most versatile base fabric. In Nigeria used for everyday wear, tailoring practice, children's clothing, and as base fabric under lace and embroidery. Breathable and easy to sew — ideal for tailors just starting out. Yoruba traders call plain cotton 'terilin' or 'poplin'.",
        marketValue: "₦600 – ₦2,000 / yard",
      },
    };

    function getFabricLore(materialType) {
      if (!materialType) return null;
      const m = materialType.toLowerCase();
      if (m.includes("ankara") || m.includes("wax print") || m.includes("african print") || m.includes("chitenge")) return FABRIC_LORE.ankara;
      if (m.includes("aso-oke") || m.includes("aso oke") || m.includes("asooke") || m.includes("aso ofi")) return FABRIC_LORE["aso-oke"];
      if (m.includes("adire") || m.includes("batik") || m.includes("kampala") || (m.includes("tie") && m.includes("dye"))) return FABRIC_LORE.adire;
      if (m.includes("kente") || m.includes("nwentoma")) return FABRIC_LORE.kente;
      if (m.includes("denim") || m.includes("jean")) return FABRIC_LORE.denim;
      if (m.includes("hollandaise") || m.includes("hollandais")) return FABRIC_LORE.hollandaise;
      if (m.includes("george")) return FABRIC_LORE.george;
      if (m.includes("brocade") || m.includes("guinea") || m.includes("damask") || m.includes("shadda")) return FABRIC_LORE.damask;
      if (m.includes("atiku") || m.includes("senator") || m.includes("babariga")) return FABRIC_LORE.atiku;
      if (m.includes("velvet")) return FABRIC_LORE.velvet;
      if (m.includes("chiffon") || m.includes("sheer")) return FABRIC_LORE.chiffon;
      if (m.includes("satin") || m.includes("charmeuse")) return FABRIC_LORE.satin;
      if (m.includes("lace") || m.includes("swiss lace") || m.includes("french lace")) return FABRIC_LORE.lace;
      if (m.includes("cotton") || m.includes("poplin") || m.includes("terilin")) return FABRIC_LORE.cotton;
      return null;
    }

    function renderFabricLore(materialType) {
      const card = document.getElementById('fabric-lore-card');
      const lore = getFabricLore(materialType);
      if (!lore) { card.classList.add('hidden'); return; }
      document.getElementById('lore-label').textContent = lore.label;
      document.getElementById('lore-origin').textContent = lore.origin;
      document.getElementById('lore-also').textContent = lore.also;
      document.getElementById('lore-description').textContent = lore.description;
      document.getElementById('lore-value').textContent = lore.marketValue;
      card.classList.remove('hidden');
    }

    // PRE-BAKED DEMO RESULT — shown immediately when a non-logged-in user
    // clicks "Sample Ankara". Real AI runs when they sign in.
    const DEMO_SCAN_RESULT = {
      materialType: "Ankara (African Wax Print)",
      colorProfile: "Bold geometric print — deep indigo, burnt orange, and ivory on a dark background",
      condition: "Excellent",
      confidencePercent: 96,
      colors: [
        { name: "Deep Indigo", hex: "#1E2E6B", role: "dominant" },
        { name: "Burnt Orange", hex: "#C75B1A", role: "accent" },
        { name: "Ivory White", hex: "#F4EACC", role: "background" },
        { name: "Forest Green", hex: "#3D5A42", role: "pattern" },
      ],
      suggestedProducts: [
        {
          name: "Ankara Wrap Dress",
          description: "A flattering A-line wrap dress with V-neckline and 3/4 sleeves. The bold geometric Ankara print makes this a standout piece for owambe parties and casual Fridays. Works for sizes S–XL with a standard adult scrap.",
          estimatedValueNaira: 45000,
          yieldPercent: 85,
        },
        {
          name: "Ankara Bucket Hat",
          description: "A structured bucket hat with a medium brim — very trending right now in Lagos streetwear. Quick to sew, high margin, and the geometric print makes it eye-catching.",
          estimatedValueNaira: 8500,
          yieldPercent: 92,
        },
        {
          name: "Reversible Tote Bag",
          description: "A spacious market tote (40cm × 35cm) with reinforced stitched handles. Reversible lining using remaining scrap. Popular with buyers at Balogun and Yaba markets.",
          estimatedValueNaira: 6500,
          yieldPercent: 78,
        },
      ],
      _isDemo: true,
    };

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
    async function runDemoFabric(filename) {
      const src = filename || 'img.jpg';
      const lengthInput = document.getElementById('input-length');
      const widthInput = document.getElementById('input-width');
      const weightInput = document.getElementById('input-weight');
      if (!lengthInput.value) lengthInput.value = '0.60';
      if (!widthInput.value) widthInput.value = '0.50';
      if (!weightInput.value) weightInput.value = '0.40';

      // Non-logged-in users: Ankara sample shows pre-baked result,
      // Denim/Aso-Oke prompt them to sign in (no pre-baked result for those).
      if (!currentUser) {
        if (!filename) { showDemoResult(); return; }
        openAuthModal('Sign in to run the live AI scan on this fabric sample.');
        return;
      }

      const res = await fetch(src);
      const blob = await res.blob();
      const name = src.split('/').pop();
      const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
      runScan(file);
    }

    async function showDemoResult() {
      switchTab('dashboard');

      // Fetch img.jpg and store as base64 so Generate Image still works
      // once the user signs in within this session.
      scanCounter += 1;
      const scanId = `scan-${scanCounter}`;
      try {
        const res = await fetch('img.jpg');
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          const base64 = dataUrl.split(',')[1];
          scanStore[scanId] = { base64, mediaType: blob.type || 'image/jpeg' };
        };
        reader.readAsDataURL(blob);
      } catch (_) { /* non-fatal — generate button will hit auth gate anyway */ }

      const result = DEMO_SCAN_RESULT;

      // Show a demo notice banner
      const galleryFeed = document.getElementById('gallery-feed');
      document.getElementById('gallery-empty')?.remove();
      const notice = document.createElement('div');
      notice.id = 'demo-notice';
      notice.className = 'sm:col-span-2 glass-panel border-l-4 border-mint p-4 rounded-2xl flex items-start gap-3';
      notice.innerHTML = `
        <svg class="w-5 h-5 text-mint shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div>
          <p class="text-sm font-bold text-offwhite">Sample Result — Sign in to scan your own fabric</p>
          <p class="text-xs text-offwhite-muted mt-0.5">This is a pre-generated example showing what ReThread AI returns for an Ankara scrap. Create a free account and ask the admin to approve it — then scan any fabric for real.</p>
          <button onclick="openAuthModal()" class="sc-btn sc-btn-primary sc-btn-sm mt-3">Create Free Account</button>
        </div>`;
      galleryFeed.prepend(notice);

      renderScanSummary(result);
      renderFabricLore(result.materialType);
      renderColorPalette(result.colors || []);

      result.suggestedProducts.forEach((product) => {
        addProductCard(product, scanId, result.materialType, null);
      });

      incrementMetrics(0.40, result.suggestedProducts.length);
      showToast('Sample Ankara result loaded — sign in to run real AI on your fabric', 'info');
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
          if (res.status === 403 && errBody.needsAuth) {
            openAuthModal('Sign in to an approved account to scan fabric — our AI budget is shared and limited.');
            return;
          }
          if (errBody.code === 'AI_PAUSED') {
            showToast(errBody.error || 'AI scanning is paused by the admin. Please wait.', 'error');
            return;
          }
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
        renderFabricLore(result.materialType);
        renderColorPalette(result.colors || []);
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

    function renderColorPalette(colors) {
      const palette = document.getElementById('color-palette');
      const swatchesEl = document.getElementById('color-swatches');

      if (!colors.length) {
        palette.classList.add('hidden');
        return;
      }

      swatchesEl.innerHTML = colors.map((c) => {
        const hex = c.hex || '#888888';
        const name = c.name || 'Unknown';
        const role = c.role || '';
        // Determine if swatch needs dark or light text for contrast
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
        const textColor = luminance > 0.55 ? '#1A1816' : '#F6F4EB';
        return `
          <div class="flex-1 min-w-[120px] flex flex-col" style="min-width:clamp(100px,25%,160px)">
            <div class="h-20 sm:h-24 w-full relative group cursor-pointer" style="background:${hex}" onclick="copyHex('${hex}', this)">
              <div class="absolute inset-0 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <span class="text-[10px] font-mono font-bold text-white flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  Copy
                </span>
              </div>
            </div>
            <div class="px-3 py-2.5 border-t border-black/5">
              <p class="text-xs font-bold text-offwhite leading-tight">${escapeHtmlInline(name)}</p>
              <div class="flex items-center justify-between mt-1">
                <span class="text-[10px] font-mono text-offwhite-muted">${hex.toUpperCase()}</span>
                <button onclick="copyHex('${hex}', this)" title="Copy hex code"
                  class="text-[10px] font-semibold text-mint hover:text-mint-light transition-colors flex items-center gap-1 py-0.5 px-1.5 rounded hover:bg-mint/10">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  Copy
                </button>
              </div>
              ${role ? `<span class="text-[9px] text-offwhite-muted/70 uppercase tracking-wider">${escapeHtmlInline(role)}</span>` : ''}
            </div>
          </div>`;
      }).join('');

      palette.classList.remove('hidden');
    }

    async function copyHex(hex, triggerEl) {
      try {
        await navigator.clipboard.writeText(hex.toUpperCase());
        // Brief visual confirmation on the button/swatch
        const btn = triggerEl.tagName === 'BUTTON' ? triggerEl : triggerEl.closest('[onclick]');
        const originalHtml = btn?.innerHTML;
        if (btn) {
          btn.innerHTML = `<svg class="w-3 h-3 text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Copied!`;
          setTimeout(() => { if (btn) btn.innerHTML = originalHtml; }, 1500);
        }
        showToast(`Copied ${hex.toUpperCase()} to clipboard`, 'success');
      } catch {
        showToast(`Hex code: ${hex.toUpperCase()} (clipboard unavailable)`, 'info');
      }
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

      // Nigerian garments + international clothing terms — all need a model shot
      const wornByModel = /dress|top|jacket|gown|hat|scarf|wrap|shirt|skirt|blouse|suit|trouser|buba|kaftan|agbada|iro|boubou|dashiki|senator|ankara.*wear|lace.*top|kente.*wear/i.test(product.name);

      try {
        const res = await fetch(`${API_BASE}/api/generate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            imageBase64: scan.base64,
            mediaType: scan.mediaType,
            productName: product.name,
            productDescription: product.description,
            materialType: product.materialType || null,
            wornByModel,
            sizeHint: product.preferredSize || null,
          }),
        });
        if (res.status === 403) {
          const errBody = await res.json().catch(() => ({}));
          if (errBody.needsAuth) {
            btn.disabled = false;
            btn.textContent = 'Generate Image';
            media.innerHTML = originalMediaHtml;
            openAuthModal('Sign in to an approved account to generate images — our AI budget is shared and limited.');
            return;
          }
        }
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          if (errBody.code === 'AI_PAUSED') {
            btn.disabled = false;
            btn.textContent = 'Generate Image';
            media.innerHTML = originalMediaHtml;
            showToast(errBody.error || 'Image generation is paused by the admin. Please wait.', 'error');
            return;
          }
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

    // AUTH MODAL — sign up / log in. Both /api/scan and /api/generate are
    // gated behind an admin-approved account because the shared AI budget
    // (fal.ai + Claude, ~$8 combined) is small. A 403 with needsAuth from
    // either endpoint pops this modal open instead of letting the user hit
    // a dead end.
    let currentUser = null;

    async function refreshAuthUI() {
      try {
        const res = await fetch(`${API_BASE}/api/accounts/me`);
        const me = await res.json();
        currentUser = me.loggedIn ? me : null;
        renderAuthNav();
      } catch (err) {
        console.error('Failed to load auth state', err);
      }
    }

    function renderAuthNav() {
      const desktop = document.getElementById('auth-nav-area');
      const mobile = document.getElementById('auth-nav-area-mobile');
      if (currentUser) {
        const label = `Hi, ${escapeHtmlInline(currentUser.name)}${currentUser.aiApproved ? '' : ' (pending)'}`;
        desktop.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-xs text-offwhite-muted font-medium">${label}</span>
            <button onclick="logoutUser()" class="sc-btn sc-btn-ghost sc-btn-sm">Sign Out</button>
          </div>`;
        mobile.innerHTML = `
          <div class="flex items-center justify-between gap-2 px-1">
            <span class="text-xs text-offwhite-muted font-medium">${label}</span>
            <button onclick="logoutUser()" class="sc-btn sc-btn-ghost sc-btn-sm">Sign Out</button>
          </div>`;
      } else {
        desktop.innerHTML = `<button id="auth-nav-btn" onclick="openAuthModal()" class="sc-btn sc-btn-outline sc-btn-sm">Sign In</button>`;
        mobile.innerHTML = `<button onclick="openAuthModal(); closeMobileMenu()" class="sc-btn sc-btn-primary sc-btn-sm w-full">Sign In</button>`;
      }
    }

    function escapeHtmlInline(str) {
      const div = document.createElement('div');
      div.textContent = str || '';
      return div.innerHTML;
    }

    function openAuthModal(message) {
      document.getElementById('auth-modal-overlay').classList.remove('hidden');
      document.getElementById('auth-modal').classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      switchAuthMode('login');
      if (message) document.getElementById('auth-modal-message').textContent = message;
    }

    function closeAuthModal() {
      document.getElementById('auth-modal-overlay').classList.add('hidden');
      document.getElementById('auth-modal').classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }

    function switchAuthMode(mode) {
      document.getElementById('auth-modal-login-view').classList.toggle('hidden', mode !== 'login');
      document.getElementById('auth-modal-signup-view').classList.toggle('hidden', mode !== 'signup');
      document.getElementById('auth-modal-pending-view').classList.toggle('hidden', mode !== 'pending');
      document.getElementById('auth-login-error').classList.add('hidden');
      document.getElementById('auth-signup-error').classList.add('hidden');
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAuthModal();
    });

    async function submitLogin(event) {
      event.preventDefault();
      const email = document.getElementById('auth-login-email').value;
      const password = document.getElementById('auth-login-password').value;
      const errorEl = document.getElementById('auth-login-error');
      errorEl.classList.add('hidden');

      const res = await fetch(`${API_BASE}/api/accounts/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (body.status === 'pending') return switchAuthMode('pending');
        errorEl.textContent = body.error || 'Sign in failed';
        errorEl.classList.remove('hidden');
        return;
      }

      closeAuthModal();
      showToast(`Welcome, ${body.name}!`, 'success');
      await refreshAuthUI();
      if (activeTab === 'mydashboard') loadMyDashboard();
    }

    async function submitSignup(event) {
      event.preventDefault();
      const name = document.getElementById('auth-signup-name').value;
      const email = document.getElementById('auth-signup-email').value;
      const password = document.getElementById('auth-signup-password').value;
      const errorEl = document.getElementById('auth-signup-error');
      errorEl.classList.add('hidden');

      const res = await fetch(`${API_BASE}/api/accounts/signup`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        errorEl.textContent = body.error || 'Sign up failed';
        errorEl.classList.remove('hidden');
        return;
      }

      switchAuthMode('pending');
    }

    async function logoutUser() {
      await fetch(`${API_BASE}/api/accounts/logout`, { method: 'POST' });
      currentUser = null;
      renderAuthNav();
      showToast('Signed out', 'info');
      if (activeTab === 'mydashboard') loadMyDashboard();
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
            imageUrl: product.imageUrl || null,
          }),
        });
        if (res.status === 403) {
          const errBody = await res.json().catch(() => ({}));
          if (errBody.needsAuth) {
            return openAuthModal('Sign in to an approved account to list items on the marketplace.');
          }
        }
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

    // MARKET VIEW TOGGLE — switch between listings and requests
    let currentMarketView = 'listings';
    let allListings = [];

    function switchMarketView(view) {
      currentMarketView = view;
      document.getElementById('market-listings-view').classList.toggle('hidden', view !== 'listings');
      document.getElementById('market-requests-view').classList.toggle('hidden', view !== 'requests');
      document.getElementById('market-tab-listings').className = `sc-btn sc-btn-sm flex items-center gap-2 ${view === 'listings' ? 'sc-btn-primary' : 'sc-btn-outline'}`;
      document.getElementById('market-tab-requests').className = `sc-btn sc-btn-sm flex items-center gap-2 ${view === 'requests' ? 'sc-btn-primary' : 'sc-btn-outline'}`;
      // restore badge
      const badge = document.getElementById('requests-count-badge');
      if (badge && view !== 'requests') badge.classList.remove('hidden');
      if (view === 'requests') loadRequests();
    }

    function filterMarketplace() {
      const q = (document.getElementById('market-search')?.value || '').toLowerCase();
      const type = (document.getElementById('market-filter-type')?.value || '').toLowerCase();
      const filtered = allListings.filter(item => {
        const matchesQ = !q || item.title.toLowerCase().includes(q) || (item.materialType || '').toLowerCase().includes(q);
        const matchesType = !type || (item.materialType || '').toLowerCase().includes(type);
        return matchesQ && matchesType;
      });
      renderMarketplaceGrid(filtered);
    }

    // REAL MARKETPLACE BROWSE: GET /api/marketplace — the buyer-facing side
    async function loadMarketplace() {
      const grid = document.getElementById('marketplace-grid');
      grid.innerHTML = `<div class="col-span-3 glass-panel p-8 rounded-2xl text-center"><p class="text-sm text-offwhite-muted">Loading listings…</p></div>`;

      try {
        const res = await fetch(`${API_BASE}/api/marketplace`);
        if (!res.ok) throw new Error(`Failed to load listings (${res.status})`);
        const listings = await res.json();
        allListings = listings;
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
          <div class="h-44 bg-forest-dark ${item.imageUrl ? '' : 'flex flex-col items-center justify-center gap-2'}"
            style="${item.imageUrl ? `background-image:url(${item.imageUrl});background-size:cover;background-position:center;` : ''}">
            ${item.imageUrl ? '' : `
              <svg class="w-10 h-10 text-offwhite-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-[10px] text-offwhite-muted">No image yet</span>`}
          </div>
          <div class="p-4 flex flex-col gap-3 flex-grow">
            <div>
              <h3 class="font-display font-bold text-base text-offwhite leading-tight">${item.title}</h3>
              <span class="text-[10px] text-offwhite-muted mt-0.5 block">${item.vendor}</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span class="bg-mint/10 border border-mint/20 text-mint px-2.5 py-1 rounded-full text-[11px] font-semibold">${item.materialType}</span>
              ${item.dimensions ? `<span class="bg-black/5 border border-black/5 px-2.5 py-1 rounded-full text-[11px] text-offwhite-muted">${item.dimensions}</span>` : ''}
              ${item.weightKg ? `<span class="bg-black/5 border border-black/5 px-2.5 py-1 rounded-full text-[11px] text-offwhite-muted">${item.weightKg}kg</span>` : ''}
            </div>
            <div class="flex items-center justify-between mt-auto border-t border-black/5 pt-3">
              <span class="font-display font-extrabold text-lg text-mint">₦${Number(item.priceNaira).toLocaleString()}</span>
            </div>
            ${item.status === 'reserved'
              ? `<button disabled class="sc-btn sc-btn-outline sc-btn-sm w-full opacity-60">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Reserved${item.buyerName ? ` · ${item.buyerName}` : ''}
                </button>`
              : `<button onclick="reserveListing('${item.id}')" class="sc-btn sc-btn-primary sc-btn-sm w-full">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                  Reserve
                </button>`}
          </div>
        </div>
      `).join('');
    }

    // DESIGNER REQUESTS — what buyers/designers need from tailors
    async function loadRequests() {
      const grid = document.getElementById('requests-grid');
      if (!grid) return;
      grid.innerHTML = `<div class="col-span-3 glass-panel p-8 rounded-2xl text-center"><p class="text-sm text-offwhite-muted">Loading requests…</p></div>`;

      try {
        const res = await fetch(`${API_BASE}/api/marketplace/requests`);
        if (!res.ok) throw new Error(`Failed to load requests (${res.status})`);
        const requests = await res.json();

        // Update badge count
        const badge = document.getElementById('requests-count-badge');
        if (badge) { badge.textContent = requests.length; badge.classList.remove('hidden'); }

        if (!requests.length) {
          grid.innerHTML = `<div class="col-span-3 glass-panel p-8 rounded-2xl text-center"><p class="text-sm text-offwhite-muted">No requests yet — be the first to post what fabric you need.</p></div>`;
          return;
        }

        grid.innerHTML = requests.map(r => `
          <div class="glass-panel rounded-2xl p-4 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-2">
              <div class="w-9 h-9 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg class="w-4.5 h-4.5 text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-display font-bold text-sm text-offwhite leading-tight">${escapeHtmlInline(r.title)}</h3>
                <span class="text-[10px] text-offwhite-muted">${escapeHtmlInline(r.designerName)}</span>
              </div>
              <span class="sc-badge px-2 py-0.5 text-[10px] font-semibold shrink-0">${escapeHtmlInline(r.materialType)}</span>
            </div>
            ${r.colorNotes ? `<p class="text-xs text-offwhite-dark leading-relaxed">${escapeHtmlInline(r.colorNotes)}</p>` : ''}
            <div class="flex flex-wrap gap-2 text-[11px]">
              ${r.quantityNeeded ? `<span class="bg-black/5 border border-black/5 px-2.5 py-1 rounded-full text-offwhite-muted">${escapeHtmlInline(r.quantityNeeded)}</span>` : ''}
              ${r.budgetNaira ? `<span class="bg-mint/10 border border-mint/20 text-mint px-2.5 py-1 rounded-full font-semibold">Budget: ₦${Number(r.budgetNaira).toLocaleString()}</span>` : ''}
            </div>
            <button onclick="switchMarketView('listings')"
              class="sc-btn sc-btn-outline sc-btn-sm w-full text-xs">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
              I have this fabric — Browse Listings to post
            </button>
          </div>`).join('');
      } catch (err) {
        console.error(err);
        grid.innerHTML = `<div class="col-span-3 glass-panel p-8 rounded-2xl text-center"><p class="text-sm text-red-400">Couldn't load requests: ${err.message}</p></div>`;
      }
    }

    function openRequestModal() {
      if (!currentUser) return openAuthModal('Sign in to post a fabric request.');
      document.getElementById('request-modal-overlay').classList.remove('hidden');
      document.getElementById('request-modal').classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }

    function closeRequestModal() {
      document.getElementById('request-modal-overlay').classList.add('hidden');
      document.getElementById('request-modal').classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }

    async function submitRequest(event) {
      event.preventDefault();
      const errorEl = document.getElementById('req-error');
      errorEl.classList.add('hidden');

      const body = {
        title: document.getElementById('req-title').value,
        materialType: document.getElementById('req-material').value,
        colorNotes: document.getElementById('req-color').value,
        quantityNeeded: document.getElementById('req-quantity').value,
        budgetNaira: document.getElementById('req-budget').value ? Number(document.getElementById('req-budget').value) : null,
      };

      const res = await fetch(`${API_BASE}/api/marketplace/requests`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 403) {
        const err = await res.json().catch(() => ({}));
        if (err.needsAuth) { closeRequestModal(); return openAuthModal('Sign in to post a fabric request.'); }
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        errorEl.textContent = err.error || 'Failed to post request';
        errorEl.classList.remove('hidden');
        return;
      }

      closeRequestModal();
      document.getElementById('request-form').reset();
      showToast('Request posted — tailors with matching fabric will see it.', 'success');
      loadRequests();
    }

    // RESERVE/BUY A LISTING — no real payment is wired up yet (see "Coming
    // Soon: Integrated Payments"), so this claims the item under the buyer's
    // account rather than moving money.
    async function reserveListing(id) {
      try {
        const res = await fetch(`${API_BASE}/api/marketplace/${id}/reserve`, { method: 'POST' });
        if (res.status === 403) {
          const errBody = await res.json().catch(() => ({}));
          if (errBody.needsAuth) {
            return openAuthModal('Sign in to an approved account to reserve items.');
          }
        }
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Reserve failed (${res.status})`);
        }
        showToast('Item reserved — find it under My Dashboard.', 'success');
        loadMarketplace();
      } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
      }
    }

    // MY DASHBOARD — a logged-in user's own listings + reservations
    async function loadMyDashboard() {
      const signedOut = document.getElementById('my-dashboard-signedout');
      const content = document.getElementById('my-dashboard-content');

      if (!currentUser) {
        signedOut.classList.remove('hidden');
        content.classList.add('hidden');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/marketplace/mine`);
        if (res.status === 401) {
          signedOut.classList.remove('hidden');
          content.classList.add('hidden');
          return;
        }
        if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
        const { listings, purchases } = await res.json();

        signedOut.classList.add('hidden');
        content.classList.remove('hidden');
        renderDashboardGrid('my-listings-grid', listings, 'You haven\'t listed anything yet — list a suggestion from the Creator Dashboard.');
        renderDashboardGrid('my-purchases-grid', purchases, 'You haven\'t reserved anything from the Marketplace yet.');
      } catch (err) {
        console.error(err);
        showToast(`Couldn't load your dashboard: ${err.message}`, 'error');
      }
    }

    function renderDashboardGrid(gridId, items, emptyText) {
      const grid = document.getElementById(gridId);
      if (!items.length) {
        grid.innerHTML = `<div class="col-span-2 lg:col-span-3 glass-panel p-6 rounded-2xl text-center"><p class="text-sm text-offwhite-muted">${emptyText}</p></div>`;
        return;
      }
      grid.innerHTML = items.map((item) => `
        <div class="glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div class="h-36 bg-forest-dark ${item.imageUrl ? '' : 'flex flex-col items-center justify-center gap-1.5'}"
            style="${item.imageUrl ? `background-image:url(${item.imageUrl});background-size:cover;background-position:center;` : ''}">
            ${item.imageUrl ? '' : `
              <svg class="w-8 h-8 text-offwhite-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-[10px] text-offwhite-muted">No image</span>`}
          </div>
          <div class="p-4 flex flex-col gap-2">
            <h3 class="font-display font-bold text-sm text-offwhite">${item.title}</h3>
            <div class="flex items-center justify-between">
              <span class="font-display font-extrabold text-mint">₦${Number(item.priceNaira).toLocaleString()}</span>
              <span class="sc-badge px-2.5 py-1 text-[10px] font-semibold uppercase ${item.status === 'reserved' ? 'bg-amber-50 border-amber-200 text-amber-700' : ''}">${item.status}</span>
            </div>
            ${item.buyerName ? `<span class="text-[10px] text-offwhite-muted">Reserved by ${item.buyerName}</span>` : ''}
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
