import ImpermanentLossMitigatorDeployment from './ImpermanentLossMitigator.json';
import { Address } from 'viem';

export const IL_MITIGATOR_ADDRESS = ImpermanentLossMitigatorDeployment.address as Address;
export const IL_MITIGATOR_ABI = ImpermanentLossMitigatorDeployment.abi;