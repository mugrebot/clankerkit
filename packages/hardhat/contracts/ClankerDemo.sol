// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ClankerToken
 * @dev Basic ERC20 Token used for demo
 */
contract ClankerToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) {
        _mint(initialOwner, 1000000 * 10 ** decimals());
    }
}

/**
 * @title ClankerDemo
 * @dev Demonstrates Clanker's core functionality of token deployment and LP creation
 */
contract ClankerDemo is Ownable {
    struct TokenInfo {
        address tokenAddress;
        address lpAddress;
        address lockerAddress;
        address creator;
        uint256 timestamp;
        uint256 claimableAmount;
    }

    // Mapping of token symbol to token info
    mapping(string => TokenInfo) public tokens;
    string[] public tokenSymbols;

    // Fee configuration
    uint256 public constant CLANKER_FEE_SHARE = 60; // 60% to Clanker
    uint256 public constant USER_FEE_SHARE = 40;    // 40% to user

    event TokenDeployed(
        string symbol,
        address tokenAddress,
        address lpAddress,
        address lockerAddress,
        address creator
    );

    event FeesDistributed(
        address token,
        uint256 clankerShare,
        uint256 userShare,
        address user
    );

    event FeesClaimed(
        string symbol,
        address token,
        uint256 amount,
        address claimer
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deploys a new token and simulates LP creation
     * @param name Token name
     * @param symbol Token symbol
     */
    function deployToken(
        string memory name,
        string memory symbol
    ) external returns (address) {
        require(tokens[symbol].tokenAddress == address(0), "Token symbol already exists");
        
        // Deploy new token
        ClankerToken newToken = new ClankerToken(name, symbol, msg.sender);
        
        // In a real implementation, this would:
        // 1. Create LP on Base (using Uniswap/etc)
        // 2. Lock LP tokens
        // 3. Set up fee distribution
        address mockLpAddress = address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp)))));
        address mockLockerAddress = address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp + 1)))));
        
        // Store token info
        tokens[symbol] = TokenInfo({
            tokenAddress: address(newToken),
            lpAddress: mockLpAddress,
            lockerAddress: mockLockerAddress,
            creator: msg.sender,
            timestamp: block.timestamp,
            claimableAmount: 0
        });
        
        tokenSymbols.push(symbol);
        
        emit TokenDeployed(symbol, address(newToken), mockLpAddress, mockLockerAddress, msg.sender);
        
        return address(newToken);
    }

    /**
     * @dev Simulates fee distribution from LP
     * @param symbol Token symbol
     * @param amount Total fee amount to distribute
     */
    function simulateFeeDist(string memory symbol, uint256 amount) external {
        require(tokens[symbol].tokenAddress != address(0), "Token does not exist");
        
        uint256 clankerShare = (amount * CLANKER_FEE_SHARE) / 100;
        uint256 userShare = amount - clankerShare;
        
        // Add to claimable amount
        tokens[symbol].claimableAmount += userShare;
        
        emit FeesDistributed(
            tokens[symbol].tokenAddress,
            clankerShare,
            userShare,
            tokens[symbol].creator
        );
    }

    /**
     * @dev Claims accumulated fees for a token
     * @param symbol Token symbol
     */
    function claimFees(string memory symbol) external {
        require(tokens[symbol].tokenAddress != address(0), "Token does not exist");
        require(tokens[symbol].creator == msg.sender, "Not the token creator");
        require(tokens[symbol].claimableAmount > 0, "No fees to claim");

        uint256 amount = tokens[symbol].claimableAmount;
        tokens[symbol].claimableAmount = 0;

        emit FeesClaimed(
            symbol,
            tokens[symbol].tokenAddress,
            amount,
            msg.sender
        );
    }

    /**
     * @dev Gets claimable amount for a token
     * @param symbol Token symbol
     */
    function getClaimableAmount(string memory symbol) external view returns (uint256) {
        require(tokens[symbol].tokenAddress != address(0), "Token does not exist");
        return tokens[symbol].claimableAmount;
    }

    /**
     * @dev Get all deployed tokens
     */
    function getAllTokens() external view returns (TokenInfo[] memory) {
        TokenInfo[] memory allTokens = new TokenInfo[](tokenSymbols.length);
        
        for (uint i = 0; i < tokenSymbols.length; i++) {
            allTokens[i] = tokens[tokenSymbols[i]];
        }
        
        return allTokens;
    }
} 