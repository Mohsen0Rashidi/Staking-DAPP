const { getNamedAccounts, deployments, network, ethers } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let staking
    const stakingToken = await ethers.getContract("StakingToken")
    const arguments = [stakingToken.address, stakingToken.address]
    staking = await deploy("Staking", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("Staking Contract Deployed!")

    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        await verify(staking.address, arguments)
        log("Contract Verified")
    }
    log("-------------------------------------------------------")
}

module.exports.tags = ["all", "staking"]
