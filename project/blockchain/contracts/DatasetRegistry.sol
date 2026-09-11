// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DatasetRegistry
/// @notice Registers dataset integrity hashes for tamper-evident verification.
/// @dev Only the hash, ID, version and timestamp are stored on-chain.
///      The dataset contents themselves live in off-chain storage
///      (see backend/app/datasets/storage.py) — never write raw data here.
contract DatasetRegistry {
    struct Registration {
        bytes32 hash;
        uint256 version;
        uint256 timestamp;
        address registeredBy;
    }

    // datasetId => list of registrations (append-only history across versions)
    mapping(string => Registration[]) private history;

    event DatasetRegistered(string indexed datasetId, bytes32 hash, uint256 version, uint256 timestamp);
    event DatasetVerified(string indexed datasetId, bool matches, uint256 checkedVersion);

    /// @notice Registers a new dataset version's hash on-chain.
    function registerDataset(string calldata datasetId, bytes32 hash, uint256 version) external {
        history[datasetId].push(
            Registration({hash: hash, version: version, timestamp: block.timestamp, registeredBy: msg.sender})
        );
        emit DatasetRegistered(datasetId, hash, version, block.timestamp);
    }

    /// @notice Compares a freshly computed hash against the latest registered hash.
    function verifyDataset(string calldata datasetId, bytes32 currentHash)
        external
        returns (bool matches, uint256 registeredVersion)
    {
        Registration[] storage records = history[datasetId];
        require(records.length > 0, "No registration found for datasetId");

        Registration storage latest = records[records.length - 1];
        matches = (latest.hash == currentHash);
        registeredVersion = latest.version;

        emit DatasetVerified(datasetId, matches, registeredVersion);
    }

    /// @notice Returns the full registration history for a dataset.
    function getDatasetHistory(string calldata datasetId) external view returns (Registration[] memory) {
        return history[datasetId];
    }
}
