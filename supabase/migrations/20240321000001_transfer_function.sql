-- Drop existing function if it exists
DROP FUNCTION IF EXISTS transfer_money(UUID, UUID, DECIMAL, TEXT);

-- Create transfer_money function
CREATE OR REPLACE FUNCTION transfer_money(
    sender_id UUID,
    recipient_id UUID,
    amount DECIMAL(10,2),
    description TEXT
) RETURNS void AS $$
DECLARE
    sender_balance DECIMAL(10,2);
    recipient_balance DECIMAL(10,2);
    transfer_reference_id TEXT;
BEGIN
    -- Check minimum transfer amount
    IF amount < 50 THEN
        RAISE EXCEPTION 'Minimum transfer amount is ₱50.00';
    END IF;

    -- Check if sender has sufficient balance
    SELECT available_balance INTO sender_balance
    FROM balances
    WHERE account_id = sender_id
    FOR UPDATE;

    IF sender_balance < amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Get recipient's current balance
    SELECT available_balance INTO recipient_balance
    FROM balances
    WHERE account_id = recipient_id
    FOR UPDATE;

    -- Generate a reference ID for the transfer
    transfer_reference_id := 'TRF-' || gen_random_uuid();

    -- Update sender's balance
    UPDATE balances
    SET 
        available_balance = available_balance - amount,
        total_balance = total_balance - amount,
        updated_at = NOW()
    WHERE account_id = sender_id;

    -- Update recipient's balance
    UPDATE balances
    SET 
        available_balance = available_balance + amount,
        total_balance = total_balance + amount,
        updated_at = NOW()
    WHERE account_id = recipient_id;

    -- Record sender's transaction
    INSERT INTO transactions (
        account_id,
        recipient_account_id,
        amount,
        transaction_type,
        description,
        status,
        reference_id
    ) VALUES (
        sender_id,
        recipient_id,
        -amount,
        'transfer',
        description,
        'completed',
        transfer_reference_id
    );

    -- Record recipient's transaction
    INSERT INTO transactions (
        account_id,
        recipient_account_id,
        amount,
        transaction_type,
        description,
        status,
        reference_id
    ) VALUES (
        recipient_id,
        sender_id,
        amount,
        'transfer',
        description,
        'completed',
        transfer_reference_id
    );
END;
$$ LANGUAGE plpgsql; 