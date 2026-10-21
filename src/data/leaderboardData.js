export const LEADERBOARD_METADATA = {
  isDemoData: true,
  noticeText: "DEMO LEADERBOARD — OFFICIAL LIVE RANKINGS WILL SYNC DURING IGNITE 2026 MATCHPLAY.",
  columns: [
    { key: "rank", label: "RANK" },
    { key: "teamName", label: "TEAM NAME" },
    { key: "teamNumber", label: "TEAM ID" },
    { key: "round1Score", label: "R1 (GAUNTLET)" },
    { key: "round2Delta", label: "R2 (HIT LIST)" },
    { key: "combinedScore", label: "TOTAL POINTS" }
  ]
};

export const DEMO_TEAMS = [
  { rank: 1, teamName: "Quantum Vipers", teamNumber: "IGN-042",
round1Score: 48000, round2Delta: 90000, combinedScore: 138000 },
  { rank: 2, teamName: "Apex Sentinels", teamNumber: "IGN-018",
round1Score: 52000, round2Delta: 60000, combinedScore: 112000 },
  { rank: 3, teamName: "Neon Syndicate", teamNumber: "IGN-087",
round1Score: 44000, round2Delta: 60000, combinedScore: 104000 },
  { rank: 4, teamName: "Vortex Vanguard", teamNumber: "IGN-009",
round1Score: 46000, round2Delta: 30000, combinedScore: 76000 },
  { rank: 5, teamName: "Cyber Ronin", teamNumber: "IGN-065",
round1Score: 41000, round2Delta: 30000, combinedScore: 71000 },
  { rank: 6, teamName: "Phantom Protocol", teamNumber: "IGN-031",
round1Score: 39000, round2Delta: 30000, combinedScore: 69000 },
  { rank: 7, teamName: "Titan Shift", teamNumber: "IGN-054",
round1Score: 47000, round2Delta: 0, combinedScore: 47000 },
  { rank: 8, teamName: "Solaris Knights", teamNumber: "IGN-022",
round1Score: 38000, round2Delta: 0, combinedScore: 38000 },
  { rank: 9, teamName: "Glitch Mobsters", teamNumber: "IGN-073",
round1Score: 36000, round2Delta: -30000, combinedScore: 6000 },
  { rank: 10, teamName: "Zero Gravity", teamNumber: "IGN-099",
round1Score: 34000, round2Delta: -30000, combinedScore: 4000 }
];
