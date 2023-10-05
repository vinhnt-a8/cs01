import { SigningKey, Wallet, randomBytes } from 'ethers'
import { Leaf, Tree } from '../dist'
import { expect } from 'chai'

const leafs: Leaf[] = Array.from(Array(17).keys()).map(
  (i) =>
    new Leaf(
      new Wallet(new SigningKey(randomBytes(32))).address,
      BigInt(i + 1) * 1_000_000_000_000_000_000n,
    ),
)

describe('library', function () {
  it('prove/verify locally', () => {
    const tree = new Tree(leafs)
    const proof = tree.prove(leafs[10])
    const ok = tree.verify(leafs[10], proof)
    expect(ok).to.be.true
  })
})
