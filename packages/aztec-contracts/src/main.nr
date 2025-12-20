// Private Multi-Signature Wallet Contract
//
// Features:
// 1. Initialize with list of signers and threshold
// 2. Add new signers (requires threshold approval)
// 3. Remove existing signers (requires threshold approval)
// 4. Change signature threshold (requires threshold approval)
// 5. Execute arbitrary transactions (requires threshold approval)
//
// Privacy Features:
// - Signatures are private - only the fact that threshold was met is public
// - Uses nullifiers to prevent double-signing without revealing signer identity

use dep::aztec::macros::aztec;

#[aztec]
pub contract MultiSig {
    use dep::aztec::{
        keys::getters::get_public_keys,
        macros::{functions::{external, initializer, internal}, storage::storage},
        state_vars::{Map, PublicMutable},
    };

    use dep::aztec::protocol_types::{
        address::{AztecAddress, EthAddress},
        hash::poseidon2_hash,
        traits::{Hash, ToField},
    };

    use dep::wormhole::Wormhole;

    // Operation types
    global OPERATION_ADD_SIGNER: u8 = 1;
    global OPERATION_REMOVE_SIGNER: u8 = 2;
    global OPERATION_CHANGE_THRESHOLD: u8 = 3;
    global OPERATION_EXECUTE_TRANSACTION: u8 = 4;

    // Proposal expiration time (in blocks)
    global PROPOSAL_EXPIRY: u32 = 1000;

    #[storage]
    struct Storage<Context> {
        // Mapping of address -> whether they are a signer
        signers: Map<AztecAddress, PublicMutable<bool, Context>, Context>,

        // Current threshold required for operations
        threshold: PublicMutable<u8, Context>,

        // Current number of signers
        signer_count: PublicMutable<u8, Context>,

        // Wormhole contract address
        wormhole_address: PublicMutable<AztecAddress, Context>,

        // Proposal fields (simplified storage)
        proposal_operation_type: Map<Field, PublicMutable<u8, Context>, Context>,
        proposal_proposer: Map<Field, PublicMutable<AztecAddress, Context>, Context>,
        proposal_target: Map<Field, PublicMutable<AztecAddress, Context>, Context>,
        proposal_new_threshold: Map<Field, PublicMutable<u8, Context>, Context>,
        proposal_transaction_token: Map<Field, PublicMutable<EthAddress, Context>, Context>,
        proposal_transaction_receipient: Map<Field, PublicMutable<EthAddress, Context>, Context>,
        proposal_transaction_amount: Map<Field, PublicMutable<Field, Context>, Context>,
        proposal_signature_count: Map<Field, PublicMutable<u8, Context>, Context>,
        proposal_executed: Map<Field, PublicMutable<bool, Context>, Context>,
        proposal_created_at: Map<Field, PublicMutable<u32, Context>, Context>,

        // Next available proposal ID
        next_proposal_id: PublicMutable<Field, Context>,
    }

    #[external("public")]
    #[initializer]
    fn constructor(
        initial_signers: [AztecAddress; 20],
        initial_signer_count: u8,
        initial_threshold: u8,
        wormhole_address: AztecAddress,
    ) {
        // Validate input parameters
        assert(initial_signer_count > 0, "Must have at least one signer");
        assert(initial_signer_count <= 20, "Too many signers");
        assert(initial_threshold > 0, "Threshold must be positive");
        assert(initial_threshold <= initial_signer_count, "Threshold cannot exceed signer count");

        // Initialize threshold and signer count
        storage.threshold.write(initial_threshold);
        storage.signer_count.write(initial_signer_count);
        storage.next_proposal_id.write(1);
        storage.wormhole_address.write(wormhole_address);

        // Add all initial signers
        for i in 0..20 {
            if (i as u8) < initial_signer_count {
                let signer_address = initial_signers[i];
                assert(!signer_address.eq(AztecAddress::zero()), "Invalid signer address");
                storage.signers.at(signer_address).write(true);
            }
        }
    }

    // Propose adding a new signer
    #[external("public")]
    fn propose_add_signer(new_signer: AztecAddress) -> Field {
        let proposer = context.msg_sender().unwrap();

        // Validate proposer is a signer
        assert(storage.signers.at(proposer).read(), "Only signers can propose");

        // Validate new signer
        assert(!new_signer.eq(AztecAddress::zero()), "Invalid signer address");
        assert(!storage.signers.at(new_signer).read(), "Address is already a signer");
        assert(storage.signer_count.read() < 20, "Maximum signers reached");

        // Create proposal
        let proposal_id = storage.next_proposal_id.read();

        storage.proposal_operation_type.at(proposal_id).write(OPERATION_ADD_SIGNER);
        storage.proposal_proposer.at(proposal_id).write(proposer);
        storage.proposal_target.at(proposal_id).write(new_signer);
        storage.proposal_new_threshold.at(proposal_id).write(0); // not used
        storage.proposal_transaction_token.at(proposal_id).write(EthAddress::zero()); // not used
        storage.proposal_transaction_receipient.at(proposal_id).write(EthAddress::zero()); // not used
        storage.proposal_transaction_amount.at(proposal_id).write(0); // not used
        storage.proposal_signature_count.at(proposal_id).write(0); // no automatic signature
        storage.proposal_executed.at(proposal_id).write(false);
        storage.proposal_created_at.at(proposal_id).write(context.block_number());

        storage.next_proposal_id.write(proposal_id + 1);

        proposal_id
    }

    // Propose removing an existing signer
    #[external("public")]
    fn propose_remove_signer(signer_to_remove: AztecAddress) -> Field {
        let proposer = context.msg_sender().unwrap();

        // Validate proposer is a signer
        assert(storage.signers.at(proposer).read(), "Only signers can propose");

        // Validate signer to remove
        assert(storage.signers.at(signer_to_remove).read(), "Address is not a signer");

        // Ensure we don't go below threshold
        let current_count = storage.signer_count.read();
        let current_threshold = storage.threshold.read();
        assert(current_count > 1, "Cannot remove last signer");
        assert((current_count - 1) >= current_threshold, "Removing signer would break threshold");

        // Create proposal
        let proposal_id = storage.next_proposal_id.read();

        storage.proposal_operation_type.at(proposal_id).write(OPERATION_REMOVE_SIGNER);
        storage.proposal_proposer.at(proposal_id).write(proposer);
        storage.proposal_target.at(proposal_id).write(signer_to_remove);
        storage.proposal_new_threshold.at(proposal_id).write(0); // not used
        storage.proposal_transaction_token.at(proposal_id).write(EthAddress::zero()); // not used
        storage.proposal_transaction_receipient.at(proposal_id).write(EthAddress::zero()); // not used
        storage.proposal_transaction_amount.at(proposal_id).write(0); // not used
        storage.proposal_signature_count.at(proposal_id).write(0); // no automatic signature
        storage.proposal_executed.at(proposal_id).write(false);
        storage.proposal_created_at.at(proposal_id).write(context.block_number());

        storage.next_proposal_id.write(proposal_id + 1);

        proposal_id
    }

    // Propose changing the signature threshold
    #[external("public")]
    fn propose_change_threshold(new_threshold: u8) -> Field {
        let proposer = context.msg_sender().unwrap();

        // Validate proposer is a signer
        assert(storage.signers.at(proposer).read(), "Only signers can propose");

        // Validate new threshold
        assert(new_threshold > 0, "Threshold must be positive");
        let current_signer_count = storage.signer_count.read();
        assert(new_threshold <= current_signer_count, "Threshold cannot exceed signer count");
        assert(new_threshold != storage.threshold.read(), "Threshold is already set to this value");

        // Create proposal
        let proposal_id = storage.next_proposal_id.read();

        storage.proposal_operation_type.at(proposal_id).write(OPERATION_CHANGE_THRESHOLD);
        storage.proposal_proposer.at(proposal_id).write(proposer);
        storage.proposal_target.at(proposal_id).write(AztecAddress::zero()); // not used
        storage.proposal_new_threshold.at(proposal_id).write(new_threshold);
        storage.proposal_transaction_token.at(proposal_id).write(EthAddress::zero()); // not used
        storage.proposal_transaction_receipient.at(proposal_id).write(EthAddress::zero()); // not used
        storage.proposal_transaction_amount.at(proposal_id).write(0); // not used
        storage.proposal_signature_count.at(proposal_id).write(0); // no automatic signature
        storage.proposal_executed.at(proposal_id).write(false);
        storage.proposal_created_at.at(proposal_id).write(context.block_number());

        storage.next_proposal_id.write(proposal_id + 1);

        proposal_id
    }

    // Propose executing a transaction
    #[external("public")]
    fn propose_execute_transaction(
        token: EthAddress, 
        recipient: EthAddress, 
        amount: Field
    ) -> Field {
        let proposer = context.msg_sender().unwrap();

        // Validate proposer is a signer
        assert(storage.signers.at(proposer).read(), "Only signers can propose");

        // Create proposal
        let proposal_id = storage.next_proposal_id.read();

        storage.proposal_operation_type.at(proposal_id).write(OPERATION_EXECUTE_TRANSACTION);
        storage.proposal_proposer.at(proposal_id).write(proposer);
        storage.proposal_target.at(proposal_id).write(AztecAddress::zero());
        storage.proposal_new_threshold.at(proposal_id).write(0); // not used
        storage.proposal_transaction_token.at(proposal_id).write(token);
        storage.proposal_transaction_receipient.at(proposal_id).write(recipient);
        storage.proposal_transaction_amount.at(proposal_id).write(amount);
        storage.proposal_signature_count.at(proposal_id).write(0); // no automatic signature
        storage.proposal_executed.at(proposal_id).write(false);
        storage.proposal_created_at.at(proposal_id).write(context.block_number());

        storage.next_proposal_id.write(proposal_id + 1);

        proposal_id
    }

    // Sign a proposal privately
    #[external("private")]
    fn sign_proposal(proposal_id: Field) {
        let signer = context.msg_sender().unwrap();

        MultiSig::at(context.this_address())._assert_is_signer(signer).enqueue(&mut context);

        let msg_sender_nullifier_public_key_message_hash = get_public_keys(signer).npk_m.hash();

        let secret = context.request_nsk_app(msg_sender_nullifier_public_key_message_hash);

        // Generate deterministic nullifier to prevent double-signing
        // Using proposal_id and signer ensures uniqueness per signer per proposal
        let nullifier = poseidon2_hash([proposal_id, signer.to_field(), secret]);

        // Push nullifier to prevent double-signing - Aztec protocol handles the rest
        context.push_nullifier(nullifier);

        // Enqueue public function to update signature count
        MultiSig::at(context.this_address()).increment_signature_count(proposal_id).enqueue(
            &mut context,
        );
    }

    // Internal public function to increment signature count
    #[external("public")]
    #[internal]
    fn increment_signature_count(proposal_id: Field) {
        // Validate proposal exists and is still active
        let operation_type = storage.proposal_operation_type.at(proposal_id).read();
        assert(operation_type != 0, "Proposal does not exist");
        assert(!storage.proposal_executed.at(proposal_id).read(), "Proposal already executed");

        // Check proposal hasn't expired
        let created_at = storage.proposal_created_at.at(proposal_id).read();
        assert(context.block_number() <= (created_at + PROPOSAL_EXPIRY), "Proposal has expired");

        // Increment signature count (nullifier uniqueness is enforced by Aztec protocol)
        let current_count = storage.proposal_signature_count.at(proposal_id).read();
        storage.proposal_signature_count.at(proposal_id).write(current_count + 1);
    }

    #[external("public")]
    #[internal]
    fn _assert_is_signer(signer: AztecAddress) {
        assert(storage.signers.at(signer).read(), "Only authorized signers can sign proposals");
    }

    // Execute a proposal if it has enough signatures
    #[external("public")]
    fn execute_proposal(proposal_id: Field) {
        // Validate proposal exists
        let operation_type = storage.proposal_operation_type.at(proposal_id).read();
        assert(operation_type != 0, "Proposal does not exist");
        assert(!storage.proposal_executed.at(proposal_id).read(), "Proposal already executed");

        // Check threshold is met
        let required_threshold = storage.threshold.read();
        let signature_count = storage.proposal_signature_count.at(proposal_id).read();
        assert(signature_count >= required_threshold, "Insufficient signatures");

        // Check proposal hasn't expired
        let created_at = storage.proposal_created_at.at(proposal_id).read();
        assert(context.block_number() <= (created_at + PROPOSAL_EXPIRY), "Proposal has expired");

        // Execute based on operation type
        if operation_type == OPERATION_ADD_SIGNER {
            // Add new signer
            let target = storage.proposal_target.at(proposal_id).read();
            storage.signers.at(target).write(true);
            storage.signer_count.write(storage.signer_count.read() + 1);
        } else if operation_type == OPERATION_REMOVE_SIGNER {
            // Remove signer
            let target = storage.proposal_target.at(proposal_id).read();
            storage.signers.at(target).write(false);
            storage.signer_count.write(storage.signer_count.read() - 1);
        } else if operation_type == OPERATION_CHANGE_THRESHOLD {
            // Change threshold
            let new_threshold = storage.proposal_new_threshold.at(proposal_id).read();
            storage.threshold.write(new_threshold);
        } else if operation_type == OPERATION_EXECUTE_TRANSACTION {
            // transaction execution
            let wormhole_address = storage.wormhole_address.read();
            let token = storage.proposal_transaction_token.at(proposal_id).read();
            let recipient = storage.proposal_transaction_receipient.at(proposal_id).read();
            let amount = storage.proposal_transaction_amount.at(proposal_id).read();

            let field_bytes_token: [u8; 32] = token.to_field().to_be_bytes();
            let field_bytes_recipient: [u8; 32] = recipient.to_field().to_be_bytes();
            let field_bytes_amount: [u8; 32] = amount.to_be_bytes();
            let mut payload_1 = [0; 31];
            let mut payload_2 = [0; 31];
            let mut payload_3 = [0; 31];
            let payload_4 = [0; 31];
            let payload_5 = [0; 31];
            let payload_6 = [0; 31];
            let payload_7 = [0; 31];
            let payload_8 = [0; 31];

            for i in 0..31 {
                payload_1[i] = field_bytes_token[i + 1];
                payload_2[i] = field_bytes_recipient[i + 1];
                payload_3[i] = field_bytes_amount[i + 1];
            }

            let _ = Wormhole::at(wormhole_address).publish_message_in_public(
                proposal_id as u64,
                [
                    payload_1, 
                    payload_2, 
                    payload_3, 
                    payload_4, 
                    payload_5, 
                    payload_6, 
                    payload_7, 
                    payload_8
                ],
                0,
                2,
                context.msg_sender().unwrap(),
                0,
            ).call(&mut context);
        }

        // Mark proposal as executed
        storage.proposal_executed.at(proposal_id).write(true);
    }

    // View functions

    #[external("public")]
    fn get_threshold() -> u8 {
        storage.threshold.read()
    }

    #[external("public")]
    fn get_signer_count() -> u8 {
        storage.signer_count.read()
    }

    #[external("public")]
    fn is_signer(address: AztecAddress) -> bool {
        storage.signers.at(address).read()
    }

    #[external("public")]
    fn get_proposal_operation_type(proposal_id: Field) -> u8 {
        storage.proposal_operation_type.at(proposal_id).read()
    }

    #[external("public")]
    fn get_proposal_signature_count(proposal_id: Field) -> u8 {
        storage.proposal_signature_count.at(proposal_id).read()
    }

    #[external("public")]
    fn get_proposal_executed(proposal_id: Field) -> bool {
        storage.proposal_executed.at(proposal_id).read()
    }

    #[external("public")]
    fn get_next_proposal_id() -> Field {
        storage.next_proposal_id.read()
    }

    #[external("public")]
    fn get_wormhole_address() -> AztecAddress {
        storage.wormhole_address.read()
    }
}
