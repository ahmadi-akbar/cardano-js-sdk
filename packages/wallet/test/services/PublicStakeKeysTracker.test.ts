import { AccountKeyDerivationPath, AsyncKeyAgent, GroupedAddress, KeyRole, util } from '@cardano-sdk/key-management';
import { Cardano } from '@cardano-sdk/core';
import { ObservableWallet } from '../../src';
import { PubStakeKeyAndStatus, createPublicStakeKeysTracker } from '../../src/services/PublicStakeKeysTracker';
import { firstValueFrom, from, lastValueFrom, of, shareReplay, toArray } from 'rxjs';
import { mockProviders as mocks } from '@cardano-sdk/util-dev';

describe('PublicStakeKeysTracker', () => {
  let addresses: GroupedAddress[];
  let rewardAccounts: Cardano.RewardAccountInfo[];
  let keyAgent: AsyncKeyAgent;
  let derivePublicKey: jest.Mock;

  /** Assert multiple emissions from stakePubKey$ */
  const assertEmits = async (
    stakePubKeys$: ObservableWallet['publicStakeKeys$'],
    expectedEmissions: PubStakeKeyAndStatus[][]
    // eslint-disable-next-line unicorn/consistent-function-scoping
  ) => {
    const publicKeyEmissions = await lastValueFrom(stakePubKeys$.pipe(toArray()));
    expect(publicKeyEmissions).toEqual(expectedEmissions);
  };

  beforeEach(() => {
    addresses = [
      {
        rewardAccount: mocks.rewardAccount,
        stakeKeyDerivationPath: { index: 0, role: KeyRole.Stake }
      },
      {
        rewardAccount: Cardano.RewardAccount('stake_test1upx9faamuf54pm7alg4lna5l7ll08pz833rj45tgr9m2jyceasqjt'),
        stakeKeyDerivationPath: { index: 1, role: KeyRole.Stake }
      },
      {
        rewardAccount: Cardano.RewardAccount('stake_test1uzksuwayv930mvkas0hfe5cdshtwszpp06nvjs9y6rtugmstddurm'),
        stakeKeyDerivationPath: { index: 2, role: KeyRole.Stake }
      },
      {
        rewardAccount: Cardano.RewardAccount('stake_test1uzfef3dmd0ykz9wfm3zx35pq4xdtla929hk6sx6tcen9h6s3vf52j'),
        stakeKeyDerivationPath: { index: 3, role: KeyRole.Stake }
      }
    ] as GroupedAddress[];

    rewardAccounts = [
      {
        address: addresses[0].rewardAccount!,
        keyStatus: Cardano.StakeKeyStatus.Registering,
        rewardBalance: 1_000_000n
      },
      {
        address: addresses[1].rewardAccount!,
        keyStatus: Cardano.StakeKeyStatus.Registered,
        rewardBalance: 1_000_000n
      },
      {
        address: addresses[2].rewardAccount!,
        keyStatus: Cardano.StakeKeyStatus.Unregistering,
        rewardBalance: 1_000_000n
      },
      {
        address: addresses[3].rewardAccount!,
        keyStatus: Cardano.StakeKeyStatus.Unregistered,
        rewardBalance: 1_000_000n
      }
    ];

    derivePublicKey = jest
      .fn()
      .mockImplementation((path: AccountKeyDerivationPath) => Promise.resolve(`abc-${path.index}`));
    keyAgent = {
      derivePublicKey
    } as unknown as AsyncKeyAgent;
  });

  it('empty array when there are no reward accounts', async () => {
    const addresses$ = of(addresses);
    const rewardAccounts$ = of([]);

    const stakePubKeys$ = createPublicStakeKeysTracker({
      addressManager: util.createBip32Ed25519AddressManager(keyAgent),
      addresses$,
      rewardAccounts$
    });

    const publicKeys = await firstValueFrom(stakePubKeys$);
    expect(publicKeys).toEqual([]);
  });

  it('emits derivation paths for all stake keys', async () => {
    const addresses$ = of(addresses);
    const rewardAccounts$ = of(rewardAccounts);

    const stakePubKeys$ = createPublicStakeKeysTracker({
      addressManager: util.createBip32Ed25519AddressManager(keyAgent),
      addresses$,
      rewardAccounts$
    });

    await assertEmits(stakePubKeys$, [
      [
        { keyStatus: rewardAccounts[0].keyStatus, publicStakeKey: 'abc-0' },
        { keyStatus: rewardAccounts[1].keyStatus, publicStakeKey: 'abc-1' },
        { keyStatus: rewardAccounts[2].keyStatus, publicStakeKey: 'abc-2' },
        { keyStatus: rewardAccounts[3].keyStatus, publicStakeKey: 'abc-3' }
      ] as PubStakeKeyAndStatus[]
    ]);
    expect(derivePublicKey).toHaveBeenCalledTimes(4);
    expect(derivePublicKey).toHaveBeenCalledWith(addresses[0].stakeKeyDerivationPath);
    expect(derivePublicKey).toHaveBeenCalledWith(addresses[1].stakeKeyDerivationPath);
    expect(derivePublicKey).toHaveBeenCalledWith(addresses[2].stakeKeyDerivationPath);
    expect(derivePublicKey).toHaveBeenCalledWith(addresses[3].stakeKeyDerivationPath);
  });

  it('ignores reward accounts that are not part of grouped addresses', async () => {
    addresses[0].rewardAccount = 'something-else' as Cardano.RewardAccount;
    const addresses$ = of(addresses);
    const rewardAccounts$ = of(rewardAccounts);

    const stakePubKeys$ = createPublicStakeKeysTracker({
      addressManager: util.createBip32Ed25519AddressManager(keyAgent),
      addresses$,
      rewardAccounts$
    });

    await assertEmits(stakePubKeys$, [
      [
        { keyStatus: rewardAccounts[1].keyStatus, publicStakeKey: 'abc-1' },
        { keyStatus: rewardAccounts[2].keyStatus, publicStakeKey: 'abc-2' },
        { keyStatus: rewardAccounts[3].keyStatus, publicStakeKey: 'abc-3' }
      ] as PubStakeKeyAndStatus[]
    ]);
  });

  it('emits when reward accounts change', async () => {
    const addresses$ = of(addresses);
    const rewardAccounts$ = from([[rewardAccounts[0]], rewardAccounts]);

    const stakePubKeys$ = createPublicStakeKeysTracker({
      addressManager: util.createBip32Ed25519AddressManager(keyAgent),
      addresses$,
      rewardAccounts$
    });

    await assertEmits(stakePubKeys$, [
      [{ keyStatus: rewardAccounts[0].keyStatus, publicStakeKey: 'abc-0' }],
      [
        { keyStatus: rewardAccounts[0].keyStatus, publicStakeKey: 'abc-0' },
        { keyStatus: rewardAccounts[1].keyStatus, publicStakeKey: 'abc-1' },
        { keyStatus: rewardAccounts[2].keyStatus, publicStakeKey: 'abc-2' },
        { keyStatus: rewardAccounts[3].keyStatus, publicStakeKey: 'abc-3' }
      ]
    ] as PubStakeKeyAndStatus[][]);
  });

  it('emits when addresses change', async () => {
    const addresses$ = from([[addresses[0]], addresses]);
    const rewardAccounts$ = of(rewardAccounts);

    const stakePubKeys$ = createPublicStakeKeysTracker({
      addressManager: util.createBip32Ed25519AddressManager(keyAgent),
      addresses$,
      rewardAccounts$
    });

    await assertEmits(stakePubKeys$, [
      [{ keyStatus: rewardAccounts[0].keyStatus, publicStakeKey: 'abc-0' }],
      [
        { keyStatus: rewardAccounts[0].keyStatus, publicStakeKey: 'abc-0' },
        { keyStatus: rewardAccounts[1].keyStatus, publicStakeKey: 'abc-1' },
        { keyStatus: rewardAccounts[2].keyStatus, publicStakeKey: 'abc-2' },
        { keyStatus: rewardAccounts[3].keyStatus, publicStakeKey: 'abc-3' }
      ]
    ] as PubStakeKeyAndStatus[][]);
  });

  it('does not emit duplicates', async () => {
    const rewardAccounts$ = from([rewardAccounts, rewardAccounts]);
    const addresses$ = from([[addresses[0]], addresses, addresses]).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const stakePubKeys$ = createPublicStakeKeysTracker({
      addressManager: util.createBip32Ed25519AddressManager(keyAgent),
      addresses$,
      rewardAccounts$
    });

    await assertEmits(stakePubKeys$, [
      [{ keyStatus: rewardAccounts[0].keyStatus, publicStakeKey: 'abc-0' }],
      [
        { keyStatus: rewardAccounts[0].keyStatus, publicStakeKey: 'abc-0' },
        { keyStatus: rewardAccounts[1].keyStatus, publicStakeKey: 'abc-1' },
        { keyStatus: rewardAccounts[2].keyStatus, publicStakeKey: 'abc-2' },
        { keyStatus: rewardAccounts[3].keyStatus, publicStakeKey: 'abc-3' }
      ]
    ] as PubStakeKeyAndStatus[][]);
  });
});
