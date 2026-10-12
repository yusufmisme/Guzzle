(() => {
  "use strict";

  // Research example from Li et al. (2023), section 1.2.
  const ENERGY_KWH_PER_RESPONSE = 0.00396;
  const POWER_USAGE_EFFECTIVENESS = 1.2;
  const ELECTRICITY_WATER_LITERS_PER_KWH = 1.8;
  const COOLING_WUE = Object.freeze({ cool: 0.5, hot: 5 });

  // Comparison assumptions: 2 US gallons/minute for the sprinkler and
  // 0.623 gallons per square foot for one inch of water depth.
  const GALLONS_PER_LITER = 1 / 3.785411784;
  const SPRINKLER_GALLONS_PER_MINUTE = 2;
  const GALLONS_PER_SQ_FT_PER_INCH = 0.623;
  const MAX_RESPONSES = 1_000_000;

  const elements = {
    input: document.querySelector("#response-count"),
    selectedEstimate: document.querySelector("#selected-estimate"),
    responseCount: document.querySelector("#result-count"),
    selectedScenario: document.querySelector("#result-scenario"),
    fullRange: document.querySelector("#full-range"),
    rangeFill: document.querySelector("#range-fill"),
    rangeMarker: document.querySelector("#range-marker"),
    rangeTrack: document.querySelector(".range-track"),
    sprinklerMinutes: document.querySelector("#sprinkler-minutes"),
    lawnArea: document.querySelector("#lawn-area"),
    perResponseRange: document.querySelector("#per-response-range"),
  };

  const format = (value, digits = 0) => new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);

  function waterLitersPerResponse(coolingWue) {
    const totalWaterIntensity =
      POWER_USAGE_EFFECTIVENESS * ELECTRICITY_WATER_LITERS_PER_KWH + coolingWue;
    return ENERGY_KWH_PER_RESPONSE * totalWaterIntensity;
  }

  const lowLitersPerResponse = waterLitersPerResponse(COOLING_WUE.cool);
  const highLitersPerResponse = waterLitersPerResponse(COOLING_WUE.hot);
  const lowMlPerResponse = lowLitersPerResponse * 1000;
  const highMlPerResponse = highLitersPerResponse * 1000;

  function responseCount() {
    const parsed = Number.parseInt(elements.input.value, 10);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(MAX_RESPONSES, Math.max(0, parsed));
  }

  function selectedCoolingScenario() {
    return document.querySelector('input[name="scenario"]:checked')?.value ?? "cool";
  }

  function updateEstimate() {
    const count = responseCount();
    if (elements.input.value !== "" && Number(elements.input.value) > MAX_RESPONSES) {
      elements.input.value = String(MAX_RESPONSES);
    }
    const scenario = selectedCoolingScenario();
    const selectedMlPerResponse = waterLitersPerResponse(COOLING_WUE[scenario]) * 1000;
    const selectedMl = selectedMlPerResponse * count;
    const minimumMl = lowMlPerResponse * count;
    const maximumMl = highMlPerResponse * count;
    const selectedPercent = scenario === "cool" ? 0 : 100;
    const gallons = selectedMl / 1000 * GALLONS_PER_LITER;

    elements.selectedEstimate.textContent = format(selectedMl, 1);
    elements.responseCount.textContent = format(count);
    elements.selectedScenario.textContent = scenario === "cool" ? "cooler" : "hotter";
    elements.fullRange.textContent = `${format(minimumMl)}–${format(maximumMl)} mL`;
    elements.sprinklerMinutes.textContent = format(gallons / SPRINKLER_GALLONS_PER_MINUTE, 5);
    elements.lawnArea.textContent = format(gallons / GALLONS_PER_SQ_FT_PER_INCH, 5);
    elements.perResponseRange.textContent = `${format(lowMlPerResponse, 1)}–${format(highMlPerResponse, 1)} mL`;
    elements.rangeFill.style.width = `${selectedPercent}%`;
    elements.rangeMarker.style.left = `${selectedPercent}%`;
    elements.rangeTrack.setAttribute(
      "aria-label",
      `Selected ${scenario === "cool" ? "cooler" : "hotter"} cooling assumption, at the ${scenario === "cool" ? "lower" : "upper"} end of the modeled range`,
    );
  }

  elements.input.addEventListener("input", updateEstimate);
  document.querySelectorAll('input[name="scenario"]').forEach((radio) => {
    radio.addEventListener("change", updateEstimate);
  });

  updateEstimate();
})();
