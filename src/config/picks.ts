export type PoolPick = {
  participant: string;
  goodGolfer: {
    id: string;
    name: string;
  };
  badGolfer: {
    id: string;
    name: string;
  };
};

export const picks: PoolPick[] = [
  {
    participant: "Trent",
    goodGolfer: {
      id: "46046",
      name: "Scottie Scheffler",
    },
    badGolfer: {
      id: "34046",
      name: "Jordan Spieth",
    },
  },
  {
    participant: "Cole",
    goodGolfer: {
      id: "46046",
      name: "Scottie Scheffler",
    },
    badGolfer: {
      id: "39971",
      name: "Sungjae Im",
    },
  },
  {
    participant: "Kevin",
    goodGolfer: {
      id: "28237",
      name: "Rory McIlroy",
    },
    badGolfer: {
      id: "22405",
      name: "Justin Rose",
    },
  },
  {
    participant: "Erik",
    goodGolfer: {
      id: "48081",
      name: "Xander Schauffele",
    },
    badGolfer: {
      id: "47959",
      name: "Bryson DeChambeau",
    },
  },
  {
    participant: "TJ",
    goodGolfer: {
      id: "48081",
      name: "Xander Schauffele",
    },
    badGolfer: {
      id: "25572",
      name: "Graeme McDowell",
    },
  },
  {
    participant: "Ralph",
    goodGolfer: {
      id: "46970",
      name: "Jon Rahm",
    },
    badGolfer: {
      id: "32102",
      name: "Rickie Fowler",
    },
  },
  {
    participant: "Jared",
    goodGolfer: {
      id: "30911",
      name: "Tommy Fleetwood",
    },
    badGolfer: {
      id: "51634",
      name: "Sahith Theegala",
    },
  },
];
