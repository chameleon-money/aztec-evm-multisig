use dep::aztec::protocol_types::{
    address::{AztecAddress, EthAddress},
    traits::{Deserialize, FromField, Packable, Serialize, ToField},
};

// Types of operations that can be proposed in the multisig
pub global OPERATION_ADD_SIGNER: u8 = 1;
pub global OPERATION_REMOVE_SIGNER: u8 = 2;
pub global OPERATION_CHANGE_THRESHOLD: u8 = 3;
pub global OPERATION_EXECUTE_TRANSACTION: u8 = 4;

// Maximum number of signers supported
pub global MAX_SIGNERS: u32 = 20;

// Serialized length for Proposal struct
global PROPOSAL_SERIALIZED_LEN: u32 = 11;

// Proposal struct for returning proposal data
pub struct Proposal {
    pub proposal_id: Field,
    pub operation_type: u8,
    pub proposer: AztecAddress,
    pub target_address: AztecAddress,
    pub new_threshold: u8,
    pub transaction_token: EthAddress,
    pub transaction_recipient: EthAddress,
    pub transaction_amount: Field,
    pub signature_count: u8,
    pub executed: bool,
    pub created_at: u32,
}

impl Proposal {
    pub fn new(
        proposal_id: Field,
        operation_type: u8,
        proposer: AztecAddress,
        target_address: AztecAddress,
        new_threshold: u8,
        transaction_token: EthAddress,
        transaction_recipient: EthAddress,
        transaction_amount: Field,
        signature_count: u8,
        executed: bool,
        created_at: u32,
    ) -> Self {
        Proposal {
            proposal_id,
            operation_type,
            proposer,
            target_address,
            new_threshold,
            transaction_token,
            transaction_recipient,
            transaction_amount,
            signature_count,
            executed,
            created_at,
        }
    }

    pub fn add_signature(self) -> Self {
        Proposal {
            proposal_id: self.proposal_id,
            operation_type: self.operation_type,
            proposer: self.proposer,
            target_address: self.target_address,
            new_threshold: self.new_threshold,
            transaction_token: self.transaction_token,
            transaction_recipient: self.transaction_recipient,
            transaction_amount: self.transaction_amount,
            signature_count: self.signature_count + 1,
            executed: self.executed,
            created_at: self.created_at,
        }
    }

    pub fn mark_executed(self) -> Self {
        Proposal {
            proposal_id: self.proposal_id,
            operation_type: self.operation_type,
            proposer: self.proposer,
            target_address: self.target_address,
            new_threshold: self.new_threshold,
            transaction_token: self.transaction_token,
            transaction_recipient: self.transaction_recipient,
            transaction_amount: self.transaction_amount,
            signature_count: self.signature_count,
            executed: true,
            created_at: self.created_at,
        }
    }
}

impl Serialize for Proposal {
    let N: u32 = PROPOSAL_SERIALIZED_LEN;

    fn serialize(self) -> [Field; Self::N] {
        [
            self.proposal_id,
            self.operation_type as Field,
            self.proposer.to_field(),
            self.target_address.to_field(),
            self.new_threshold as Field,
            self.transaction_token.to_field(),
            self.transaction_recipient.to_field(),
            self.transaction_amount,
            self.signature_count as Field,
            self.executed as Field,
            self.created_at as Field,
        ]
    }
}

impl Deserialize for Proposal {
    let N: u32 = PROPOSAL_SERIALIZED_LEN;

    fn deserialize(fields: [Field; Self::N]) -> Self {
        Proposal {
            proposal_id: fields[0],
            operation_type: fields[1] as u8,
            proposer: AztecAddress::from_field(fields[2]),
            target_address: AztecAddress::from_field(fields[3]),
            new_threshold: fields[4] as u8,
            transaction_token: EthAddress::from_field(fields[5]),
            transaction_recipient: EthAddress::from_field(fields[6]),
            transaction_amount: fields[7],
            signature_count: fields[8] as u8,
            executed: fields[9] != 0,
            created_at: fields[10] as u32,
        }
    }
}

impl Packable for Proposal {
    let N: u32 = PROPOSAL_SERIALIZED_LEN;

    fn pack(self) -> [Field; Self::N] {
        [
            self.proposal_id,
            self.operation_type as Field,
            self.proposer.to_field(),
            self.target_address.to_field(),
            self.new_threshold as Field,
            self.transaction_token.to_field(),
            self.transaction_recipient.to_field(),
            self.transaction_amount,
            self.signature_count as Field,
            self.executed as Field,
            self.created_at as Field,
        ]
    }

    fn unpack(fields: [Field; Self::N]) -> Self {
        Proposal {
            proposal_id: fields[0],
            operation_type: fields[1] as u8,
            proposer: AztecAddress::from_field(fields[2]),
            target_address: AztecAddress::from_field(fields[3]),
            new_threshold: fields[4] as u8,
            transaction_token: EthAddress::from_field(fields[5]),
            transaction_recipient: EthAddress::from_field(fields[6]),
            transaction_amount: fields[7],
            signature_count: fields[8] as u8,
            executed: fields[9] != 0,
            created_at: fields[10] as u32,
        }
    }
}
