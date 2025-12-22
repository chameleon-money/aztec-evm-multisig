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

mod multisig_proposal;

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

    use crate::multisig_proposal::{
        OPERATION_ADD_SIGNER, OPERATION_CHANGE_THRESHOLD, OPERATION_EXECUTE_TRANSACTION,
        OPERATION_REMOVE_SIGNER, Proposal,
    };

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

        // Proposals storage
        proposals: Map<Field, PublicMutable<Proposal, Context>, Context>,

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
        let proposal = Proposal::new(
            proposal_id,
            OPERATION_ADD_SIGNER,
            proposer,
            new_signer,
            0,
            EthAddress::zero(),
            EthAddress::zero(),
            0,
            0,
            false,
            context.block_number(),
        );

        storage.proposals.at(proposal_id).write(proposal);
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
        let proposal = Proposal::new(
            proposal_id,
            OPERATION_REMOVE_SIGNER,
            proposer,
            signer_to_remove,
            0,
            EthAddress::zero(),
            EthAddress::zero(),
            0,
            0,
            false,
            context.block_number(),
        );

        storage.proposals.at(proposal_id).write(proposal);
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
        let proposal = Proposal::new(
            proposal_id,
            OPERATION_CHANGE_THRESHOLD,
            proposer,
            AztecAddress::zero(),
            new_threshold,
            EthAddress::zero(),
            EthAddress::zero(),
            0,
            0,
            false,
            context.block_number(),
        );

        storage.proposals.at(proposal_id).write(proposal);
        storage.next_proposal_id.write(proposal_id + 1);

        proposal_id
    }

    // Propose executing a transaction
    #[external("public")]
    fn propose_execute_transaction(
        token: EthAddress,
        recipient: EthAddress,
        amount: Field,
    ) -> Field {
        let proposer = context.msg_sender().unwrap();

        // Validate proposer is a signer
        assert(storage.signers.at(proposer).read(), "Only signers can propose");

        // Create proposal
        let proposal_id = storage.next_proposal_id.read();
        let proposal = Proposal::new(
            proposal_id,
            OPERATION_EXECUTE_TRANSACTION,
            proposer,
            AztecAddress::zero(),
            0,
            token,
            recipient,
            amount,
            0,
            false,
            context.block_number(),
        );

        storage.proposals.at(proposal_id).write(proposal);
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
        let proposal = storage.proposals.at(proposal_id).read();
        assert(proposal.operation_type != 0, "Proposal does not exist");
        assert(!proposal.executed, "Proposal already executed");

        // Check proposal hasn't expired
        assert(
            context.block_number() <= (proposal.created_at + PROPOSAL_EXPIRY),
            "Proposal has expired",
        );

        // Increment signature count (nullifier uniqueness is enforced by Aztec protocol)
        let updated_proposal = proposal.add_signature();
        storage.proposals.at(proposal_id).write(updated_proposal);
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
        let proposal = storage.proposals.at(proposal_id).read();
        assert(proposal.operation_type != 0, "Proposal does not exist");
        assert(!proposal.executed, "Proposal already executed");

        // Check threshold is met
        let required_threshold = storage.threshold.read();
        assert(proposal.signature_count >= required_threshold, "Insufficient signatures");

        // Check proposal hasn't expired
        assert(
            context.block_number() <= (proposal.created_at + PROPOSAL_EXPIRY),
            "Proposal has expired",
        );

        // Execute based on operation type
        if proposal.operation_type == OPERATION_ADD_SIGNER {
            // Add new signer
            storage.signers.at(proposal.target_address).write(true);
            storage.signer_count.write(storage.signer_count.read() + 1);
        } else if proposal.operation_type == OPERATION_REMOVE_SIGNER {
            // Remove signer
            storage.signers.at(proposal.target_address).write(false);
            storage.signer_count.write(storage.signer_count.read() - 1);
        } else if proposal.operation_type == OPERATION_CHANGE_THRESHOLD {
            // Change threshold
            storage.threshold.write(proposal.new_threshold);
        } else if proposal.operation_type == OPERATION_EXECUTE_TRANSACTION {
            // transaction execution
            let wormhole_address = storage.wormhole_address.read();

            let field_bytes_token: [u8; 32] = proposal.transaction_token.to_field().to_be_bytes();
            let field_bytes_recipient: [u8; 32] =
                proposal.transaction_recipient.to_field().to_be_bytes();
            let field_bytes_amount: [u8; 32] = proposal.transaction_amount.to_be_bytes();
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

            let _ = Wormhole::at(wormhole_address)
                .publish_message_in_public(
                    proposal_id as u64,
                    [
                        payload_1, payload_2, payload_3, payload_4, payload_5, payload_6, payload_7,
                        payload_8,
                    ],
                    0,
                    2,
                    context.msg_sender().unwrap(),
                    0,
                )
                .call(&mut context);
        }

        // Mark proposal as executed
        let executed_proposal = proposal.mark_executed();
        storage.proposals.at(proposal_id).write(executed_proposal);
    }

    // View functions

    #[external("utility")]
    unconstrained fn get_threshold() -> u8 {
        storage.threshold.read()
    }

    #[external("utility")]
    unconstrained fn get_signer_count() -> u8 {
        storage.signer_count.read()
    }

    #[external("utility")]
    unconstrained fn is_signer(address: AztecAddress) -> bool {
        storage.signers.at(address).read()
    }

    #[external("utility")]
    unconstrained fn get_proposal(proposal_id: Field) -> Proposal {
        storage.proposals.at(proposal_id).read()
    }

    #[external("utility")]
    unconstrained fn get_proposal_operation_type(proposal_id: Field) -> u8 {
        storage.proposals.at(proposal_id).read().operation_type
    }

    #[external("utility")]
    unconstrained fn get_proposal_signature_count(proposal_id: Field) -> u8 {
        storage.proposals.at(proposal_id).read().signature_count
    }

    #[external("utility")]
    unconstrained fn get_proposal_executed(proposal_id: Field) -> bool {
        storage.proposals.at(proposal_id).read().executed
    }

    #[external("utility")]
    unconstrained fn get_next_proposal_id() -> Field {
        storage.next_proposal_id.read()
    }

    #[external("utility")]
    unconstrained fn get_wormhole_address() -> AztecAddress {
        storage.wormhole_address.read()
    }
}
