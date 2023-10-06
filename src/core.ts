import { Contract, Provider } from 'ethers'

import { Tree } from './tree'
import abi from '../abi/MerkleDistribution.json'

/**
 * Merkle distribution
 */
export class MerkleDistribution {
  public readonly contract: Contract
  constructor(public readonly tree: Tree, provider: Provider) {
    this.contract = new Contract('0xaddress', abi, provider)
  }
}
