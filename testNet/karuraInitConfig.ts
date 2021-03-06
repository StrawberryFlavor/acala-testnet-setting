import {Suite} from "../suite";
import {Keyring} from '@polkadot/api';
import {FixedPointNumber, Token} from '@acala-network/sdk-core';


(async () => {
    const suite = new Suite();
    const localWS = "wss://crosschain-dev.polkawallet.io:9907"
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

    let oraclerSender = [alice, bob, charlie, dave, eve]
    let oraclerAddress = [alice.address, bob.address, charlie.address, dave.address, eve.address]

    // set Oracler
    async function setOracler(suite: Suite) {
        let tx = suite.api.tx.sudo.sudo(
            suite.api.tx.operatorMembershipAcala.resetMembers(oraclerAddress)
        )
        await suite.send(alice, tx)
    }

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


    let symbolPrice = [
        [
            {
                Token: "KSM"
            },
            new FixedPointNumber(150, 18).toChainData()
        ]
    ]

    // Note: The number of oracler must be at least 5
    async function setOraclePrice(suite: Suite) {
        let tx = suite.api.tx.acalaOracle.feedValues(
            symbolPrice
        )
        for (const sender of oraclerSender) {
            await suite.send(sender, tx)
        }

    }

    // Oracle

    const symbolPrecision = {
        "KAR": 12,
        "KUSD": 12,
        "KSM": 12,
        "LKSM": 12
    }

    const loanConfigs = [
        // {
        //     asset: {"Token": 'KSM'},
        //     requiredRatio: 2,
        //     stabilityFee,
        //     liquidationPenalty: 0.17,
        //     liquidationRatio: 1.85,
        //     maximunTotalDebitValue: 1 * 10 ** 8
        // },
        {
            asset: {"Token": 'KSM'},
            requiredRatio: 2,
            stabilityFee,
            liquidationPenalty: 0.17,
            liquidationRatio: 1.85,
            maximunTotalDebitValue: 1 * 10 ** 8
        },
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
        },
        {
            currency: 'LKSM',
            amount: 10 ** 5,
            precision: symbolPrecision.LKSM
        },
        {
            currency: 'KUSD',
            amount: 10 ** 5,
            precision: symbolPrecision.KUSD
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

    async function mintKUSDForKSM(suite: Suite) {
        let tx = suite.api.tx.honzon.adjustLoan(
            {Token: 'KSM'},
            new FixedPointNumber(10, symbolPrecision.KSM).toChainData(),
            new FixedPointNumber(50, 13).toChainData()
        )
        await suite.send(faucet, tx)
    }

    //await mintAUSDForKSM(suite)

    // Setting the LoansIncentives
    async function setupLoansIncentives(suite: Suite) {
        let tx = suite.api.tx.sudo.sudo(
            suite.api.tx.incentives.updateIncentiveRewards([[
                {
                    Loans: {
                        Token: "KSM"
                    }
                },
                [
                    [
                        {
                            Token: "KAR"
                        },
                        new FixedPointNumber(1, 12).toChainData()
                    ]
                ]
            ]])
        )
        await suite.send(alice, tx)
    }


    const dexIncentiveConfig = [
        {
            token1: 'KAR',
            token2: 'KSM',
            amount: 1
        },
        {
            token1: 'KUSD',
            token2: 'KSM',
            amount: 1

        }
    ]

    // Setting the DexIncentiveIncentives
    function setupDexIncentiveIncentives(suite: Suite, config = dexIncentiveConfig) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.incentives.updateIncentiveRewards(
                    [[
                        {
                            Dex: {
                                DexShare: [
                                    {
                                        Token: config.token1
                                    },
                                    {
                                        Token: config.token2
                                    }
                                ]
                            }
                        },
                        [
                            [
                                {
                                    Token: "KAR"
                                },
                                new FixedPointNumber(config.amount, 12).toChainData()
                            ]
                        ]
                    ]]
                );
            })).map(suite.sudoWarpper)
        );
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
            token1: 'KUSD',
            token2: 'KSM',
            amount1: 15000,
            amount2: 100,
            amount1Precision: symbolPrecision.KUSD,
            amount2Precision: symbolPrecision.KSM
        },
        {
            token1: 'KAR',
            token2: 'KSM',
            amount1: 10000,
            amount2: 100,
            amount1Precision: symbolPrecision.KAR,
            amount2Precision: symbolPrecision.KSM
        },
        {
            token1: 'KSM',
            token2: 'LKSM',
            amount1: 100,
            amount2: 1000,
            amount1Precision: symbolPrecision.KAR,
            amount2Precision: symbolPrecision.KSM
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

    let enableChargeFeePoolConfig = [
        {
            token: "KUSD",
            poolSize: 500,
            swapThreshold: 5
        },
        {
            token: "KSM",
            poolSize: 5,
            swapThreshold: 5
        },
        {
            token: "LKSM",
            poolSize: 50,
            swapThreshold: 5
        },
    ]


    const treasuryAccountBalances = [
        {
            currency: 'KAR',
            amount: 10 ** 5,
            precision: symbolPrecision.KAR
        },
        {
            currency: 'KSM',
            amount: 1,
            precision: symbolPrecision.KSM
        },
        {
            currency: 'LKSM',
            amount: 1,
            precision: symbolPrecision.LKSM
        },
        {
            currency: 'KUSD',
            amount: 1,
            precision: symbolPrecision.KUSD
        }
    ]

    let treasuryAccount = await suite.api.consts.transactionPayment.treasuryAccount
    console.log(treasuryAccount.toString())

    function setupTreasuryAccountBalance(suite: Suite, config = treasuryAccountBalances) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.currencies.updateBalance(
                    treasuryAccount.toString(),
                    {Token: config.currency},
                    new FixedPointNumber(config.amount, config.precision).toChainData()
                );
            })).map(suite.sudoWarpper)
        );
    }

    function enableChargeFeePool(suite: Suite, config = enableChargeFeePoolConfig) {
        return suite.send(
            suite.sudo,
            suite.batchWrapper(config.map((config) => {
                return suite.api.tx.transactionPayment.enableChargeFeePool(
                    {Token: config.token},
                    new FixedPointNumber(config.poolSize, 12).toChainData(),
                    new FixedPointNumber(config.swapThreshold, 12).toChainData()
                )
            })).map(suite.sudoWarpper)
        )
    }


    // await setOracler(suite)
    // await setOraclerBalance(suite)
    // await setOraclePrice(suite)

    // await setupLoansIncentives(suite)
    // await setupDexIncentiveIncentives(suite, dexIncentiveConfig)

    //
    //setup loan collateral params
    // await setupLoans(suite)
    //console.log('setupLoans success')

    // mint aUSD for KSM
    // await mintKUSDForKSM(suite)
    // console.log('mintAUSDForKSM success')

    // mint LKSM
    // await homaMintLKSM(suite)
    // console.log("homaMintLKSM success")

    // enableTradingPair
    // await enableTradingPair(suite)
    // console.log('enableTradingPair success')

    //setup faucet balance
    // await setupFaucetBalance(suite);
    // console.log('setupFaucetBalance success')

    // // add liquidity
    // await addLiquidity(suite)
    // console.log('addLiquidity success')

    // await setupTreasuryAccountBalance(suite)
    // await enableChargeFeePool(suite)
    console.log('complated')

    process.exit(0)
})();