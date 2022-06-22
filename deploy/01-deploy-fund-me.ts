import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { developmentChains, networkConfig } from "../helper-hardhat.config"
import "dotenv/config"
import { verify } from "../utils/verify"

// This is needed for the hardhatruntime environment to have no errors
import "hardhat-deploy/dist/src/type-extensions"

const deployFundMe: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number = network.config.chainId!
  let ethUsdPriceFeedAddress
  if (developmentChains.includes(network.name)) {
    //this is for local test or hardhat tast
    //get the deployed MockV3Aggregator
    const ethUsdAggregator = await deployments.get("MockV3Aggregator")
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[network.name]["ethUsdPriceFeed"]
  }

  //when going for local host or hardhat we need mock

  //if contract doesn't exist we deploy a minimal version for local testing

  const args = [ethUsdPriceFeedAddress]
  log(networkConfig[network.name].blockConfirmations || 0)
  log("dafafaf")
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, //put in pricefeed address,
    log: true,
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  })

  //verification on not localnetwork
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    //verify
    await verify(fundMe.address, args)
  }
  log("=========================================")
}

deployFundMe.tags = ["all", "fundMe"]
export default deployFundMe
