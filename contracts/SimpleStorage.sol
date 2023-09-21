// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract SimpleStorage {
  string storedData;
  event Set(address indexed caller, string message);

  function set(string memory message) public {
    storedData = message;
    require(bytes(message).length <= 64, 'The message is too long');
    emit Set(msg.sender, message);
  }

  function get() public view returns (string memory) {
    return storedData;
  }
}
