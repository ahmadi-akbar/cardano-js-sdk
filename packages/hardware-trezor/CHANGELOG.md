# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.0](https://github.com/input-output-hk/cardano-js-sdk/compare/@cardano-sdk/hardware-trezor@0.2.1...@cardano-sdk/hardware-trezor@0.3.0) (2023-11-29)

### ⚠ BREAKING CHANGES

* stake registration and deregistration certificates now take a Credential instead of key hash

### Features

* **hardware-trezor:** add collaterals to trezor mappers ([91a0f34](https://github.com/input-output-hk/cardano-js-sdk/commit/91a0f341e1013e291752c0e7e6e45215122ce0d4))
* **hardware-trezor:** add reference inputs and script to trezor mappers ([26a96ab](https://github.com/input-output-hk/cardano-js-sdk/commit/26a96ab9fb708c2f168df512d397cc60f77e9851))
* stake registration and deregistration certificates now take a Credential instead of key hash ([49612f0](https://github.com/input-output-hk/cardano-js-sdk/commit/49612f0f313f357e7e2a7eed406852cbd2bb3dec))

### Bug Fixes

* **hardware-trezor:** fix assets mapper for token minting ([7af6981](https://github.com/input-output-hk/cardano-js-sdk/commit/7af69810f98115b387aa7054ed8d57a5520c3d14))
* **hardware-trezor:** fix tx mapping test ([2bbd84c](https://github.com/input-output-hk/cardano-js-sdk/commit/2bbd84c6bffb63191f17aeba3e1d62a2d1fd1bb5))

## [0.2.1](https://github.com/input-output-hk/cardano-js-sdk/compare/@cardano-sdk/hardware-trezor@0.2.0...@cardano-sdk/hardware-trezor@0.2.1) (2023-10-19)

### Bug Fixes

* **hardware-trezor:** fix trezor tx signing LW-6522 ([0f6cff0](https://github.com/input-output-hk/cardano-js-sdk/commit/0f6cff0281743f133e1c80cb8a796a8d34bee2ab))

## 0.2.0 (2023-10-12)

### ⚠ BREAKING CHANGES

* the TrezorKeyAgent class was moved from `key-management` to `hardware-trezor` package

### Features

* add dedicated Trezor package ([2a1b075](https://github.com/input-output-hk/cardano-js-sdk/commit/2a1b0754adfd29f1ef2f820b59f91f950cddb4d9))
