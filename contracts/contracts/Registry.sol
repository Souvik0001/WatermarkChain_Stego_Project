// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Registry {
    struct Record {
        address owner;
        uint64 timestamp;
        string note;
    }

    mapping(bytes32 => Record) public records;

    event Registered(bytes32 indexed fileHash, address indexed owner, uint64 timestamp, string note);

    function register(bytes32 fileHash, string calldata note) external {
        require(fileHash != bytes32(0), "ZERO_HASH");
        require(records[fileHash].owner == address(0), "EXISTS");
        records[fileHash] = Record({
            owner: msg.sender,
            timestamp: uint64(block.timestamp),
            note: note
        });
        emit Registered(fileHash, msg.sender, uint64(block.timestamp), note);
    }

    function get(bytes32 fileHash) external view returns (Record memory) {
        return records[fileHash];
    }
}
