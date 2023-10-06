import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Leaf, Tree } from '../dist'

describe('contract', function () {
  async function deployFixture() {
    const [owner, ...receivers] = await ethers.getSigners()
    // Tree
    const leaves: Leaf[] = Array.from(Array(10).keys()).map(
      (i) =>
        new Leaf(
          receivers[i].address,
          BigInt(i + 1) * 1_000_000_000_000_000_000n,
        ),
    )
    const tree = new Tree(leaves)
    // Deploy TestToken
    const TestToken = await ethers.getContractFactory('TestToken')
    const token = await TestToken.deploy()
    // Deploy MerkleDistribution
    const MerkleDistribution = await ethers.getContractFactory(
      'MerkleDistribution',
    )
    const contract = await MerkleDistribution.deploy(
      token.target,
      tree.root.value,
    )
    // Return
    const leaf = leaves[0]
    const amount = leaf.amount
    const receiver = receivers.find(({ address }) => address === leaf.address)
    if (!receiver) throw new Error('Unpected error.')
    return {
      token,
      contract,
      owner,
      amount,
      receiver,
      leaf,
      tree,
    }
  }

  describe('merkle distribution', function () {
    it('get initial value of uint', async function () {
      const { token, contract, tree } = await loadFixture(deployFixture)
      expect(await contract.root()).deep.equal(tree.root.toString())
      expect(await contract.token()).deep.equal(token.target)
    })

    it('fund & claim', async function () {
      const { token, contract, receiver, amount, leaf, tree } =
        await loadFixture(deployFixture)
      // Fund
      await token.transfer(contract.target, amount)
      expect(await token.balanceOf(contract.target)).equal(amount)
      // Generate proof
      const proof = tree.prove(leaf)
      const verified = tree.verify(leaf, proof)
      expect(verified).to.be.true
      // Claim
      await expect(
        contract.connect(receiver).claim(
          amount,
          proof.map((e) => e.value),
        ),
      )
        .to.emit(contract, 'Claim')
        .withArgs(receiver.address, amount)
    })
  })
})
