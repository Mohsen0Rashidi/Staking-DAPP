const { network } = require("hardhat")

async function moveBlock(amount) {
    for (let i = 0; i < amount; i++) {
        await network.provider.send("evm_mine", [])
    }
}

module.exports = {
    moveBlock,
}
