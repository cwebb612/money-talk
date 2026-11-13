import {
  GoalAccount,
  GoalDTO,
  buildMetricSeries,
  emptyGoalFields,
  formatGoalValue,
  goalDirection,
  goalProgress,
  isOnTrack,
  metricValue,
  nextMilestone,
  projectCompletion,
  requiredMonthly,
  suggestGoals,
  targetAt,
  validateGoalFields,
  valueAtStart,
  valueOn,
} from "../../lib/utils/goals";

const accounts: GoalAccount[] = [
  { _id: "cash1", name: "Checking", type: "cash", currentValue: 10000 },
  { _id: "inv1", name: "Brokerage", type: "investment", currentValue: 50000 },
  { _id: "card", name: "Credit Card", type: "liability", currentValue: 2000 },
  { _id: "loan", name: "Car Loan", type: "liability", currentValue: 8000 },
];

function goal(overrides: Partial<GoalDTO> = {}): GoalDTO {
  return {
    ...emptyGoalFields(),
    _id: "g1",
    title: "Goal",
    direction: "increase",
    startValue: 0,
    startDate: "2026-01-01",
    status: "active",
    achievedAt: null,
    priority: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const fire = { annualSpending: 40000, withdrawalRate: 4, expectedReturn: 7, currentAge: 30, retirementAge: 60 };

describe("metricValue", () => {
  it("subtracts debt from assets for net worth", () => {
    expect(metricValue({ metric: "netWorth", accountIds: [] }, accounts)).toBe(50000);
  });

  it("adds up only the matching account type", () => {
    expect(metricValue({ metric: "cash", accountIds: [] }, accounts)).toBe(10000);
    expect(metricValue({ metric: "investments", accountIds: [] }, accounts)).toBe(50000);
    expect(metricValue({ metric: "assets", accountIds: [] }, accounts)).toBe(60000);
    expect(metricValue({ metric: "liabilities", accountIds: [] }, accounts)).toBe(10000);
  });

  it("returns the debt balance when every selected account is a liability", () => {
    expect(metricValue({ metric: "accounts", accountIds: ["card", "loan"] }, accounts)).toBe(10000);
  });

  it("subtracts liabilities when selected accounts mix assets and debt", () => {
    expect(metricValue({ metric: "accounts", accountIds: ["cash1", "card"] }, accounts)).toBe(8000);
  });
});

describe("goalDirection", () => {
  it("decreases for debt goals", () => {
    expect(goalDirection({ metric: "liabilities", accountIds: [] }, accounts)).toBe("decrease");
    expect(goalDirection({ metric: "accounts", accountIds: ["card"] }, accounts)).toBe("decrease");
  });

  it("increases for asset goals", () => {
    expect(goalDirection({ metric: "netWorth", accountIds: [] }, accounts)).toBe("increase");
    expect(goalDirection({ metric: "accounts", accountIds: ["card", "cash1"] }, accounts)).toBe("increase");
  });
});

describe("targetAt", () => {
  it("keeps a fixed target unchanged", () => {
    expect(targetAt(goal({ targetAmount: 100000 }), "2036-01-01")).toBe(100000);
  });

  it("grows a growing target by the yearly rate", () => {
    const g = goal({ targetMode: "growing", targetAmount: 100000, targetGrowthRate: 10 });
    expect(targetAt(g, "2027-01-01")).toBeCloseTo(110000, -2);
  });

  it("does not shrink before the start date", () => {
    const g = goal({ targetMode: "growing", targetAmount: 100000, targetGrowthRate: 10 });
    expect(targetAt(g, "2025-01-01")).toBe(100000);
  });

  it("uses 25 times spending for FIRE and grows it with inflation", () => {
    const g = goal({ targetMode: "fire", targetGrowthRate: 3, fireInputs: fire });
    expect(targetAt(g, "2026-01-01")).toBe(1000000);
    expect(targetAt(g, "2027-01-01")).toBeCloseTo(1030000, -2);
  });

  it("raises the Coast FIRE target as retirement gets nearer", () => {
    const g = goal({ targetMode: "coastFire", targetGrowthRate: 3, fireInputs: fire });
    const now = targetAt(g, "2026-01-01");
    expect(now).toBeCloseTo(1000000 * Math.pow(1.03 / 1.07, 30), 0);
    expect(targetAt(g, "2036-01-01")).toBeGreaterThan(now);
    expect(targetAt(g, "2056-01-01")).toBeCloseTo(1000000 * Math.pow(1.03, 30), -3);
  });
});

describe("goalProgress", () => {
  it("measures a savings goal from $0", () => {
    const progress = goalProgress(goal({ targetAmount: 100000, startValue: 40000 }), 50000, "2026-06-01");
    expect(progress.percent).toBe(50);
    expect(progress.remaining).toBe(50000);
    expect(progress.reached).toBe(false);
  });

  it("measures a debt goal from the starting balance", () => {
    const g = goal({ metric: "liabilities", direction: "decrease", targetAmount: 0, startValue: 10000 });
    const progress = goalProgress(g, 2500, "2026-06-01");
    expect(progress.percent).toBe(75);
    expect(progress.remaining).toBe(2500);
  });

  it("measures a positive net worth goal from a negative start", () => {
    const progress = goalProgress(goal({ targetAmount: 0, startValue: -20000 }), -5000, "2026-06-01");
    expect(progress.percent).toBe(75);
  });

  it("marks the goal reached at the target", () => {
    const progress = goalProgress(goal({ targetAmount: 100000 }), 120000, "2026-06-01");
    expect(progress.reached).toBe(true);
    expect(progress.percent).toBe(100);
    expect(progress.remaining).toBe(0);
  });
});

describe("buildMetricSeries", () => {
  const types = new Map(accounts.map((a) => [a._id, a.type]));
  const activities = [
    { date: "2026-01-01", accountId: "cash1", value: 1000 },
    { date: "2026-01-01", accountId: "card", value: 500 },
    { date: "2026-02-01", accountId: "cash1", value: 2000 },
  ];

  it("carries each account's last value forward", () => {
    expect(buildMetricSeries({ metric: "netWorth", accountIds: [] }, activities, types)).toEqual([
      { date: "2026-01-01", value: 500 },
      { date: "2026-02-01", value: 1500 },
    ]);
  });

  it("skips days before a selected account has a value", () => {
    const later = [{ date: "2025-12-01", accountId: "inv1", value: 5 }, ...activities];
    expect(buildMetricSeries({ metric: "accounts", accountIds: ["card"] }, later, types)).toEqual([
      { date: "2026-01-01", value: 500 },
      { date: "2026-02-01", value: 500 },
    ]);
  });
});

describe("projectCompletion", () => {
  const history = [
    { date: "2026-01-01", value: 0 },
    { date: "2026-07-01", value: 6000 },
  ];

  it("projects the finish date from the recent pace", () => {
    const projected = projectCompletion(goal({ targetAmount: 12000 }), history, 6000, "2026-07-01");
    expect(projected).not.toBeNull();
    expect(projected! >= "2026-12-01" && projected! <= "2027-02-01").toBe(true);
  });

  it("returns null when the pace goes the wrong way", () => {
    const g = goal({ direction: "decrease", targetAmount: 0, startValue: 6000 });
    expect(projectCompletion(g, history, 6000, "2026-07-01")).toBeNull();
  });
});

describe("requiredMonthly", () => {
  it("divides the gap by the months left", () => {
    const g = goal({ targetAmount: 12000, targetDate: "2027-01-01" });
    expect(requiredMonthly(g, 0, "2026-01-01")).toBeCloseTo(1000, -1);
  });

  it("returns null without a future target date", () => {
    expect(requiredMonthly(goal({ targetAmount: 12000 }), 0, "2026-01-01")).toBeNull();
    expect(requiredMonthly(goal({ targetAmount: 12000, targetDate: "2025-01-01" }), 0, "2026-01-01")).toBeNull();
  });
});

describe("isOnTrack", () => {
  it("compares the projected date with the target date", () => {
    expect(isOnTrack("2027-01-01", "2026-06-01")).toBe(true);
    expect(isOnTrack("2027-01-01", "2028-01-01")).toBe(false);
    expect(isOnTrack("2027-01-01", null)).toBe(false);
    expect(isOnTrack(null, "2026-06-01")).toBeNull();
  });
});

describe("nextMilestone", () => {
  it("picks a step that fits the size of the net worth", () => {
    expect(nextMilestone(-5000)).toBe(10000);
    expect(nextMilestone(9999)).toBe(10000);
    expect(nextMilestone(10000)).toBe(25000);
    expect(nextMilestone(60000)).toBe(75000);
    expect(nextMilestone(150000)).toBe(200000);
    expect(nextMilestone(1200000)).toBe(1500000);
  });
});

describe("suggestGoals", () => {
  const today = "2026-07-01";
  const keysFor = (list: GoalAccount[], goals: { template: string | null; status: GoalDTO["status"] }[] = [], history: { date: string; value: number }[] = []) =>
    suggestGoals(list, goals, history, today).map((s) => s.key);

  it("suggests general debt goals, milestones and retirement goals", () => {
    expect(keysFor(accounts)).toEqual([
      "debtFree",
      "debtDown",
      "payoffAccount",
      "milestone",
      "doubleNetWorth",
      "millionaire",
      "billionaire",
      "addThisYear",
      "emergencyFund",
      "fire",
      "coastFire",
    ]);
  });

  it("does not name a specific debt account", () => {
    const payoff = suggestGoals(accounts, [], [], today).find((s) => s.key === "payoffAccount")!;
    expect(payoff.draft.metric).toBe("accounts");
    expect(payoff.draft.accountIds).toEqual([]);
  });

  it("suggests a positive net worth instead of a milestone when debt is more than assets", () => {
    const keys = keysFor([{ _id: "loan", type: "liability", currentValue: 5000 }]);
    expect(keys).toContain("positiveNetWorth");
    expect(keys).toContain("debtRatio");
    expect(keys).not.toContain("milestone");
  });

  it("drops the milestone when it is $1M, because the millionaire goal covers it", () => {
    const keys = keysFor([{ _id: "inv1", type: "investment", currentValue: 950000 }]);
    expect(keys).not.toContain("milestone");
    expect(keys).toContain("millionaire");
  });

  it("suggests beating last month and last year when net worth grew", () => {
    const history = [
      { date: "2025-07-01", value: 40000 },
      { date: "2026-06-01", value: 45000 },
    ];
    const suggestions = suggestGoals(accounts, [], history, today);
    const year = suggestions.find((s) => s.key === "beatLastYear")!;
    const month = suggestions.find((s) => s.key === "beatLastMonth")!;
    expect(year.draft).toMatchObject({ targetMode: "contribution", targetAmount: 10000, targetDate: "2027-07-01" });
    expect(month.draft).toMatchObject({ targetMode: "contribution", targetAmount: 5000, targetDate: "2026-08-01" });
  });

  it("suggests investing cash above the emergency fund", () => {
    const rich = [...accounts, { _id: "cash2", type: "cash", currentValue: 30000 }];
    const invest = suggestGoals(rich, [], [], today).find((s) => s.key === "investExtraCash")!;
    expect(invest.draft.targetAmount).toBe(50000 + 40000 - 24000);
  });

  it("hides a suggestion that is already an active goal", () => {
    const keys = keysFor(accounts, [
      { template: "fire", status: "active" },
      { template: "milestone", status: "achieved" },
    ]);
    expect(keys).not.toContain("fire");
    expect(keys).toContain("milestone");
  });
});

describe("contribution goals", () => {
  const add = goal({ targetMode: "contribution", targetAmount: 10000, startValue: 50000 });

  it("targets the start value plus the amount", () => {
    expect(targetAt(add, "2026-06-01")).toBe(60000);
  });

  it("measures progress from the start value", () => {
    expect(goalProgress(add, 55000, "2026-06-01").percent).toBe(50);
  });

  it("subtracts the amount for a debt goal", () => {
    const payDown = goal({ targetMode: "contribution", direction: "decrease", targetAmount: 2000, startValue: 8000 });
    expect(targetAt(payDown, "2026-06-01")).toBe(6000);
  });
});

describe("debt to assets", () => {
  it("is debt as a percent of assets", () => {
    expect(metricValue({ metric: "debtRatio", accountIds: [] }, accounts)).toBeCloseTo((10000 / 60000) * 100, 6);
    expect(goalDirection({ metric: "debtRatio", accountIds: [] }, accounts)).toBe("decrease");
  });

  it("formats as a percent", () => {
    expect(formatGoalValue("debtRatio", 16.6)).toBe("17%");
    expect(formatGoalValue("netWorth", 1500)).toBe("$1,500");
  });
});

describe("valueOn and valueAtStart", () => {
  const history = [
    { date: "2026-01-01", value: 100 },
    { date: "2026-03-01", value: 300 },
  ];

  it("returns the last value on or before a date", () => {
    expect(valueOn(history, "2026-02-15")).toBe(100);
    expect(valueOn(history, "2025-12-01")).toBeNull();
  });

  it("uses history for a past start date and current values for today", () => {
    const g = { metric: "netWorth" as const, accountIds: [] };
    expect(valueAtStart(g, accounts, history, "2026-02-01", "2026-07-01")).toBe(100);
    expect(valueAtStart(g, accounts, history, "2026-07-01", "2026-07-01")).toBe(50000);
  });
});

describe("validateGoalFields", () => {
  const valid = { ...emptyGoalFields(), title: "Save", targetAmount: 1000 };

  it("accepts a valid goal and trims the title", () => {
    const result = validateGoalFields({ ...valid, title: "  Save  " });
    expect("fields" in result && result.fields.title).toBe("Save");
  });

  it("rejects a missing title", () => {
    expect(validateGoalFields({ ...valid, title: " " })).toEqual({ error: "Title is required" });
  });

  it("requires accounts for the selected accounts metric", () => {
    expect(validateGoalFields({ ...valid, metric: "accounts", accountIds: [] })).toEqual({ error: "Select at least one account" });
  });

  it("requires FIRE inputs and computes the target amount", () => {
    expect("error" in validateGoalFields({ ...valid, targetMode: "fire" })).toBe(true);
    const result = validateGoalFields({ ...valid, targetMode: "fire", fireInputs: fire });
    expect("fields" in result && result.fields.targetAmount).toBe(1000000);
  });

  it("rejects a retirement age that is not after the current age", () => {
    const result = validateGoalFields({ ...valid, targetMode: "coastFire", fireInputs: { ...fire, retirementAge: 30 } });
    expect(result).toEqual({ error: "Retirement age must be more than current age" });
  });

  it("requires a positive amount for a contribution goal", () => {
    expect(validateGoalFields({ ...valid, targetMode: "contribution", targetAmount: 0 })).toEqual({ error: "Amount to add must be more than $0" });
  });

  it("keeps the start date only for contribution goals", () => {
    const fixed = validateGoalFields({ ...valid, startDate: "2026-01-01" });
    const add = validateGoalFields({ ...valid, targetMode: "contribution", startDate: "2026-01-01" });
    expect("fields" in fixed && fixed.fields.startDate).toBeNull();
    expect("fields" in add && add.fields.startDate).toBe("2026-01-01");
  });

  it("only allows a fixed target for debt to assets", () => {
    expect(validateGoalFields({ ...valid, metric: "debtRatio", targetMode: "growing" })).toEqual({
      error: "A debt to assets goal must use a fixed target",
    });
  });

  it("rejects a FIRE goal that tracks debt", () => {
    expect(validateGoalFields({ ...valid, metric: "liabilities", targetMode: "fire", fireInputs: fire })).toEqual({
      error: "A FIRE goal cannot track debt",
    });
  });
});
