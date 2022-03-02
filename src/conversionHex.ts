import {stringToHex, hexToNumber, hexToU8a, hexToString, u8aToHex} from "@polkadot/util";
import {decodeAddress, encodeAddress} from '@polkadot/keyring';

(async () => {
    let name_1 = "Liquid KSM"
    console.log(stringToHex(name_1))
    let name_2 = "LKSM"
    console.log(stringToHex(name_2))        

    let kUSD = [0, 129]
    let hexToken = u8aToHex(new Uint8Array(kUSD))
    console.log(hexToken)
    console.log(hexToU8a(hexToken))

})()