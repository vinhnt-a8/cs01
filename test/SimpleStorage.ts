import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('SimpleStorage', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [owner, otherAccount] = await ethers.getSigners()
    const SimpleStorage = await ethers.getContractFactory('SimpleStorage')
    const contract = await SimpleStorage.deploy()
    return { contract, owner, otherAccount }
  }

  describe('deployment', function () {
    it('get initial value of uint', async function () {
      const { contract } = await loadFixture(deployFixture)
      expect(await contract.get()).to.equal('')
    })
  })

  describe('get/set the storage', function () {
    describe('calls', function () {
      it('set/get hello world', async function () {
        const { contract } = await loadFixture(deployFixture)
        const message = 'hello world'
        await contract.set(message)
        expect(await contract.get()).to.equal(message)
      })
      it('set long message', async function () {
        const { contract } = await loadFixture(deployFixture)
        const message =
          'this message is really long and exceeds the limit of 64 characters'
        await expect(contract.set(message)).to.be.revertedWith(
          'The message is too long',
        )
      })
    })

    describe('events', function () {
      it('check Set event', async function () {
        const { owner, contract } = await loadFixture(deployFixture)
        const message = 'xin chao'
        await expect(contract.set(message))
          .to.emit(contract, 'Set')
          .withArgs(owner.address, message)
      })
    })
  })
})
