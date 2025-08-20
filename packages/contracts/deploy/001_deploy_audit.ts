import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployAudit: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log('🚀 Deploying SeiAgentGuardAudit contract...');
  console.log('Network:', hre.network.name);
  console.log('Deployer:', deployer);
  console.log('Deployer balance:', await hre.ethers.provider.getBalance(deployer));

  try {
    const result = await deploy('SeiAgentGuardAudit', {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
      waitConfirmations: 2,
    });

    console.log('✅ SeiAgentGuardAudit deployed successfully!');
    console.log('Contract address:', result.address);
    console.log('Transaction hash:', result.transactionHash);
    console.log('Gas used:', result.receipt?.gasUsed?.toString());
    
    // Verify deployment
    if (result.newlyDeployed) {
      console.log('🎉 Contract is newly deployed!');
      
      // Get contract instance and verify basic functionality
      const contract = await hre.ethers.getContract('SeiAgentGuardAudit');
      const owner = await contract.owner();
      const maxSeverity = await contract.maxSeverity();
      
      console.log('Contract owner:', owner);
      console.log('Max severity:', maxSeverity.toString());
      
      // Verify owner is deployer
      if (owner.toLowerCase() === deployer.toLowerCase()) {
        console.log('✅ Owner verification passed');
      } else {
        console.log('❌ Owner verification failed');
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
};

export default deployAudit;
deployAudit.tags = ['SeiAgentGuardAudit'];
deployAudit.id = '001_deploy_audit';
