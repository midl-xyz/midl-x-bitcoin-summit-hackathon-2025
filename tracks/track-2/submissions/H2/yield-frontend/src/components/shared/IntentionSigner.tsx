import { useEffect, useMemo, useRef } from 'react';

import { CountdownTimer } from '@/components/shared/ui/CountdownTimer';
import { Modal } from '@/components/shared/ui/modal';
import { TX_CONFIRMATION_TIME } from '@/config/midlConfig';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';
import { Button } from '@/components/ui/button';
import {
    useAddTxIntention,
    useClearTxIntentions,
    useFinalizeBTCTransaction,
    useSendBTCTransactions,
    useSignIntention
} from '@midl-xyz/midl-js-executor-react';
import { useConfig, useWaitForTransaction } from '@midl-xyz/midl-js-react';

import { toast } from 'sonner';
import { type Address } from 'viem';

type IntentionSignerProps = {
    isOpen: boolean;
    onClose: () => void;
    shouldComplete?: boolean;
    assetsToWithdraw?: [Address] | [Address, Address];
};

export const IntentionSigner = ({ isOpen, onClose, assetsToWithdraw }: IntentionSignerProps) => {
    const { txIntentions } = useAddTxIntention();
    const clearTxIntentions = useClearTxIntentions();
    const hasRefetchedRef = useRef(false);

    const {
        data: btcTransaction,
        finalizeBTCTransaction,
        isSuccess: isFinalizedBTC,
        isPending: isFinalizingBTC,
        reset: resetBTCTransaction,
        // signIntentionState, Notice: Now retrieved from useIntentionSigner
        isError,
        error
    } = useFinalizeBTCTransaction({
        mutation: {
            onError: (error) => {
                console.error(error);

                const btcBalanceError = 'BTC balance is not enough to cover tx costs';
                if (error.message === 'No selected UTXOs') {
                    error.message = btcBalanceError;
                }

                if (error.message === 'No ordinals / rune UTXOs') {
                    error.message = 'Native token balance is not enough to cover tx';
                }

                if (error.message === 'Insufficient funds') {
                    error.message = 'Wallet balance is not enough';
                }

                if (error.message.startsWith('Cannot destructure')) {
                    error.message = 'Error at transaction signing. Refresh the page and try again';
                }
                toast.error(error.message);
            },
            onSuccess: () => {
                // Reset state on error
            }
        }
    });

    const signIntentionState = useSignIntention({});
    const resetSignIntention = signIntentionState.reset;
    const { network } = useConfig();

    const { waitForTransaction, isPending, isSuccess, reset: resetTransaction } = useWaitForTransaction();

    // Determine if we're on testnet or mainnet
    const isTestnet = useMemo(() => {
        // Check if network id contains 'test', 'regtest', or 'signet'
        // Network ID is typically a string like 'regtest', 'testnet', 'signet', or 'mainnet'
        const networkId = network?.id?.toString().toLowerCase();

        if (!networkId) return true; // Default to testnet timing if network is undefined

        return networkId.includes('test') || networkId.includes('signet') || networkId.includes('regtest');
    }, [network]);

    // Get confirmation time based on network
    const confirmationTime = TX_CONFIRMATION_TIME / 1000; // Convert to seconds

    // Initialize countdown timer
    const {
        timeRemaining,
        reset: resetTimer
    } = useCountdownTimer({
        initialTime: confirmationTime,
        autoStart: isPending,
        onComplete: () => {
            // Optional: Add any action when timer completes
        }
    });

    // Refetch global data when transaction is successful (only once per transaction)
    useEffect(() => {
        if (isSuccess && !hasRefetchedRef.current) {
            hasRefetchedRef.current = true;

            // Transaction confirmed
            toast.success('Transaction confirmed!');
        }
    }, [isSuccess]);

    // Reset all states when modal closes or opens with previous success state
    useEffect(() => {
        if (!isOpen) {
            // Clear all states when modal closes
            resetTransaction?.();
            resetBTCTransaction?.();
            resetSendBTC?.();
            resetSignIntention?.();
            clearTxIntentions();
            // Reset state
            resetTimer();
            // Reset the refetch flag for next transaction
            hasRefetchedRef.current = false;
        }
    }, [isOpen, resetTimer]);

    const toSignIntentions = txIntentions.filter((it) => it.evmTransaction);
    const txToSign = toSignIntentions.find((it) => !it.signedEvmTransaction);

    const {
        sendBTCTransactions,
        isSuccess: isBroadcasted,
        reset: resetSendBTC
    } = useSendBTCTransactions({
        mutation: {
            onSuccess: () => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                waitForTransaction({ txId: btcTransaction?.tx.id! });
            }
        }
    });

    const onPublish = async () => {
        const txIntentionsToPublish = txIntentions
            .filter((it) => it.signedEvmTransaction)
            .map((it) => it.signedEvmTransaction);

        // Notice now get intention.signedEvmTransaction! into an array and pass to serializedTransactions & btcTransaction?.tx.hex! to btcTransaction
        sendBTCTransactions({
            serializedTransactions: txIntentionsToPublish as [],
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            btcTransaction: btcTransaction?.tx.hex!
        });
    };

    const getModalTitle = () => {
        if (isSuccess) return 'Transaction Confirmed';
        if (isPending) return 'Processing Transaction';
        if (isBroadcasted) return 'Broadcasting Transaction';
        if (isFinalizedBTC && !txToSign) return 'Publish Transaction';
        if (isFinalizedBTC && txToSign) return 'Sign Intention';

        return 'Sign BTC Transaction';
    };

    const handleClose = () => {
        // Clear all states when closing the modal
        clearTxIntentions();
        onClose();
    };

    return (
        <Modal
            title={getModalTitle()}
            isOpen={isOpen}
            onClose={handleClose}
            description='Complete the multi-step signing process'
            overlayClassName='bg-black/60 backdrop-blur-md'>
            <div className='flex flex-col items-start justify-start gap-5 self-stretch p-6 md:gap-7'>
                {/* Progress Indicator */}
                <div className='flex items-center justify-center gap-2 self-stretch'>
                    {new Array(toSignIntentions.length + 1).fill(0).map((_, i) => (
                        <div key={i} className='flex items-center'>
                            <div
                                className={[
                                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all md:h-11 md:w-11',
                                    (i === 0 && isFinalizedBTC) || toSignIntentions[i - 1]?.signedEvmTransaction
                                        ? 'border-[#de741e] bg-[#de741e] text-white'
                                        : 'border-gray-300 bg-white text-gray-500'
                                ].join(' ')}>
                                <span className='font-primary text-sm font-medium md:text-base'>{i + 1}</span>
                            </div>
                            {i < toSignIntentions.length && (
                                <div
                                    className={[
                                        'mx-1 h-0.5 w-8 transition-all md:w-10',
                                        (i === 0 && isFinalizedBTC) || toSignIntentions[i - 1]?.signedEvmTransaction
                                            ? 'bg-[#de741e]'
                                            : 'bg-gray-200'
                                    ].join(' ')}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Content based on state */}
                <div className='flex flex-col items-start justify-start gap-4 self-stretch'>
                    {!isFinalizedBTC && (
                        <>
                            <div className='flex flex-col gap-2 self-stretch'>
                                <div className='font-primary text-base font-medium text-gray-900 md:text-lg'>
                                    Step 1: Sign BTC Transaction
                                </div>
                                <div className='font-primary text-sm font-normal text-gray-600 md:text-base'>
                                    Please sign the BTC transaction to proceed with the withdrawal.
                                </div>
                            </div>
                            <Button
                                onClick={() => {
                                    const params: any = {
                                        assetsToWithdrawSize: 1
                                    };

                                    // if (customStateOverride && customStateOverride.length > 0) {
                                    //     params.stateOverride = customStateOverride;
                                    // }
                                    // console.log({txIntentions});
                                    finalizeBTCTransaction(params);
                                }}
                                disabled={isFinalizingBTC}
                                className='flex h-10 w-full items-center justify-center rounded-[20px] bg-[#de741e] transition-colors hover:bg-[#de741e]/90 disabled:cursor-not-allowed disabled:opacity-50 md:h-11'>
                                <span className='font-primary text-sm font-medium text-white md:text-base'>
                                    {isFinalizingBTC ? 'Confirming...' : 'Sign BTC Transaction'}
                                </span>
                            </Button>
                        </>
                    )}

                    {isFinalizedBTC && txToSign && btcTransaction && (
                        <>
                            <div className='flex flex-col gap-2 self-stretch'>
                                <div className='font-primary text-base font-medium text-gray-900 md:text-lg'>
                                    Step 2: Sign Transaction Intention
                                </div>
                                <div className='font-primary text-sm font-normal text-gray-600 md:text-base'>
                                    Sign the transaction intention to complete the process.
                                </div>
                            </div>
                            <Button
                                disabled={signIntentionState.isPending}
                                onClick={() => {
                                    signIntentionState.signIntention({
                                        intention: txToSign,
                                        txId: btcTransaction.tx.id
                                    });
                                    toast.success('Intention signed successfully');
                                }}
                                className='flex h-10 w-full items-center justify-center rounded-[20px] bg-[#de741e] transition-colors hover:bg-[#de741e]/90 disabled:cursor-not-allowed disabled:opacity-50 md:h-11'>
                                <span className='font-primary text-sm font-medium text-white md:text-base'>
                                    {signIntentionState.isPending ? 'Signing...' : 'Sign Intention'}
                                </span>
                            </Button>
                        </>
                    )}

                    {isFinalizedBTC && !txToSign && btcTransaction && !isBroadcasted && (
                        <>
                            <div className='flex flex-col gap-2 self-stretch'>
                                <div className='font-primary text-base font-medium text-gray-900 md:text-lg'>
                                    Ready to Publish
                                </div>
                                <div className='font-primary text-sm font-normal text-gray-600 md:text-base'>
                                    All intentions have been signed. You can now publish the transaction.
                                </div>
                            </div>
                            <Button
                                onClick={onPublish}
                                className='flex h-10 w-full items-center justify-center rounded-[20px] bg-[#de741e] transition-colors hover:bg-[#de741e]/90 md:h-11'>
                                <span className='font-primary text-sm font-medium text-white md:text-base'>
                                    Publish Transaction
                                </span>
                            </Button>
                        </>
                    )}

                    {isPending && (
                        <>
                            <div className='flex flex-col gap-2 self-stretch'>
                                <div className='font-primary text-base font-medium text-gray-900 md:text-lg'>
                                    Transaction Processing
                                </div>
                                <div className='font-primary text-sm font-normal text-gray-600 md:text-base'>
                                    Waiting for the transaction to be confirmed on the blockchain...
                                </div>
                            </div>

                            {/* Countdown Timer */}
                            <CountdownTimer
                                timeRemaining={timeRemaining}
                                totalTime={TX_CONFIRMATION_TIME / 1000}
                                showTimeText={true}
                                size="default"
                                variant="default"
                            />

                            <div className='flex items-center justify-center self-stretch'>
                                <a
                                    href={`${network?.explorerUrl}/tx/${btcTransaction!.tx.id}`}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='font-primary text-sm font-medium text-[#de741e] underline transition-opacity hover:opacity-80 md:text-base'>
                                    View on Explorer →
                                </a>
                            </div>
                        </>
                    )}

                    {isSuccess && (
                        <>
                            <div className='flex flex-col gap-2 self-stretch'>
                                <div className='flex items-center justify-center gap-2 self-stretch'>
                                    <svg
                                        width='24'
                                        height='24'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        className='text-[#148618]'>
                                        <path
                                            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                        />
                                    </svg>
                                    <div className='font-primary text-base font-medium text-[#148618] md:text-lg'>
                                        Transaction Confirmed Successfully
                                    </div>
                                </div>
                                <div className='font-primary text-center text-sm font-normal text-gray-600 md:text-base'>
                                    Your transaction has been successfully confirmed on the blockchain.
                                </div>
                            </div>
                            <Button
                                onClick={() => {
                                    handleClose();
                                }}
                                className='flex h-10 w-full items-center justify-center rounded-[20px] bg-[#de741e] transition-colors hover:bg-[#de741e]/90 md:h-11'>
                                <span className='font-primary text-sm font-medium text-white md:text-base'>Close</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};
