import {Suite} from "../suite";
import {FixedPointNumber} from "@acala-network/sdk-core";

export async function register(suite: Suite) {
    let tx = suite.api.tx.sudo.sudo(suite.api.tx.assetRegistry.registerForeignAsset(
        {
            V1: {
                parents: 1,
                interior: {
                    X2: [
                        {
                            Parachain: '1000'
                        },
                        {
                            GeneralIndex: '13'
                        }
                    ]
                }
            }
        },
        {
            name: 'RMRK.app',
            symbol: 'RMRK',
            decimals: 10,
            minimalBalance: new FixedPointNumber(0.001, 10).toChainData()
        }
    ))
    return await suite.send(suite.sudo, tx)
}