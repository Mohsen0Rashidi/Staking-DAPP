// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

error Staking__TransferFailed();
error Staking__NeedsMoreThanZero();

contract Staking is ReentrancyGuard {
    IERC20 private immutable i_stakingToken;
    IERC20 private immutable i_rewardToken;

    uint256 private s_totalSupply;
    uint256 private s_rewardPerTokenStored;
    uint256 private s_lastUpdateTime;
    uint256 private REWARD_RATE = 100;

    // A mapping of address how much they staked
    mapping(address => uint256) private s_balances;
    // A mapping of how much each address has been paid
    mapping(address => uint256) private s_userRewardPerTokenPaid;
    // A mapping of how much rewards each user has to claim
    mapping(address => uint256) private s_rewards;

    event TokenStaked(address indexed user, uint256 indexed amount);
    event WithdrawStake(address indexed user, uint256 indexed amount);
    event RewardClaimed(address indexed user, uint256 indexed amount);

    modifier moreThanZero(uint256 amount) {
        if (amount == 0) {
            revert Staking__NeedsMoreThanZero();
        }
        _;
    }

    modifier updateReward(address account) {
        s_rewardPerTokenStored = rewardPerToken();
        s_lastUpdateTime = block.timestamp;
        s_rewards[account] = earned(account);
        s_userRewardPerTokenPaid[account] = s_rewardPerTokenStored;

        _;
    }

    constructor(address stakingToken, address rewardToken) {
        i_stakingToken = IERC20(stakingToken);
        i_rewardToken = IERC20(rewardToken);
    }

    /**
     * @notice Deposit tokens into this contract
     * @param amount | How much to stake
     */
    function stakeToken(
        uint256 amount
    ) external updateReward(msg.sender) nonReentrant moreThanZero(amount) {
        s_balances[msg.sender] += amount;
        s_totalSupply += amount;
        emit TokenStaked(msg.sender, amount);
        bool success = i_stakingToken.transferFrom(msg.sender, address(this), amount);
        if (!success) {
            revert Staking__TransferFailed();
        }
    }

    /**
     * @notice How much reward a token gets based on how long it's been in and during which "snapshots"
     */
    function rewardPerToken() public view returns (uint256) {
        if (s_totalSupply == 0) {
            return s_rewardPerTokenStored;
        }
        return
            s_rewardPerTokenStored +
            (((block.timestamp - s_lastUpdateTime) * REWARD_RATE * 1e18) / s_totalSupply);
    }

    /**
     * @notice How much rewards each user has earned
     * @param account | Address of staker
     */
    function earned(address account) public view returns (uint256) {
        uint256 currentBalance = s_balances[account];
        uint256 currentReward = rewardPerToken();
        uint256 pastRewards = s_rewards[account];
        uint256 amountPaid = s_userRewardPerTokenPaid[account];
        return ((currentBalance * (currentReward - amountPaid)) / 1e18) + pastRewards;
    }

    /**
     * @notice Withdraw tokens from this contract
     * @param amount | How much to withdraw
     */
    function withdraw(
        uint256 amount
    ) external updateReward(msg.sender) nonReentrant moreThanZero(amount) {
        s_balances[msg.sender] -= amount;
        s_totalSupply -= amount;
        emit WithdrawStake(msg.sender, amount);
        bool success = i_stakingToken.transfer(msg.sender, amount);
        if (!success) {
            revert Staking__TransferFailed();
        }
    }

    /**
     * @notice user claim their tokens
     */
    function claimReward() external updateReward(msg.sender) nonReentrant {
        uint256 reward = s_rewards[msg.sender];
        s_rewards[msg.sender] = 0;
        emit RewardClaimed(msg.sender, reward);
        bool success = i_rewardToken.transfer(msg.sender, reward);
        if (!success) {
            revert Staking__TransferFailed();
        }
    }

    function stakingTokenAdd() public view returns (IERC20) {
        return i_stakingToken;
    }

    function rewardTokenAdd() public view returns (IERC20) {
        return i_rewardToken;
    }

    function getBalance(address user) public view returns (uint256) {
        return s_balances[user];
    }

    function totalSupply() public view returns (uint256) {
        return s_totalSupply;
    }
}
