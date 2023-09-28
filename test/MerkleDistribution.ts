import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { AbiCoder, hexlify, keccak256, randomBytes, toBeArray } from 'ethers'
import { ethers } from 'hardhat'
import { xor } from '../src/utils'

describe('SimpleStorage', function () {
  const abiCoder = new AbiCoder()

  const deriveMerkleRoot = (children: Uint8Array[]): Uint8Array => {
    if (!children.length) throw new Error('Invalid input.')
    const clone = [...children]
    const upper: Uint8Array[] = []
    // Terminate
    if (clone.length === 1) return clone[0]
    // Recursive
    while (true) {
      const left = clone.shift()
      if (left) {
        const right = clone.shift()
        if (right) upper.push(toBeArray(keccak256(xor(left, right))))
        else upper.push(left)
      } else {
        return deriveMerkleRoot(upper)
      }
    }
  }

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [owner, otherAccount] = await ethers.getSigners()
    // Deploy TestToken
    const TestToken = await ethers.getContractFactory('TestToken')
    const token = await TestToken.deploy()
    // Deploy MerkleDistribution
    const MerkleDistribution = await ethers.getContractFactory(
      'MerkleDistribution',
    )
    const nodes = [
      toBeArray(
        keccak256(
          abiCoder.encode(['address', 'uint'], [owner.address, 1000000]),
        ),
      ),
      randomBytes(32),
      randomBytes(32),
      randomBytes(32),
      randomBytes(32),
    ]
    const merkleRoot = deriveMerkleRoot(nodes)
    const contract = await MerkleDistribution.deploy(token.target, merkleRoot)
    // Return
    return { token, contract, owner, otherAccount, merkleRoot, nodes }
  }

  describe('deployment', function () {
    it('get initial value of uint', async function () {
      const { token, contract, merkleRoot } = await loadFixture(deployFixture)
      expect(await contract.root()).deep.equal(hexlify(merkleRoot))
      expect(await contract.token()).deep.equal(token.target)
    })

    it('fund the contract', async function () {
      const balance = 1000000n
      const { token, contract } = await loadFixture(deployFixture)
      await token.transfer(contract.target, balance)
      expect(await token.balanceOf(contract.target)).equal(balance)
    })
  })

  // describe('get/set the storage', function () {
  //   describe('calls', function () {
  //     it('set/get hello world', async function () {
  //       const { contract } = await loadFixture(deployFixture)
  //       const message = 'hello world'
  //       await contract.set(message)
  //       expect(await contract.get()).to.equal(message)
  //     })
  //     it('set long message', async function () {
  //       const { contract } = await loadFixture(deployFixture)
  //       const message =
  //         'this message is really long and exceeds the limit of 64 characters'
  //       await expect(contract.set(message)).to.be.revertedWith(
  //         'The message is too long',
  //       )
  //     })
  //   })

  //   describe('events', function () {
  //     it('check Set event', async function () {
  //       const { owner, contract } = await loadFixture(deployFixture)
  //       const message = 'xin chao'
  //       await expect(contract.set(message))
  //         .to.emit(contract, 'Set')
  //         .withArgs(owner.address, message)
  //     })
  //   })
  // })
})
