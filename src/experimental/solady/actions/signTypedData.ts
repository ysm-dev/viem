import type { Address, TypedData, TypedDataDomain } from 'abitype'

import type { Account } from '../../../accounts/types.js'
import { parseAccount } from '../../../accounts/utils/parseAccount.js'
import {
  type GetEip712DomainParameters,
  getEip712Domain,
} from '../../../actions/public/getEip712Domain.js'
import { signTypedData as signTypedData_ } from '../../../actions/wallet/signTypedData.js'
import type { Client } from '../../../clients/createClient.js'
import type { Transport } from '../../../clients/transports/createTransport.js'
import { AccountNotFoundError } from '../../../errors/account.js'
import type { ErrorType } from '../../../errors/utils.js'
import type { GetAccountParameter } from '../../../types/account.js'
import type { Chain } from '../../../types/chain.js'
import type { Hex } from '../../../types/misc.js'
import type { TypedDataDefinition } from '../../../types/typedData.js'
import type { OneOf, RequiredBy } from '../../../types/utils.js'
import { encodePacked } from '../../../utils/abi/encodePacked.js'
import { size } from '../../../utils/data/size.js'
import { stringToHex } from '../../../utils/encoding/toHex.js'
import { getAction } from '../../../utils/getAction.js'
import {
  encodeType,
  hashStruct,
} from '../../../utils/signature/hashTypedData.js'
import { getTypesForEIP712Domain } from '../../../utils/typedData.js'
import type { GetVerifierParameter } from '../types.js'

export type SignTypedDataParameters<
  typedData extends TypedData | Record<string, unknown> = TypedData,
  primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  account extends Account | undefined = undefined,
  accountOverride extends Account | undefined = undefined,
  verifier extends Address | undefined = Address | undefined,
  ///
  primaryTypes = typedData extends TypedData ? keyof typedData : string,
> = TypedDataDefinition<typedData, primaryType, primaryTypes> &
  Pick<GetEip712DomainParameters, 'factory' | 'factoryData'> &
  GetAccountParameter<account, accountOverride> &
  OneOf<
    | {
        verifierDomain: RequiredBy<
          TypedDataDomain,
          'chainId' | 'name' | 'verifyingContract' | 'salt' | 'version'
        >
        fields: Hex
        extensions: readonly bigint[]
        verifier?: undefined
      }
    | (GetVerifierParameter<verifier> & {
        verifierDomain?:
          | RequiredBy<
              TypedDataDomain,
              'chainId' | 'name' | 'verifyingContract' | 'salt' | 'version'
            >
          | undefined
        fields?: Hex | undefined
        extensions?: readonly bigint[] | undefined
      })
  >

export type SignTypedDataReturnType = Hex

export type SignTypedDataErrorType = ErrorType

/**
 * Signs an [EIP-712](https://eips.ethereum.org/EIPS/eip-712) typed data message via Solady's [ERC1271 `TypedDataSign` format](https://github.com/Vectorized/solady/blob/678c9163550810b08f0ffb09624c9f7532392303/src/accounts/ERC1271.sol#L130-L151).
 *
 * This Action is suitable to sign messages for Smart Accounts that implement (or conform to) Solady's [ERC1271.sol](https://github.com/Vectorized/solady/blob/main/src/accounts/ERC1271.sol).
 *
 * - Docs: https://viem.sh/experimental/solady/signTypedData
 *
 * @param client - Client to use
 * @param parameters - {@link SignTypedDataParameters}
 * @returns The signed data. {@link SignTypedDataReturnType}
 *
 * @example
 * import { createWalletClient, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { signTypedData } from 'viem/experimental/solady'
 *
 * const client = createWalletClient({
 *   chain: mainnet,
 *   transport: custom(window.ethereum),
 * })
 * const signature = await signTypedData(client, {
 *   account: '0xE8Df82fA4E10e6A12a9Dab552bceA2acd26De9bb',
 *   domain: {
 *     name: 'Ether Mail',
 *     version: '1',
 *     chainId: 1,
 *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *     Mail: [
 *       { name: 'from', type: 'Person' },
 *       { name: 'to', type: 'Person' },
 *       { name: 'contents', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Mail',
 *   message: {
 *     from: {
 *       name: 'Cow',
 *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
 *     },
 *     to: {
 *       name: 'Bob',
 *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
 *     },
 *     contents: 'Hello, Bob!',
 *   },
 *   verifier: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 * })
 *
 * @example
 * // Account Hoisting
 * import { createWalletClient, http } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { mainnet } from 'viem/chains'
 * import { signTypedData } from 'viem/experimental/solady'
 *
 * const client = createWalletClient({
 *   account: '0xE8Df82fA4E10e6A12a9Dab552bceA2acd26De9bb'
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const signature = await signTypedData(client, {
 *   domain: {
 *     name: 'Ether Mail',
 *     version: '1',
 *     chainId: 1,
 *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *     Mail: [
 *       { name: 'from', type: 'Person' },
 *       { name: 'to', type: 'Person' },
 *       { name: 'contents', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Mail',
 *   message: {
 *     from: {
 *       name: 'Cow',
 *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
 *     },
 *     to: {
 *       name: 'Bob',
 *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
 *     },
 *     contents: 'Hello, Bob!',
 *   },
 *   verifier: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 * })
 */
export async function signTypedData<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
  chain extends Chain | undefined,
  account extends Account | undefined,
  accountOverride extends Account | undefined = undefined,
>(
  client: Client<Transport, chain, account>,
  parameters: SignTypedDataParameters<
    typedData,
    primaryType,
    account,
    accountOverride
  >,
): Promise<SignTypedDataReturnType> {
  const {
    account: account_ = client.account,
    domain,
    factory,
    factoryData,
    message,
    primaryType,
    types,
    verifier,
  } = parameters as unknown as SignTypedDataParameters

  if (!account_)
    throw new AccountNotFoundError({
      docsPath: '/experimental/solady/signTypedData',
    })
  const account = parseAccount(account_!)

  // Retrieve account EIP712 domain.
  const {
    domain: verifierDomain,
    fields,
    extensions,
  } = await (async () => {
    if (parameters.verifierDomain && parameters.fields && parameters.extensions)
      return {
        domain: parameters.verifierDomain,
        fields: parameters.fields,
        extensions: parameters.extensions,
      }
    return getAction(
      client,
      getEip712Domain,
      'getEip712Domain',
    )({
      address: verifier!,
      factory,
      factoryData,
    })
  })()

  // Sign with typed data wrapper.
  const signature = await getAction(
    client,
    signTypedData_,
    'signTypedData',
  )({
    account,
    domain,
    types: {
      ...types,
      TypedDataSign: [
        { name: 'contents', type: primaryType },
        { name: 'fields', type: 'bytes1' },
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
        { name: 'salt', type: 'bytes32' },
        { name: 'extensions', type: 'uint256[]' },
      ],
    },
    primaryType: 'TypedDataSign',
    message: {
      contents: message as any,
      fields,
      extensions,
      ...(verifierDomain as any),
    },
  })

  // Compute dependencies for wrapped signature.
  const hashedDomain = hashStruct({
    data: domain ?? {},
    types: {
      EIP712Domain: getTypesForEIP712Domain({ domain }),
    },
    primaryType: 'EIP712Domain',
  })
  const hashedContents = hashStruct({
    data: message,
    types: types as any,
    primaryType,
  })
  const encodedType = encodeType({
    primaryType,
    types: types as any,
  })

  // Construct wrapped signature.
  return encodePacked(
    ['bytes', 'bytes32', 'bytes32', 'bytes', 'uint16'],
    [
      signature,
      hashedDomain,
      hashedContents,
      stringToHex(encodedType),
      size(stringToHex(encodedType)),
    ],
  )
}
