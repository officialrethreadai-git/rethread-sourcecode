// Real balance/spend lookups for the admin panel. No faked numbers: if a key
// isn't configured or a provider has no balance API, we say so explicitly
// instead of making something up.

// Detects "out of credit" responses from either provider's SDK/API errors so
// routes can show users a friendly "contact the admin" message instead of a
// raw technical error.
// Detects "invalid/revoked API key" responses (as opposed to "out of
// credit") so routes can tell users the AI is unreachable rather than
// implying it's just a billing top-up issue.
export function isAuthError(err) {
  const status = err?.status || err?.statusCode;
  return status === 401 || status === 403;
}

export function isCreditExhaustedError(err) {
  const status = err?.status || err?.statusCode;
  const message = String(err?.message || "").toLowerCase();
  if (status === 402) return true;
  if ((status === 400 || status === 403 || status === 429) && /credit|balance|insufficient|quota|billing/.test(message)) {
    return true;
  }
  return /credit balance is too low|insufficient credit|insufficient.*balance/.test(message);
}

export async function getFalBalance() {
  const key = process.env.FAL_ADMIN_KEY;
  if (!key) {
    return { available: false, reason: "FAL_ADMIN_KEY not configured" };
  }

  const res = await fetch("https://api.fal.ai/v1/account/billing?expand=credits", {
    headers: { Authorization: `Key ${key}` },
  });

  if (!res.ok) {
    return { available: false, reason: `fal.ai billing API returned ${res.status}` };
  }

  const body = await res.json();
  return {
    available: true,
    balanceUsd: body.credits?.current_balance ?? null,
    currency: body.credits?.currency ?? "USD",
  };
}

// Anthropic has no live "remaining balance" endpoint — only a real Cost
// Report API (historical spend). We sum real spend for the current month
// and subtract it from a configured starting credit to estimate what's
// left. This is clearly labeled as an estimate, not a live balance.
export async function getAnthropicSpend() {
  const key = process.env.ANTHROPIC_ADMIN_KEY;
  if (!key) {
    return { available: false, reason: "ANTHROPIC_ADMIN_KEY not configured" };
  }

  const startingCredit = Number(process.env.ANTHROPIC_STARTING_CREDIT_USD || 0);
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();

  let totalCents = 0;
  let page;
  let guard = 0;

  do {
    const url = new URL("https://api.anthropic.com/v1/organizations/cost_report");
    url.searchParams.set("starting_at", monthStart);
    url.searchParams.set("bucket_width", "1d");
    if (page) url.searchParams.set("page", page);

    const res = await fetch(url, {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    });

    if (!res.ok) {
      return { available: false, reason: `Anthropic cost report API returned ${res.status}` };
    }

    const body = await res.json();
    for (const bucket of body.data || []) {
      for (const item of bucket.results || []) {
        totalCents += parseFloat(item.amount || "0");
      }
    }

    page = body.has_more ? body.next_page : null;
    guard += 1;
  } while (page && guard < 60);

  const spentUsd = totalCents / 100;

  return {
    available: true,
    spentThisMonthUsd: Number(spentUsd.toFixed(4)),
    startingCreditUsd: startingCredit || null,
    estimatedRemainingUsd: startingCredit ? Number((startingCredit - spentUsd).toFixed(4)) : null,
    note: "Anthropic has no live balance API. Spend is real (Cost Report API); remaining is an estimate from spend vs. the starting credit configured in .env.",
  };
}
