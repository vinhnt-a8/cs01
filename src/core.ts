import { Contract, ContractRunner } from 'ethers'

import { Tree } from './tree'
import abi from '../abi/MerkleDistribution.json'

/**
 * Merkle distribution
 */
export class MerkleDistribution {
  public readonly tree: Tree
  public readonly contract: Contract

  constructor({
    tree,
    wallet,
    contractAddress = '0x83A3D0C9c4508f1be74693f8D97478411bcc5818',
  }: {
    tree: Tree
    wallet: ContractRunner
    contractAddress?: string
  }) {
    this.tree = tree
    this.contract = new Contract(contractAddress, abi, wallet)
  }

  async token(): Promise<string> {
    const address = await this.contract.token()
    return address
  }

  async verify(address: string): Promise<boolean> {
    const leaf = this.tree.leaves.find((leaf) => leaf.address === address)
    if (!leaf) return false
    const proof = this.tree.prove(leaf)
    const verified = this.tree.verify(leaf, proof)
    if (!verified) return false
    const claimed = await this.contract.claimed(address)
    if (claimed) return false
    return true
  }

  async claim(address: string) {
    const leaf = this.tree.leaves.find((leaf) => leaf.address === address)
    if (!leaf) throw new Error('Invalid receiver')
    const proof = this.tree.prove(leaf)
    await this.contract.claim(
      leaf.amount,
      proof.map((e) => e.value),
    )
  }
}
