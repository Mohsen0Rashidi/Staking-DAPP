// SPDX-License-Identifier:MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StakingToken is ERC20 {
    uint256 private s_maxSupply;

    constructor(uint256 _maxSupply) ERC20("Staking Token", "ST") {
        s_maxSupply = _maxSupply;
        _mint(msg.sender, s_maxSupply);
    }
}
