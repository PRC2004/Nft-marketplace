require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.4",
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test",
  },
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: [
        "0x6e48dbf6dfcbdcd5c630859bf8e1461cb7f2ac7a86be13628b7f2c1627ae7ae8",
      ],
    },
  },
};
