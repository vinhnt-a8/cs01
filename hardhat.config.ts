import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-abi-exporter'

const config: HardhatUserConfig = {
  solidity: '0.8.19',
  abiExporter: {
    path: './abi',
    runOnCompile: true,
    clear: true,
    flat: true,
    only: [':MerkleDistribution$'],
  },
}

export default config
