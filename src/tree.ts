import { Leaf } from './leaf'
import { Node } from './node'

export class Tree {
  public readonly leafs
  constructor(leafs: Leaf[]) {
    this.leafs = leafs.sort((a, b) => a.gte(b))
  }

  /**
   * Merkle root
   */
  get root() {
    let nodes = this.leafs.map((leaf) => new Node(leaf.value))
    while (nodes.length > 1) {
      const cache: Node[] = []
      for (let i = 0; i < nodes.length; i += 2) {
        if (i + 1 < nodes.length) cache.push(nodes[i].hash(nodes[i + 1]))
        else cache.push(nodes[i])
      }
      nodes = cache
    }
    return nodes[0]
  }

  /**
   * Generate the proof
   * @param leaf Leaf
   * @returns Proof - The list of nodes
   */
  prove(leaf: Leaf) {
    let proof: Node[] = []
    let node = new Node(leaf.value)
    let siblings = this.leafs.map((leaf) => new Node(leaf.value))
    while (!node.eq(this.root)) {
      // Find my sibling
      const index = siblings.findIndex((sibling) => node.eq(sibling))
      if (index === -1) throw new Error('The leaf is not valid.')
      let sibling: Node | undefined = undefined
      if (index % 2 === 1) sibling = siblings[index - 1]
      else if (index + 1 < siblings.length) sibling = siblings[index + 1]
      if (sibling) {
        node = node.hash(sibling)
        proof.push(sibling)
      }
      // Move to upper level
      const cache: Node[] = []
      for (let i = 0; i < siblings.length; i += 2) {
        if (i + 1 < siblings.length)
          cache.push(siblings[i].hash(siblings[i + 1]))
        else cache.push(siblings[i])
      }
      siblings = cache
    }
    return proof
  }

  verify(leaf: Leaf, proof: Node[]) {
    let node = new Node(leaf.value)
    for (let i = 0; i < proof.length; i++) node = node.hash(proof[i])
    return this.root.eq(node)
  }
}
