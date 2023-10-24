import { AssetEntity, OutputEntity, TokensEntity, createDataSource } from '@cardano-sdk/projection-typeorm';
import { ChainSyncDataSet, chainSyncData, logger } from '@cardano-sdk/util-dev';
import { ProjectionName, createTypeormProjection, prepareTypeormProjection } from '../../src';
import { lastValueFrom } from 'rxjs';
import { projectorConnectionConfig, projectorConnectionConfig$ } from '../util';

describe('createTypeormProjection', () => {
  it('creates a projection to PostgreSQL based on requested projection names', async () => {
    // Setup projector
    const projections = [ProjectionName.UTXO];
    const data = chainSyncData(ChainSyncDataSet.WithMint);
    const projection$ = createTypeormProjection({
      blocksBufferLength: 10,
      cardanoNode: data.cardanoNode,
      connectionConfig$: projectorConnectionConfig$,
      devOptions: { dropSchema: true },
      logger,
      projections
    });

    // Project
    await lastValueFrom(projection$);

    // Setup query runner for assertions
    const { entities } = prepareTypeormProjection({ projections }, { logger });
    const dataSource = createDataSource({
      connectionConfig: projectorConnectionConfig,
      entities,
      logger
    });
    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Check data in the database
    expect(await queryRunner.manager.count(AssetEntity)).toBeGreaterThan(0);
    expect(await queryRunner.manager.count(TokensEntity)).toBeGreaterThan(0);
    expect(await queryRunner.manager.count(OutputEntity)).toBeGreaterThan(0);

    await queryRunner.release();
    await dataSource.destroy();
  });

  // PostgreSQL transaction retries are tested in projection-typeorm package
});
