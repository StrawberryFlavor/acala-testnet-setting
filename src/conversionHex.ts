import {stringToHex, hexToNumber, hexToU8a, hexToString, u8aToHex} from "@polkadot/util";

(async () => {
    let name_1 = "Moonbase Alpha"
    console.log(stringToHex(name_1))
    let name_2 = "DEV"
    console.log(stringToHex(name_2))        

    console.log(u8aToHex(new Uint8Array([0, 129])))
    console.log(hexToU8a("0x0081"))
})()