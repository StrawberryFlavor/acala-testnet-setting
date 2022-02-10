import {decodeAddress, encodeAddress} from '@polkadot/keyring';

export const isValidAddress = (target: string): boolean => {
    try {
        substrateAddress(target);
    } catch (e) {
        return false;
    }

    return true;
};


export function substrateAddress(address: string) {
    return encodeAddress(decodeAddress(address))
}

