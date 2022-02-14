import {Suite} from "../suite";
import {Keyring} from '@polkadot/api';
import {FixedPointNumber, Token} from '@acala-network/sdk-core';


(async () => {
    const suite = new Suite();
    const localWS = "wss://kusama-1.polkawallet.io:3000"
    await suite.connect(localWS);
    const kar_sudo = "//Alice"
    await suite.importSudo('uri', kar_sudo);

    const faucet = new Keyring({type: 'sr25519'}).addFromMnemonic(kar_sudo);


    const stabilityFee = new FixedPointNumber(0.03).div(
        new FixedPointNumber(365 * 24 * 60 * 60)
    );

    let alice = new Keyring({type: 'sr25519'}).addFromMnemonic("//Alice")
    let bob = new Keyring({type: 'sr25519'}).addFromMnemonic("//Bob")
    let charlie = new Keyring({type: 'sr25519'}).addFromMnemonic("//Charlie")
    let dave = new Keyring({type: 'sr25519'}).addFromMnemonic("//Dave")
    let eve = new Keyring({type: 'sr25519'}).addFromMnemonic("//Eve")

    let oracler = [alice]
    let oraclerAddress = [alice.address, bob.address, charlie.address, dave.address, eve.address]

    // set Oracler
    function setOracler(suite: Suite) {
        let tx = suite.api.tx.sudo.sudo(
            suite.api.tx.operatorMembershipAcala.resetMembers(oraclerAddress)
        )
        suite.send(alice, tx)
    }

    // await setOracler(suite)

    // set balance
    function setOraclerBalance(suite: Suite, config = oraclerAddress) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.currencies.updateBalance(
                    config,
                    {Token: "KAR"},
                    new FixedPointNumber(10, 12).toChainData()
                );
            })).map(suite.sudoWarpper)
        );
    }

    // await setOraclerBalance(suite)

    let symbolPrice = [
        [
            {
                Token: "KSM"
            },
            200 * 10 ** 18
        ]
    ]

    async function setOraclePrice(suite: Suite) {
        let tx = suite.api.tx.acalaOracle.feedValues(
            symbolPrice
        )
        for (const sender of oracler) {
            await suite.send(sender, tx)
        }

    }
    // Oracle
    await setOraclePrice(suite)


    const symbolPrecision = {
        "KAR": 12,
        "AUSD": 12,
        "KSM": 12,
        "LKSM": 12,
        "RENBTC": 8,
    }

    const loanConfigs = [
        {
            asset: {"Token": 'KSM'},
            requiredRatio: 2,
            stabilityFee,
            liquidationPenalty: 0.17,
            liquidationRatio: 1.85,
            maximunTotalDebitValue: 1 * 10 ** 8
        },
        // {
        //     asset: {"Token": 'LKSM'},
        //     requiredRatio: 2,
        //     stabilityFee,
        //     liquidationPenalty: 0.17,
        //     liquidationRatio: 1.85,
        //     maximunTotalDebitValue: 1 * 10 ** 8
        // },
        // {
        //     asset: {"LiquidCrowdloan": 13},
        //     requiredRatio: 2,
        //     stabilityFee,
        //     liquidationPenalty: 0.17,
        //     liquidationRatio: 1.85,
        //     maximunTotalDebitValue: 1 * 10 ** 8
        // },
        // {
        //     asset: {"Token": 'DOT'},
        //     requiredRatio: 2,
        //     stabilityFee,
        //     liquidationPenalty: 0.17,
        //     liquidationRatio: 1.85,
        //     maximunTotalDebitValue: 1 * 10 ** 8
        // },
        // {
        //     asset: {"Token": 'LDOT'},
        //     requiredRatio: 2,
        //     stabilityFee,
        //     liquidationPenalty: 0.17,
        //     liquidationRatio: 1.85,
        //     maximunTotalDebitValue: 1 * 10 ** 8
        // },
        // {
        //     asset: {"Token": 'KAR'},
        //     requiredRatio: 2,
        //     stabilityFee,
        //     liquidationPenalty: 0.17,
        //     liquidationRatio: 1.85,
        //     maximunTotalDebitValue: 1 * 10 ** 8
        // },
    ]

    // Setting CDP Parameters
    function setupLoans(suite: Suite, config = loanConfigs) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.cdpEngine.setCollateralParams(
                    config.asset,
                    {newValue: config.stabilityFee.toChainData()},
                    {newValue: new FixedPointNumber(config.liquidationRatio).toChainData()},
                    {newValue: new FixedPointNumber(config.liquidationPenalty).toChainData()},
                    {newValue: new FixedPointNumber(config.requiredRatio).toChainData()},
                    {newValue: new FixedPointNumber(config.maximunTotalDebitValue).toChainData()}
                );
            })).map(suite.sudoWarpper)
        );
    }

    // Setting the LoansIncentives
    function setupLoansIncentives(suite: Suite) {
        return suite.send(
            suite.sudo,
            suite.api.tx.incentives.updateIncentiveRewards(
                ["LoansIncentive", {Token: "LKSM"}, new FixedPointNumber(1, 12).toChainData()]
            )
        )
    }

    const dexIncentiveConfig = [
        {
            token1: 'KAR',
            token2: 'KSM',
            amount: 1.5
        },
        {
            token1: 'KUSD',
            token2: 'KSM',
            amount: 3

        }
    ]

    // Setting the DexIncentiveIncentives
    function setupDexIncentiveIncentives(suite: Suite, config = dexIncentiveConfig) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.incentives.updateIncentiveRewards(
                    [{"DexIncentive": {DEXShare: [{Token: config.token1}, {Token: config.token2}]}}, new FixedPointNumber(config.amount, 12).toChainData()]
                );
            })).map(suite.sudoWarpper)
        );
    }

    function setupLoansIncentive(suite: Suite) {
        return suite.send(
            suite.sudo,
            suite.api.tx.incentives.updateIncentiveRewards(
                [{"LoansIncentive": {Token: "LKSM"}}, new FixedPointNumber(1, 12).toChainData()]
            )
        )
    }

    // Setting the PayoutDeductionRatesLoans
    function setupPayoutDeductionRatesLoans(suite: Suite) {
        return suite.send(
            suite.sudo,
            suite.api.tx.incentives.updateDexSavingRewards(
                [{"LoansIncentive": {Token: "LKSM"}}, new FixedPointNumber(30, 18).toChainData()]
            )
        )
    }

    //
    function setupUpdateDexSavingRewards(suite: Suite) {
        return suite.send(
            suite.sudo,
            suite.api.tx.incentives.dexSavingRewardRate(
                [
                    [
                        {
                            DexSaving: {
                                DEXShare: [
                                    {
                                        Token: "KUSD"
                                    },
                                    {
                                        Token: "KSM"
                                    }
                                ]
                            }
                        }
                    ],
                    new FixedPointNumber(56238214645).toChainData()
                ]
            )
        )
    }

    const payoutDeductionRateConfig = [
        {
            token1: 'KAR',
            token2: 'KSM',
            rate: 50
        },
        {
            token1: 'KUSD',
            token2: 'KSM',
            rate: 30

        }
    ]

    function setupPayoutDeductionRates(suite: Suite, config = payoutDeductionRateConfig) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.incentives.updateDexSavingRewards(
                    [{"DexIncentive": {DEXShare: [{Token: config.token1}, {Token: config.token2}]}}, new FixedPointNumber(config.rate, 18).toChainData()]
                );
            })).map(suite.sudoWarpper)
        );
    }


    const targetLiquidityPool = [
        {
            token1: 'KAR',
            token2: 'KSM',
            amount1: 10 ** 1,
            amount2: 10 * 10 ** 1,
            amount1Precision: symbolPrecision.KAR,
            amount2Precision: symbolPrecision.KSM,

        },
        {
            token1: 'KSUD',
            token2: 'KSM',
            amount1: 400 * 100 ** 1,
            amount2: 100 ** 1,
            amount1Precision: symbolPrecision.AUSD,
            amount2Precision: symbolPrecision.KSM,

        }
    ]

    // enable TradingPair
    function enableTradingPair(suite: Suite, config = targetLiquidityPool) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.dex.enableTradingPair(
                    {Token: config.token1},
                    {Token: config.token2},
                );
            })).map(suite.sudoWarpper)
        );

    }

    // addLiquidity
    function addLiquidity(suite: Suite, config = targetLiquidityPool) {
        return suite.send(
            faucet,
            suite.batchWrapper(config.map((config) => {
                console.log({Token: config.token1},
                    {Token: config.token2},
                    new FixedPointNumber(config.amount1, config.amount1Precision).toChainData(),
                    new FixedPointNumber(config.amount2, config.amount2Precision).toChainData()
                )
                return suite.api.tx.dex.addLiquidity(
                    {Token: config.token1},
                    {Token: config.token2},
                    new FixedPointNumber(config.amount1, config.amount1Precision).toChainData(),
                    new FixedPointNumber(config.amount2, config.amount2Precision).toChainData(),
                    0,
                    false,
                );
            }))
        );
    }

    const balances = [
        {
            currency: 'KAR',
            amount: 10 ** 5,
            precision: symbolPrecision.KAR
        },
        {
            currency: 'KSM',
            amount: 10 ** 5,
            precision: symbolPrecision.KSM
        }
    ]

    function setupFaucetBalance(suite: Suite, config = balances) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.currencies.updateBalance(
                    faucet.address,
                    {Token: config.currency},
                    new FixedPointNumber(config.amount, config.precision).toChainData()
                );
            })).map(suite.sudoWarpper)
        );
    }

    // Note: The number of oracler must be at least 5
    function setupKSMPrice(suite: Suite) {
        return suite.send(
            suite.sudo,
            suite.sudoWarpper(
                suite.api.tx.acalaOracle.feedValues([
                    [{Token: 'KSM'}, new FixedPointNumber(400 * 10 ** 8).toChainData()]
                ])
            )
        )
    }

    function mintAUSDForKSM(suite: Suite) {
        return suite.send(
            faucet,
            suite.api.tx.honzon.adjustLoan(
                {Token: 'KSM'},
                new FixedPointNumber(10, symbolPrecision.KSM).toChainData(),
                new FixedPointNumber(10, symbolPrecision.AUSD).toChainData()
            )
        )
    }


    //setup faucet balance
    // await setupFaucetBalance(suite);
    // console.log('setupFaucetBalance success')
    //
    // setup loan collateral params
    // await setupLoans(suite)
    // console.log('setupLoans success')

    // setup RENBTC price
    // await setupRENBTCPrice(suite)
    // console.log('setupRENBTCPrice success')

    // mint aUSD for RENBTC
    // await mintAUSDForRENBTC(suite)
    // console.log('mintAUSDForRENBTC success')

    // setup KSM price
    // await setupKSMPrice(suite)
    // console.log('setupKSMPrice success')

    // mint aUSD for KSM
    // await mintAUSDForKSM(suite)
    // console.log('mintAUSDForKSM success')

    // mint LKSM
    // await homaMintLKSM(suite)
    // console.log("homaMintLKSM success")

    // enableTradingPair
    // await enableTradingPair(suite)
    // console.log('enableTradingPair success')
    //
    // // add liquidity
    // await addLiquidity(suite)
    // console.log('addLiquidity success')
    //
    // console.log('complated')
    //
    // process.exit(0)
})();