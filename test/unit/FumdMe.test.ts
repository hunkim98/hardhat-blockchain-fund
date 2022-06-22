import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { FundMe__factory, FundMe, MockV3Aggregator } from "../../typechain"
import { assert, expect } from "chai"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { developmentChains } from "../../helper-hardhat.config"

//this is testing for local
!developmentChains.includes(network.name)
  ? //we skip if it is the real network
    describe.skip
  : describe("FundMe", () => {
      let fundMe: FundMe
      let deployer: string
      let mockV3Aggregator: MockV3Aggregator
      const sendValue = ethers.utils.parseEther("1") //1ETH
      beforeEach(async () => {
        //first we must deploy our contracts locally
        //deploy all contracts
        // const accounts = await ethers.getSigners() //this gives accounts signed
        // deployer = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        console.log("deployerfinished", deployer)
        await deployments.fixture(["all"])
        console.log("finished deploying all")
        //get Contract gives the most recently deployed contract
        fundMe = await ethers.getContract("FundMe")
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
      })
      describe("constructor", async () => {
        //this test will only be for the constructor
        it("sets the aggregator addresses correctly", async () => {
          const response = await fundMe.getPriceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })
      })

      describe("fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "FundMe__NotEnoughMoney"
          )
        })
        it("updated the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getAddressToAmountFunded(deployer)
          assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of funders", async () => {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, deployer)
        })
      })

      describe("withdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue })
        })

        it("Withdraw ETH from a single founder", async () => {
          //Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)

          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          //Assert
          assert.equal(endingFundMeBalance.toString(), "0")
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
        })
        it("allows us to withdraw with multiple funders", async () => {
          //Arrange
          const accounts = await ethers.getSigners()
          for (let i = 0; i < 6; i++) {
            const fundMeConnectedContract = fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)

          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Assert
          assert.equal(endingFundMeBalance.toString(), "0")
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
          await expect(fundMe.getFunder(0)).to.be.reverted
          for (let i = 1; i < 6; i++) {
            assert.equal(
              (
                await fundMe.getAddressToAmountFunded(accounts[i].address)
              ).toString(),
              "0"
            )
          }
        })

        it("Only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = fundMe.connect(attacker)
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          )
        })

        it("cheaperWithdraw testing...", async () => {
          //Arrange
          const accounts = await ethers.getSigners()
          for (let i = 0; i < 6; i++) {
            const fundMeConnectedContract = fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Act
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)

          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Assert
          assert.equal(endingFundMeBalance.toString(), "0")
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
          await expect(fundMe.getFunder(0)).to.be.reverted
          for (let i = 1; i < 6; i++) {
            assert.equal(
              (
                await fundMe.getAddressToAmountFunded(accounts[i].address)
              ).toString(),
              "0"
            )
          }
        })
      })

      it("Withdraw ETH from a single founder(cheaper)", async () => {
        //Arrange
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        )

        //Act
        const transactionResponse = await fundMe.cheaperWithdraw()
        const transactionReceipt = await transactionResponse.wait(1)

        const { gasUsed, effectiveGasPrice } = transactionReceipt
        const gasCost = gasUsed.mul(effectiveGasPrice)

        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
        //Assert
        assert.equal(endingFundMeBalance.toString(), "0")
        assert.equal(
          startingFundMeBalance.add(startingDeployerBalance).toString(),
          endingDeployerBalance.add(gasCost).toString()
        )
      })
    })
