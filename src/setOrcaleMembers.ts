import {Suite} from "../suite";

export async function setAcala(suite: Suite, addressList: string[]) {
    let tx = suite.api.tx.sudo.sudo(suite.api.tx.operatorMembershipAcala.resetMembers(
        addressList
    ))
    return await suite.send(suite.sudo, tx)

}