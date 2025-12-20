use dep::aztec::protocol_types::{
    address::AztecAddress,
    traits::{Serialize, Deserialize}
};

// Types of operations that can be proposed in the multisig
pub global OPERATION_ADD_SIGNER: u8 = 1;
pub global OPERATION_REMOVE_SIGNER: u8 = 2;
pub global OPERATION_CHANGE_THRESHOLD: u8 = 3;
pub global OPERATION_EXECUTE_TRANSACTION: u8 = 4;

// Maximum number of signers supported
pub global MAX_SIGNERS: u32 = 20;

// Represents a proposal that requires multi-sig approval
#[derive(Copy)]
pub struct Proposal {
    // Unique identifier for this proposal
    pub proposal_id: Field,
    
    // Type of operation (add_signer, remove_signer, change_threshold, execute_transaction)
    pub operation_type: u8,
    
    // Address of the proposer
    pub proposer: AztecAddress,
    
    // Target address (signer to add/remove, or transaction target)
    pub target_address: AztecAddress,
    
    // New threshold value (for change_threshold operations)
    pub new_threshold: u8,
    
    // Transaction data (for execute_transaction operations)
    pub transaction_data: Field,
    
    // Current number of signatures collected
    pub signature_count: u8,
    
    // Whether this proposal has been executed
    pub executed: bool,
    
    // Block number when proposal was created (for expiration)
    pub created_at: u32,
}

impl Proposal {
    pub fn new(
        proposal_id: Field,
        operation_type: u8,
        proposer: AztecAddress,
        target_address: AztecAddress,
        new_threshold: u8,
        transaction_data: Field,
        created_at: u32
    ) -> Self {
        Proposal {
            proposal_id,
            operation_type,
            proposer,
            target_address,
            new_threshold,
            transaction_data,
            signature_count: 1, // Proposer's signature counts
            executed: false,
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
            transaction_data: self.transaction_data,
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
            transaction_data: self.transaction_data,
            signature_count: self.signature_count,
            executed: true,
            created_at: self.created_at,
        }
    }
}

impl Eq for Proposal {
    fn eq(self, other: Self) -> bool {
        (self.proposal_id == other.proposal_id)
        & (self.operation_type == other.operation_type)
        & (self.proposer.eq(other.proposer))
        & (self.target_address.eq(other.target_address))
        & (self.new_threshold == other.new_threshold)
        & (self.transaction_data == other.transaction_data)
        & (self.signature_count == other.signature_count)
        & (self.executed == other.executed)
        & (self.created_at == other.created_at)
    }
}

// Default implementation for uninitialized proposals
impl Default for Proposal {
    fn default() -> Self {
        Proposal {
            proposal_id: 0,
            operation_type: 0,
            proposer: AztecAddress::zero(),
            target_address: AztecAddress::zero(),
            new_threshold: 0,
            transaction_data: 0,
            signature_count: 0,
            executed: false,
            created_at: 0,
        }
    }
}

impl Serialize<9> for Proposal {
    fn serialize(self) -> [Field; 9] {
        [
            self.proposal_id,
            self.operation_type as Field,
            self.proposer.to_field(),
            self.target_address.to_field(), 
            self.new_threshold as Field,
            self.transaction_data,
            self.signature_count as Field,
            self.executed as Field,
            self.created_at as Field,
        ]
    }
}

impl Deserialize<9> for Proposal {
    fn deserialize(serialized: [Field; 9]) -> Self {
        Proposal {
            proposal_id: serialized[0],
            operation_type: serialized[1] as u8,
            proposer: AztecAddress::from_field(serialized[2]),
            target_address: AztecAddress::from_field(serialized[3]),
            new_threshold: serialized[4] as u8,
            transaction_data: serialized[5],
            signature_count: serialized[6] as u8,
            executed: serialized[7] as bool,
            created_at: serialized[8] as u32,
        }
    }
}