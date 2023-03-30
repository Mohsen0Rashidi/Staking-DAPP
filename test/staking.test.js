const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { moveBlock } = require("../utils/move-blocks")
const { moveTime } = require("../utils/move-time")

const SECONDS_IN_A_DAY = 86400
const SECONDS_IN_A_YEAR = 31449600

describe("Staking test", () => {
    let stakingContract, stakingToken, deployer, stakingAmount

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        stakingToken = await ethers.getContract("StakingToken")
        stakingContract = await ethers.getContract("Staking")
        stakingAmount = ethers.utils.parseEther("100000")
    })
    describe("constructor", () => {
        it("Initialized the staking token address correctly", async () => {
            const stakingTokenAddress = await stakingContract.stakingTokenAdd()
            assert.equal(stakingTokenAddress, stakingToken.address)
        })
        it("Initialized the reward token address correctly", async () => {
            const rewardTokenAddress = await stakingContract.stakingTokenAdd()
            assert.equal(rewardTokenAddress, stakingToken.address)
        })
    })
    describe("stake token", () => {
        it("The balance of staker should be updated", async () => {
            await stakingToken.approve(stakingContract.address, stakingAmount)
            const txResponse = await stakingContract.stakeToken(stakingAmount)
            await txResponse.wait(1)
            const stakerBalance = await stakingContract.getBalance(deployer)
            assert.equal(stakerBalance.toString(), stakingAmount)
        })
        it("total supply should be updated", async () => {
            await stakingToken.approve(stakingContract.address, stakingAmount)
            const txResponse = await stakingContract.stakeToken(stakingAmount)
            await txResponse.wait(1)
            const totalSupply = await stakingContract.totalSupply()
            assert.equal(totalSupply.toString(), stakingAmount.toString())
        })
        it("emits an event", async () => {
            await stakingToken.approve(stakingContract.address, stakingAmount)
            await expect(stakingContract.stakeToken(stakingAmount)).to.emit(
                stakingContract,
                "TokenStaked"
            )
        })
        describe("reward per token", () => {
            it("Returns the reward amount of 1 token based time spent locked up", async () => {
                await stakingToken.approve(stakingContract.address, stakingAmount)
                await stakingContract.stakeToken(stakingAmount)
                await moveTime(SECONDS_IN_A_DAY)
                await moveBlock(1)
                let reward = await stakingContract.rewardPerToken()
                let expectedReward = "86"
                assert.equal(reward.toString(), expectedReward)

                await moveTime(SECONDS_IN_A_YEAR)
                await moveBlock(1)
                reward = await stakingContract.rewardPerToken()
                expectedReward = "31536"
                assert.equal(reward.toString(), expectedReward)
            })
        })
        describe("earned", () => {
            it("calculate how much earned in a day and year", async () => {
                await stakingToken.approve(stakingContract.address, stakingAmount)
                await stakingContract.stakeToken(stakingAmount)
                //In a day
                await moveTime(SECONDS_IN_A_DAY)
                await moveBlock(1)
                let earned = await stakingContract.earned(deployer)
                const expectedEarnInDay = "8600000"
                assert.equal(earned.toString(), expectedEarnInDay)

                // In a year
                await moveTime(SECONDS_IN_A_YEAR)
                await moveBlock(1)
                earned = await stakingContract.earned(deployer)
                const expectedEarnInYear = "3153600000"
                assert.equal(earned.toString(), expectedEarnInYear)
            })
        })
        describe("withdraw", () => {
            beforeEach(async () => {
                await stakingToken.approve(stakingContract.address, stakingAmount)
                await stakingContract.stakeToken(stakingAmount)
                await moveTime(SECONDS_IN_A_DAY)
                await moveBlock(1)
            })
            it("the balance should be updated", async () => {
                const withdrawstakingAmount = ethers.utils.parseEther("0.5")
                await stakingContract.withdraw(withdrawstakingAmount)
                const stakerBalance = await stakingContract.getBalance(deployer)
                assert.equal(
                    stakerBalance.toString(),
                    stakingAmount.sub(withdrawstakingAmount).toString()
                )
            })
            it("total supply should be updated", async () => {
                const previousTotalSupply = await stakingContract.totalSupply()
                const withdrawstakingAmount = ethers.utils.parseEther("0.5")
                await stakingContract.withdraw(withdrawstakingAmount)
                const currentTotalSupply = await stakingContract.totalSupply()
                assert.equal(
                    currentTotalSupply.toString(),
                    previousTotalSupply.sub(withdrawstakingAmount).toString()
                )
            })
            it("emits an event", async () => {
                const withdrawstakingAmount = ethers.utils.parseEther("0.5")
                await expect(stakingContract.withdraw(withdrawstakingAmount)).to.emit(
                    stakingContract,
                    "WithdrawStake"
                )
            })
            it("Moves token from the staking contract to the user", async () => {
                const withdrawstakingAmount = ethers.utils.parseEther("0.5")
                const balanceBefore = await stakingToken.balanceOf(deployer)
                await stakingContract.withdraw(withdrawstakingAmount)
                const balanceAfter = await stakingToken.balanceOf(deployer)
                assert.equal(
                    balanceBefore.add(withdrawstakingAmount).toString(),
                    balanceAfter.toString()
                )
            })
        })
        describe("claim rewards", () => {
            it("users can claim their rewards", async () => {
                await stakingToken.approve(stakingContract.address, stakingAmount)
                await stakingContract.stakeToken(stakingAmount)
                await moveTime(SECONDS_IN_A_DAY)
                await moveBlock(1)
                const earned = await stakingContract.earned(deployer)
                const balanceBefore = await stakingToken.balanceOf(deployer)
                await stakingContract.claimReward()
                const balanceAfter = await stakingToken.balanceOf(deployer)
                assert.equal(balanceBefore.add(earned).toString(), balanceAfter.toString())
            })
            it("emits an event", async () => {
                await expect(stakingContract.claimReward()).to.emit(
                    stakingContract,
                    "RewardClaimed"
                )
            })
        })
    })
})
