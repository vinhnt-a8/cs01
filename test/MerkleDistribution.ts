import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { AbiCoder, hexlify, keccak256, randomBytes, toBeArray } from 'ethers'
import { ethers } from 'hardhat'
import { xor } from '../src/utils'

describe('SimpleStorage', function () {
  const abiCoder = new AbiCoder()

  function deriveMerkleRoot(children: Uint8Array[]): Uint8Array {
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
    const amount = 1000000n
    const [owner, receiver] = await ethers.getSigners()
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
          toBeArray(
            abiCoder.encode(['address', 'uint'], [receiver.address, amount]),
          ),
        ),
      ),
      randomBytes(32),
      randomBytes(32),
      randomBytes(32),
    ]
    const merkleRoot = deriveMerkleRoot(nodes)
    const contract = await MerkleDistribution.deploy(token.target, merkleRoot)
    // Return
    return { token, contract, owner, amount, receiver, merkleRoot, nodes }
  }

  describe('merkle distribution', function () {
    it('get initial value of uint', async function () {
      const { token, contract, merkleRoot } = await loadFixture(deployFixture)
      expect(await contract.root()).deep.equal(hexlify(merkleRoot))
      expect(await contract.token()).deep.equal(token.target)
    })

    it('fund & claim', async function () {
      const { token, contract, receiver, amount, nodes } = await loadFixture(
        deployFixture,
      )
      // Fund (because each interaction is a sandbox)
      await token.transfer(contract.target, amount)
      expect(await token.balanceOf(contract.target)).equal(amount)
      // Claim
      const proofs: Uint8Array[] = [
        nodes[1],
        toBeArray(keccak256(xor(nodes[2], nodes[3]))),
      ]
      await expect(contract.connect(receiver).claim(amount, proofs))
        .to.emit(contract, 'Claim')
        .withArgs(receiver.address, amount)
    })
  })
})
