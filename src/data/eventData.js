export const EVENT_INFO = {
  title: "IGNITE 2026",
  tagline: "YOUR NEXT CHAPTER STARTS HERE.",
  subtagline: "NOT JUST AN EVENT. YOUR ORIGIN STORY.",
  heroCta: "ENTER NOW",
  videoSrc: "/video.mp4",
  intro: {
    heading: "THIS IS IGNITE.",
    body: "IGNITE 2026 is an intense, competitive campus event engineered for thinkers, tacticians, and contenders. Assemble your squad, conquer eight multi-disciplinary zones, duel rivals in head-to-head showdowns, and battle for the ultimate prize pool."
  }
};

export const ROUNDS_DATA = [
  {
    id: "round-1",
    anchor: "gauntlet",
    number: "ROUND 01",
    name: "THE GAUNTLET",
    accentColor: "var(--color-primary-red)",
    badgeColor: "var(--color-yellow)",
    cardBg: "#FFF",
    tagline: "8 ZONES. 8 MINUTES PER ZONE. RACE AGAINST THE CLOCK.",
    instructions: [
      "Your team will be assigned to one of eight zones, A through H.",
      "Every team must visit all eight zones.",
      "Each zone has an eight-minute task window.",
      "Points depend on your verified finishing position within a zone.",
      "Your Round 1 performance determines the leaderboard standings and qualification eligibility under the event's finalized rules."
    ],
    details: {
      overview: "The Gauntlet tests endurance, agility, and cross-functional team synergy across eight diverse challenge arenas. Every squad must execute in every zone under strict timed verification.",
      taskNotice: "Individual task descriptions and sector challenge mechanics will be revealed separately at the event briefing.",
      zones: [
        { id: "A", name: "Zone Alpha", duration: "8 mins", icon: "⚡"
},
        { id: "B", name: "Zone Bravo", duration: "8 mins", icon: "🎯"
},
        { id: "C", name: "Zone Charlie", duration: "8 mins", icon:
"🧩" },
        { id: "D", name: "Zone Delta", duration: "8 mins", icon: "🛡"
},
        { id: "E", name: "Zone Echo", duration: "8 mins", icon: "🚀"
},
        { id: "F", name: "Zone Foxtrot", duration: "8 mins", icon:
"⚙" },
        { id: "G", name: "Zone Golf", duration: "8 mins", icon: "🔥"
},
        { id: "H", name: "Zone Hotel", duration: "8 mins", icon: "🏆"
}
      ],
      scoring: {
        formulaText: "Score = (M - k + 1) × 1,000",
        variables: [
          { symbol: "M", description: "Maximum number of teams assigned to any zone" },
          { symbol: "k", description: "The verified finishing rank of your team in that zone" }
        ],
        zeroScoreCondition: "Teams that fail to complete or officially verify their task within the permitted 8-minute window receive exactly 0 points for that zone."
      }
    }
  },
  {
    id: "round-2",
    anchor: "hitlist",
    number: "ROUND 02",
    name: "THE HIT LIST",
    accentColor: "var(--color-electric-blue)",
    badgeColor: "var(--color-cyan)",
    cardBg: "#FFF",
    tagline: "TOP 30 TEAMS. 4 HEAD-TO-HEAD DUELS. HIGH STAKES.",
    instructions: [
      "The top 30 qualifying teams advance from Round 1.",
      "Each team competes in four one-versus-one duels.",
      "Every duel takes place within its assigned fixture and zone.",
      "A win awards 30,000 points; a loss deducts 30,000 points.",
      "Your Round 2 score is added to your Round 1 score to determine your combined score."
    ],
    details: {
      qualification: "Only the top 30 teams on the Round 1 leaderboard earn their slot on the Hit List grid.",
      duelSlotsCount: 4,
      pointDelta: 30000,
      duelStructure: [
        { slot: "DUEL 01", label: "Opening Showdown", status: "FIXTURE SCHEDULE PENDING", pointsWin: "+30,000", pointsLoss: "-30,000" },
        { slot: "DUEL 02", label: "Mid-Round Clash", status: "FIXTURE SCHEDULE PENDING", pointsWin: "+30,000", pointsLoss: "-30,000" },
        { slot: "DUEL 03", label: "Championship Pivot", status:
"FIXTURE SCHEDULE PENDING", pointsWin: "+30,000", pointsLoss:
"-30,000" },
        { slot: "DUEL 04", label: "Final Reckoning", status: "FIXTURE SCHEDULE PENDING", pointsWin: "+30,000", pointsLoss: "-30,000" }
      ]
    }
  },
  {
    id: "round-3",
    anchor: "powerplay",
    number: "ROUND 03",
    name: "THE POWER PLAY",
    accentColor: "var(--color-yellow)",
    badgeColor: "var(--color-lavender)",
    cardBg: "#FFF",
    tagline: "WITH GREAT POWER COMES GREAT RESPONSIBILITY.",
    instructions: [
      "High-stakes entrepreneurship and strategic arena.",
      "Calculated risk-taking, resource allocation, and team ambition.",
      "Format and final match mechanics under development.",
      "Confidential briefing revealed exclusively to finalists.",
      "The crowning stage of the IGNITE 2026 championship."
    ],
    details: {
      headline: "WITH GREAT POWER COMES GREAT RESPONSIBILITY.",
      statusLabel: "DETAILS COMING SOON",
      prizePoolMessage: "A PRIZE POOL WORTH THE FIGHT.",
      themeNotes: "Emphasizing entrepreneurial audacity, tactical decision-making, and high-impact campus leadership."
    }
  }
];
