import { HardhatRuntimeEnvironment } from "hardhat/types"
import {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} from "../helper-hardhat.config"

// This is needed for the hardhatruntime environment to have no errors
import "hardhat-deploy/dist/src/type-extensions"
import { DeployFunction } from "hardhat-deploy/types"

const deployMock: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...")
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      //decimals, _initial answer should be passed to the constructor
      args: [DECIMALS, INITIAL_ANSWER],
    })
  }
  log("Mocks deployed!")
  log("==========================================")
}

deployMock.tags = ["all", "mocks"]
export default deployMock
