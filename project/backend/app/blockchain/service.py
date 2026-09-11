"""Blockchain registration with an explicit local mock fallback."""
from __future__ import annotations

from web3 import Web3

from app.core.config import settings

CONTRACT_ABI = [
    {"inputs": [{"internalType": "string", "name": "datasetId", "type": "string"}, {"internalType": "bytes32", "name": "hash", "type": "bytes32"}, {"internalType": "uint256", "name": "version", "type": "uint256"}], "name": "registerDataset", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "datasetId", "type": "string"}, {"internalType": "bytes32", "name": "currentHash", "type": "bytes32"}], "name": "verifyDataset", "outputs": [{"internalType": "bool", "name": "matches", "type": "bool"}, {"internalType": "uint256", "name": "registeredVersion", "type": "uint256"}], "stateMutability": "nonpayable", "type": "function"},
]


def _client() -> tuple[Web3, object] | None:
    if not settings.DATASET_REGISTRY_CONTRACT_ADDRESS or not settings.CHAIN_DEPLOYER_PRIVATE_KEY:
        return None
    client = Web3(Web3.HTTPProvider(settings.CHAIN_RPC_URL))
    if not client.is_connected():
        return None
    account = client.eth.account.from_key(settings.CHAIN_DEPLOYER_PRIVATE_KEY)
    contract = client.eth.contract(address=Web3.to_checksum_address(settings.DATASET_REGISTRY_CONTRACT_ADDRESS), abi=CONTRACT_ABI)
    return client, (account, contract)


def register_dataset(dataset_id: str, sha256_hash: str, version: int) -> dict:
    connection = _client()
    if connection is None:
        return {"tx_hash": None, "block_number": None, "status": "PENDING", "note": "MOCK — configure the local chain to submit a real transaction."}
    client, (account, contract) = connection
    tx = contract.functions.registerDataset(dataset_id, bytes.fromhex(sha256_hash), version).build_transaction({"from": account.address, "nonce": client.eth.get_transaction_count(account.address), "gas": 300000, "gasPrice": client.eth.gas_price})
    signed = account.sign_transaction(tx)
    tx_hash = client.eth.send_raw_transaction(signed.raw_transaction)
    receipt = client.eth.wait_for_transaction_receipt(tx_hash)
    return {"tx_hash": tx_hash.hex(), "block_number": receipt.blockNumber, "status": "CONFIRMED", "note": "Registered on the configured DatasetRegistry contract."}


def verify_dataset(dataset_id: str, current_hash: str) -> dict:
    connection = _client()
    if connection is None:
        return {"matches": False, "note": "MOCK verification — configure the local chain for on-chain verification."}
    client, (account, contract) = connection
    matches, registered_version = contract.functions.verifyDataset(dataset_id, bytes.fromhex(current_hash)).call({"from": account.address})
    tx = contract.functions.verifyDataset(dataset_id, bytes.fromhex(current_hash)).build_transaction({"from": account.address, "nonce": client.eth.get_transaction_count(account.address), "gas": 200000, "gasPrice": client.eth.gas_price})
    signed = account.sign_transaction(tx)
    tx_hash = client.eth.send_raw_transaction(signed.raw_transaction)
    receipt = client.eth.wait_for_transaction_receipt(tx_hash)
    return {"matches": matches, "registered_version": registered_version, "tx_hash": tx_hash.hex(), "block_number": receipt.blockNumber, "note": "Verified against the configured DatasetRegistry contract."}


def register_dataset_mock(dataset_id: str, sha256_hash: str, version: int) -> dict:
    return register_dataset(dataset_id, sha256_hash, version)


def verify_dataset_mock(dataset_id: str, current_hash: str, registered_hash: str) -> dict:
    connection = _client()
    if connection is not None:
        return verify_dataset(dataset_id, current_hash)
    return {
        "matches": current_hash == registered_hash,
        "note": "MOCK verification — configure the local chain for on-chain verification.",
    }
