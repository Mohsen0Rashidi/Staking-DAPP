const { network } = require("hardhat")

async function moveTime(amount) {
    await network.provider.send("evm_increaseTime", [amount])
}

module.exports = {
    moveTime,
}
