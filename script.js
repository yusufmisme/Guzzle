(() => {
  "use strict";

  // Table 1 values from Li et al., arXiv:2304.03271 v5. Values are
  // operational water consumption per GPT-3 request.
  const LOCATION_ESTIMATES = Object.freeze({
    texas: { label: "Texas", onSiteWue: 0.25, pue: 1.28, ewif: 1.287 },
    average: { label: "U.S. average", onSiteWue: 0.55, pue: 1.17, ewif: 3.142 },
    washington: { label: "Washington", onSiteWue: 0.95, pue: 1.15, ewif: 9.501 },
  });

  // The paper assumes 0.004 kWh per medium-sized GPT-3 response.
  const ENERGY_KWH_PER_RESPONSE = 0.004;

  // Comparison assumptions: 2 US gallons/minute for a sprinkler and
  // 0.623 gallons per square foot for one inch of water depth.
  const GALLONS_PER_LITER = 1 / 3.785411784;
  const SPRINKLER_GALLONS_PER_MINUTE = 2;
  const GALLONS_PER_SQ_FT_PER_INCH = 0.623;
  const MAX_RESPONSES = 1_000_000;

  const elements = {
    input: document.querySelector("#response-count"),
    selectedEstimate: document.querySelector("#selected-estimate"),
    responseCount: document.querySelector("#result-count"),
    selectedLocation: document.querySelector("#result-scenario"),
    fullRange: document.querySelector("#full-range"),
    rangeFill: document.querySelector("#range-fill"),
    rangeMarker: document.querySelector("#range-marker"),
    rangeTrack: document.querySelector(".range-track"),
    sprinklerSeconds: document.querySelector("#sprinkler-seconds"),
    lawnArea: document.querySelector("#lawn-area"),
    perResponseRange: document.querySelector("#per-response-range"),
  };

  const format = (value, digits = 0) => new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);

  function operationalWaterMl(location) {
    const waterLitersPerKwh = location.onSiteWue + location.pue * location.ewif;
    return ENERGY_KWH_PER_RESPONSE * waterLitersPerKwh * 1000;
  }

  const lowMlPerResponse = operationalWaterMl(LOCATION_ESTIMATES.texas);
  const highMlPerResponse = operationalWaterMl(LOCATION_ESTIMATES.washington);

  function responseCount() {
    const parsed = Number.parseInt(elements.input.value, 10);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(MAX_RESPONSES, Math.max(0, parsed));
  }

  function selectedLocation() {
    const key = document.querySelector('input[name="scenario"]:checked')?.value ?? "average";
    return LOCATION_ESTIMATES[key] ? LOCATION_ESTIMATES[key] : LOCATION_ESTIMATES.average;
  }

  function updateEstimate() {
    const count = responseCount();
    if (elements.input.value !== "" && Number(elements.input.value) > MAX_RESPONSES) {
      elements.input.value = String(MAX_RESPONSES);
    }

    const location = selectedLocation();
    const selectedMlPerResponse = operationalWaterMl(location);
    const selectedMl = selectedMlPerResponse * count;
    const minimumMl = lowMlPerResponse * count;
    const maximumMl = highMlPerResponse * count;
    const percent = highMlPerResponse === lowMlPerResponse
      ? 0
      : ((selectedMlPerResponse - lowMlPerResponse) / (highMlPerResponse - lowMlPerResponse)) * 100;
    const gallons = selectedMl / 1000 * GALLONS_PER_LITER;

    elements.selectedEstimate.textContent = format(selectedMl, 1);
    elements.responseCount.textContent = format(count);
    elements.selectedLocation.textContent = location.label;
    elements.fullRange.textContent = `${format(minimumMl)}–${format(maximumMl)} mL`;
    elements.sprinklerSeconds.textContent = format(gallons / SPRINKLER_GALLONS_PER_MINUTE * 60, 2);
    elements.lawnArea.textContent = format(gallons / GALLONS_PER_SQ_FT_PER_INCH, 4);
    elements.perResponseRange.textContent = `${format(lowMlPerResponse, 1)}–${format(highMlPerResponse, 1)} mL`;
    elements.rangeFill.style.width = `${percent}%`;
    elements.rangeMarker.style.left = `${percent}%`;
    elements.rangeTrack.setAttribute(
      "aria-label",
      `${location.label} example: ${format(selectedMlPerResponse, 1)} milliliters per response, within the Texas to Washington example range of ${format(lowMlPerResponse, 1)} to ${format(highMlPerResponse, 1)} milliliters`,
    );
  }

  elements.input.addEventListener("input", updateEstimate);
  document.querySelectorAll('input[name="scenario"]').forEach((radio) => {
    radio.addEventListener("change", updateEstimate);
  });

  updateEstimate();
})();
