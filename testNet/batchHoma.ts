import accounts from "../data/address.json"
import {Keyring} from "@polkadot/api";
import {Suite} from "../suite";
import {FixedPointNumber} from "@acala-network/sdk-core";


(async () => {
    const suite = new Suite();
    const localWS = "wss://kusama-1.polkawallet.io:3000"

    await suite.connect(localWS);

    const Alice = "//Alice"

    await suite.importSudo('uri', Alice);

    const alice = new Keyring({type: 'sr25519'}).addFromMnemonic(Alice);

    let addressList = accounts.map((item) => new Keyring({type: 'sr25519'}).addFromMnemonic(item));


    // 开始设置sudo的金额
    function setupBalanceKar(suite: Suite, address=addressList) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(address.map((address) => {
                return suite.api.tx.currencies.updateBalance(
                    address.address,
                    {Token: "KAR"},
                    new FixedPointNumber(10, 12).toChainData()
                );
            })).map(suite.sudoWarpper)
        );
    }

    function setupBalanceKsm(suite: Suite, address=addressList) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(address.map((address) => {
                return suite.api.tx.currencies.updateBalance(
                    address.address,
                    {Token: "KSM"},
                    new FixedPointNumber(10, 12).toChainData()
                );
            })).map(suite.sudoWarpper)
        );
    }

    function setupBalanceMint(suite: Suite, address=addressList) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(address.map((address) => {
                return suite.api.tx.sudo.sudoAs(
                    address.address,
                    suite.api.tx.homa.mint(
                        new FixedPointNumber(5, 12).toChainData()
                    )
                );
            }))
        );
    }

    function setupBalanceRedeem(suite: Suite, address=addressList) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(address.map((address) => {
                return suite.api.tx.sudo.sudoAs(
                    address.address,
                    suite.api.tx.homa.requestRedeem(
                        new FixedPointNumber(5, 12).toChainData(),
                        false
                    )
                );
            }))
        );
    }

    await setupBalanceKar(suite, addressList)
    console.log("setupBalanceKar success")
    await setupBalanceKsm(suite, addressList)
    console.log("setupBalanceKsm success")
    await setupBalanceMint(suite, addressList)
    console.log("setupBalanceMint success")
    await setupBalanceRedeem(suite, addressList)
    console.log("setupBalanceRedeem success")

    process.exit(0)
})()