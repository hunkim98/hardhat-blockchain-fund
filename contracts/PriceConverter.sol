//creating a library
//SPDX-License-Identifier: MIT

//to use PriceConverter you must only test on Injected Web3 since this does not exist in Virtual Machine
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

pragma solidity ^0.8.0;

library PriceConverter {
  function getPrice(AggregatorV3Interface priceFeed)
    public
    view
    returns (uint256)
  {
    //ABI
    //Address 	0x8A753747A1Fa494EC906cE90E9f37563A8AF630e //docs.chain.link
    (, int256 price, , , ) = priceFeed.latestRoundData(); //sort of destructuring, we extract price from it
    return uint256(price * 1e10);
  }

  function getConversionRate(uint256 ethAmount, AggregatorV3Interface priceFeed)
    internal
    view
    returns (uint256)
  {
    //finds eth worth in usd
    uint256 ethPrice = getPrice(priceFeed); //has additional 18 decimal points
    uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
    return ethAmountInUsd;
  }
}
