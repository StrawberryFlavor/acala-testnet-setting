const {Keyring} = require('@polkadot/keyring');
const {u8aConcat, u8aToU8a, stringToU8a, stringToHex, hexToString, u8aToString, compactToU8a, u8aToHex, bnToU8a, numberToU8a} = require('@polkadot/util');
const {blake2AsU8a, decodeAddress, encodeAddress, createKeyDerived} = require('@polkadot/util-crypto')
const BN_LE_16_OPTS = {bitLength: 16, isLe: true};

(async () => {
    function getParaAccountInfo(id: any, keyring: any) {
        const temp = u8aToU8a([...stringToU8a('para'), ...bnToU8a(id), ...new Array(26).fill('\0')]);


        const address42 = keyring.encodeAddress(temp, 42);
        const address8 = keyring.encodeAddress(temp, 8);
        const address2 = keyring.encodeAddress(temp, 2);
        const address0 = keyring.encodeAddress(temp, 0);

        // console.log(`Account, ${u8aToHex(temp)} 42: ${address42}, 8: ${address8} 2: ${address2} 0: ${address0}`);

        return temp;
    };

    const getSiblingAccountInfo = (id: any, keyring: any) => {
        const temp = u8aToU8a([...stringToU8a('sibl'), ...bnToU8a(id), ...new Array(26).fill('\0')]);

        const address42 = keyring.encodeAddress(temp, 42);
        const address8 = keyring.encodeAddress(temp, 8);
        const address2 = keyring.encodeAddress(temp, 2);

        // console.log(`Account, ${u8aToHex(temp)} 42: ${address42}, 8: ${address8} 2: ${address2}`);

        return temp;
    };

    const derivativeAccountId = (who: any, index: any, keyring: any) => {
        const temp = blake2AsU8a(
            u8aConcat(
                stringToU8a('modlpy/utilisuba'),
                who,
                bnToU8a(index, BN_LE_16_OPTS)
            )
        );

        const account = keyring.encodeAddress(temp, 2);

        const address42 = keyring.encodeAddress(temp, 42);
        const address8 = keyring.encodeAddress(temp, 8);
        const address2 = keyring.encodeAddress(temp, 2);
        const address0 = keyring.encodeAddress(temp, 0);

        console.log(`SubAccount ${index}, ${u8aToHex(temp)} 42: ${address42}, 8: ${address8} 2: ${address2} 0: ${address0}`);

        return temp;
    }

    const derivativeHomaAccountId = (who: any, index: any, keyring: any) => {
        const temp = blake2AsU8a(
            u8aConcat(
                stringToU8a('modlpy/utilisuba'),
                who,
                bnToU8a(index, BN_LE_16_OPTS)
            )
        );

        const account = keyring.encodeAddress(temp, 2);

        const address42 = keyring.encodeAddress(temp, 42);
        const address8 = keyring.encodeAddress(temp, 8);
        const address2 = keyring.encodeAddress(temp, 2);
        const address0 = keyring.encodeAddress(temp, 0);

        console.log(`SubAccount ${index}, ${u8aToHex(temp)} 42: ${address42}, 8: ${address8} 2: ${address2} 0: ${address0}`);

        return temp;
    }

    const keyring = new Keyring({type: 'sr25519'});

    const paraChainAccount = getParaAccountInfo(2000, keyring);

    const test = getSiblingAccountInfo(2001, keyring);

    console.log('parachainAccount:' + keyring.encodeAddress(paraChainAccount, 2))
    console.log(createKeyDerived(paraChainAccount, 0));

    derivativeAccountId(paraChainAccount, 0, keyring);
    derivativeHomaAccountId("5EYCAe5fiQJsoL71D8qNrZ7NznTuLKXk24Wjp9pe18su2Yk1 ", 0, keyring)
    derivativeAccountId(paraChainAccount, 1, keyring);
    derivativeAccountId(paraChainAccount, 2, keyring);
    derivativeAccountId(paraChainAccount, 3, keyring);
})()