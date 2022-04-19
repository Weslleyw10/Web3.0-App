require('@nomiclabs/hardhat-waffle')
require("dotenv").config();

module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/qcvNqP5vCLctXFVN5CpthjPOf9eQJMub',
      accounts: [process.env.ACCOUNT_KEY]
    }
  }
}