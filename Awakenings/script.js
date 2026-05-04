const TIERS = [
  { tier: "E-", group: "e", odds: 4.3, value: 10, points: 3, retire: true },
  { tier: "E", group: "e", odds: 19.8, value: 15, points: 4, retire: true },
  { tier: "E+", group: "e", odds: 28.8, value: 20, points: 5, retire: true },
  { tier: "D-", group: "d", odds: 20, value: 30, points: 6, retire: true },
  { tier: "D", group: "d", odds: 9.2, value: 50, points: 7, retire: true },
  { tier: "D+", group: "d", odds: 4.8, value: 70, points: 8, retire: true },
  { tier: "C-", group: "c", odds: 4.4, value: 100, points: 9, retire: true },
  { tier: "C", group: "c", odds: 4.3, value: 150, points: 10, retire: true },
  { tier: "C+", group: "c", odds: 2.13, value: 200, points: 11, retire: true },
  { tier: "B-", group: "b", odds: 1.62, value: 300, points: 12, retire: true },
  { tier: "B", group: "b", odds: 0.55, value: 600, points: 13, retire: true },
  { tier: "B+", group: "b", odds: 0.0745, value: 1800, points: 14, retire: true },
  { tier: "A-", group: "a", odds: 0.015, value: 8000, points: 15, retire: false },
  { tier: "A", group: "a", odds: 0.0065, value: 15000, points: 16, retire: false },
  { tier: "A+", group: "a", odds: 0.0025, value: 25000, points: 17, retire: false },
  { tier: "S", group: "s", odds: 0.0005, value: 50000, points: 18, retire: false },
  { tier: "SS", group: "s", odds: 0.0005, value: 100000, points: 19, retire: false },
  { tier: "SSS", group: "s", odds: 0.0005, value: 200000, points: 20, retire: false }
];

const COST_PER_AWAKENING = 100;

const elements = {
  countInput: document.querySelector("#awakeningCount"),
  results: document.querySelector("#results"),
  totalValue: document.querySelector("#totalValue"),
  keptValue: document.querySelector("#keptValue"),
  totalAwakenings: document.querySelector("#totalAwakenings"),
  totalPoints: document.querySelector("#totalPoints"),
  bonusAwakenings: document.querySelector("#bonusAwakenings"),
  leftoverGems: document.querySelector("#leftoverGems"),
  totalSpent: document.querySelector("#totalSpent"),
  netValue: document.querySelector("#netValue"),
  valuePerAwakening: document.querySelector("#valuePerAwakening"),
  bestTier: document.querySelector("#bestTier"),
  simulateButton: document.querySelector("#simulateButton")
};

function formatNumber(value, maximumFractionDigits = 2) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: value > 0 && value < 1 ? 4 : 0,
    maximumFractionDigits
  });
}

function createEmptyCounts() {
  return new Map(TIERS.map((item) => [item.tier, 0]));
}

function rollTiers(awakenings) {
  const counts = createEmptyCounts();

  for (let i = 0; i < awakenings; i++) {
    let roll = Math.random() * 100;

    for (const item of TIERS) {
      roll -= item.odds;

      if (roll <= 0) {
        counts.set(item.tier, counts.get(item.tier) + 1);
        break;
      }
    }
  }

  return counts;
}

function addCounts(totalCounts, batchCounts) {
  for (const [tier, copies] of batchCounts) {
    totalCounts.set(tier, totalCounts.get(tier) + copies);
  }
}

function getRetirementValue(counts) {
  let value = 0;

  for (const item of TIERS) {
    if (item.retire) {
      value += counts.get(item.tier) * item.value;
    }
  }

  return value;
}

function getKeptValue(counts) {
  let value = 0;

  for (const item of TIERS) {
    if (!item.retire) {
      value += counts.get(item.tier) * item.value;
    }
  }

  return value;
}

function getLeaderboardPoints(counts) {
  let points = 0;

  for (const item of TIERS) {
    points += counts.get(item.tier) * item.points;
  }

  return points;
}

function simulateWithReinvesting(initialAwakenings) {
  const counts = createEmptyCounts();
  let batchSize = initialAwakenings;
  let totalRolled = 0;
  let gemPool = 0;
  let totalRetiredValue = 0;

  while (batchSize > 0) {
    const batchCounts = rollTiers(batchSize);
    const batchValue = getRetirementValue(batchCounts);

    addCounts(counts, batchCounts);
    totalRolled += batchSize;
    totalRetiredValue += batchValue;
    gemPool += batchValue;

    batchSize = Math.floor(gemPool / COST_PER_AWAKENING);
    gemPool -= batchSize * COST_PER_AWAKENING;
  }

  return {
    counts,
    leftover: gemPool,
    totalRetiredValue,
    totalRolled
  };
}

function getMostValuableTier(simulation) {
  let strongest = TIERS[0];
  let strongestValue = 0;

  for (const item of TIERS) {
    const tierValue = item.retire ? simulation.counts.get(item.tier) * item.value : 0;

    if (tierValue > strongestValue) {
      strongestValue = tierValue;
      strongest = item;
    }
  }

  return strongestValue > 0 ? strongest.tier : "-";
}

function renderResults(simulation) {
  elements.results.innerHTML = TIERS.map((item) => {
    const copies = simulation.counts.get(item.tier);
    const tierValue = item.retire ? copies * item.value : 0;
    const tierPoints = copies * item.points;

    return `
      <tr>
        <td><span class="tier ${item.group}">${item.tier}</span></td>
        <td>${item.odds}%</td>
        <td>${formatNumber(item.value, 0)}</td>
        <td>${item.points}</td>
        <td>${formatNumber(copies, 0)}</td>
        <td>${formatNumber(tierValue, 2)}</td>
        <td>${formatNumber(tierPoints, 0)}</td>
      </tr>
    `;
  }).join("");
}

function renderSummary(initialAwakenings, simulation) {
  const spent = simulation.totalRolled * COST_PER_AWAKENING;
  const totalPoints = getLeaderboardPoints(simulation.counts);
  const keptValue = getKeptValue(simulation.counts);

  elements.totalValue.textContent = formatNumber(simulation.totalRetiredValue, 2);
  elements.keptValue.textContent = formatNumber(keptValue, 2);
  elements.totalAwakenings.textContent = formatNumber(simulation.totalRolled, 0);
  elements.totalPoints.textContent = formatNumber(totalPoints, 0);
  elements.bonusAwakenings.textContent = formatNumber(simulation.totalRolled - initialAwakenings, 0);
  elements.leftoverGems.textContent = formatNumber(simulation.leftover, 0);
  elements.totalSpent.textContent = formatNumber(spent, 0);
  elements.netValue.textContent = formatNumber(simulation.totalRetiredValue - spent, 2);
  elements.valuePerAwakening.textContent = formatNumber(
    simulation.totalRolled > 0 ? simulation.totalRetiredValue / simulation.totalRolled : 0,
    2
  );
  elements.bestTier.textContent = getMostValuableTier(simulation);
}

function simulate() {
  const initialAwakenings = Math.max(0, Number(elements.countInput.value) || 0);
  const simulation = simulateWithReinvesting(initialAwakenings);

  renderResults(simulation);
  renderSummary(initialAwakenings, simulation);
}

document.querySelectorAll("[data-amount]").forEach((button) => {
  button.addEventListener("click", () => {
    elements.countInput.value = button.dataset.amount;
    simulate();
  });
});

elements.countInput.addEventListener("input", simulate);
elements.simulateButton.addEventListener("click", simulate);
simulate();
