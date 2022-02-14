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
    let testNumber = 100


    const balances = [
        {
            currency: 'KAR',
            amount: 10 ** 10,
            precision: 12
        },
        {
            currency: 'ACA',
            amount: 10 ** 10,
            precision: 13
        },
        {
            currency: 'AUSD',
            amount: 10 ** 10,
            precision: 12
        }
    ]
    // Start setting the amount for sudo
    console.log("Start setting the amount for sudo")

    function setupBalance(suite: Suite, config = balances) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.currencies.updateBalance(
                    alice.address,
                    {Token: config.currency},
                    new FixedPointNumber(config.amount, config.precision).toChainData()
                );
            })).map(suite.sudoWarpper)
        );
    }

    await setupBalance(suite)
    console.log("The sudo amount is set")

    //设置listTradingPair
    const pool = [
        {
            token1: 'AUSD',
            token2: 'KAR',
            amount1: testNumber,
            amount2: testNumber,
            amount1Precision: 12,
            amount2Precision: 12,

        }
    ]
    console.log("start listTradingPair")

    function listTradingPair(suite: Suite, config = pool) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.dex.listTradingPair(
                    {Token: config.token1},
                    {Token: config.token2},
                    new FixedPointNumber(0).toChainData(),
                    new FixedPointNumber(0).toChainData(),
                    new FixedPointNumber(config.amount1, config.amount1Precision).toChainData(),
                    new FixedPointNumber(config.amount1, config.amount1Precision).toChainData(),
                    new FixedPointNumber(0).toChainData()
                );
            })).map(suite.sudoWarpper)
        );
    }

    await listTradingPair(suite)
    console.log("ListTradingPair has been enabled")
    console.log("Start transfer $KAR")
    await suite.send(alice, suite.batchWrapper(addressList.map((item) => {
        return suite.api.tx.currencies.transfer(
            item.address, {Token: "KAR"}, new FixedPointNumber(1, 12).toChainData());
    })));
    console.log("transfer $KAR")
    console.log("Start transfer $AUSD")
    await suite.send(alice, suite.batchWrapper(addressList.map((item) => {
        return suite.api.tx.currencies.transfer(
            item.address, {Token: "AUSD"}, new FixedPointNumber(1, 12).toChainData());
    })));
    console.log("transfer $AUSD")
    console.log("Start transfer $ACA")
    await suite.send(alice, suite.batchWrapper(addressList.map((item) => {
        return suite.api.tx.currencies.transfer(
            item.address, {Token: "ACA"}, new FixedPointNumber(10, 13).toChainData());
    })));
    console.log("transfer $ACA")

    console.log("start add_provision")
    await suite.send(suite.sudo, suite.batchWrapper(addressList.map((item) => {
        return suite.api.tx.sudo.sudoAs(item.address, suite.api.tx.dex.addLiquidity(
            {Token: "AUSD"},
            {Token: "KAR"},
            new FixedPointNumber(1, 12).toChainData(),
            new FixedPointNumber(1, 12).toChainData(),
            0,
            false
        ))
    })));
    console.log("add_provision 完成")

    process.exit(0)
})()