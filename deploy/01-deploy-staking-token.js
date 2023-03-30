const { getNamedAccounts, deployments, network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const maxSupply = "1000000000000000000000000"
    const stakingToken = await deploy("StakingToken", {
        from: deployer,
        args: [maxSupply],
        log: true,
    })
    log("Staking Token Contract Deployed!")
    log("--------------------------------------------")
}
module.exports.tags = ["all", "stakingtoken"]
