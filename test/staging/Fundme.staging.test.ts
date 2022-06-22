//we assume we are on the actual test network
//this is the last step of the journey
import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { FundMe__factory, FundMe, MockV3Aggregator } from "../../typechain"
import { assert, expect } from "chai"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { developmentChains } from "../../helper-hardhat.config"

developmentChains.includes(network.name)
  ? //we skip if it is the local network
    describe.skip
  : describe("FundMe", () => {
      let fundMe: FundMe
      let deployer: string
      const sendValue = ethers.utils.parseEther("1")
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        fundMe = await ethers.getContract("FundMe", deployer)
      })

      it("allows people to fund and withdraw", async () => {
        await fundMe.fund({ value: sendValue })
        await fundMe.withdraw()
        const endingBalance = await fundMe.provider.getBalance(fundMe.address)
        assert.equal(endingBalance.toString(), "0")
      })
    })
