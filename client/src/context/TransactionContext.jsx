import React, { createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { contractAddress, contractABI } from '../utils/constants';

export const TransactionContext = createContext();

const { ethereum } = window;

const createEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);

    return transactionsContract;
};

export const TransactionProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [formData, setformData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [
        transactionCount,
        setTransactionCount
    ] = useState(localStorage.getItem('transactionCount'));

    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExists();
    }, [])

    const handleChange = (e, name) => {
        setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
    };

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert("Please install metamask");
            const accounts = await ethereum.request({ method: 'eth_accounts' });

            if (accounts.length > 0) {
                setCurrentAccount(accounts[0]);
                getAllTransactions();

            } else {
                console.log('No accounts found');
            }

        } catch (error) {
            console.error(error);
            throw new Error("No Ethereum object.")
        }
    }

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("Please install metamask");
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
            setCurrentAccount(accounts[0]);

        } catch (error) {
            console.error(error);
            throw new Error("No Ethereum object.")
        }
    }

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert("Please install metamask");
            const { addressTo, amount, keyword, message } = formData;
            const transactionContract = createEthereumContract();

            const parsedAmount = ethers.utils.parseEther(amount);

            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208', // 21000 GWEI
                    value: parsedAmount._hex // 0.00001
                }]
            });

            const transactionHash = await transactionContract.addToBlockchain(
                addressTo,
                parsedAmount,
                message,
                keyword
            );

            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`)

            await transactionHash.wait();

            setIsLoading(false);
            console.log(`Success - ${transactionHash.hash}`)

            const transactionsCount = await transactionContract.getAllTransactionCount();

            setTransactionCount(transactionsCount.toNumber());

            window.location.reload();

        } catch (error) {
            console.error(error);
            throw new Error("No Ethereum object.")
        }

    }

    const checkIfTransactionsExists = async () => {
        try {
            if (ethereum) {
                const transactionsContract = createEthereumContract();
                const currentTransactionCount = await transactionsContract.getAllTransactionCount();
                window.localStorage.setItem("transactionCount", currentTransactionCount);
            }

        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object");
        }
    };

    const getAllTransactions = async () => {
        try {
            if (ethereum) {
                const transactionsContract = createEthereumContract();
                const availableTransactions = await transactionsContract.getAllTransactions();

                const structuredTransactions = availableTransactions.map((transaction) => ({
                    addressTo: transaction.receiver,
                    addressFrom: transaction.sender,
                    timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                    message: transaction.message,
                    keyword: transaction.keyword,
                    amount: parseInt(transaction.amount._hex) / (10 ** 18)
                }));

                console.log({structuredTransactions});

                setTransactions(structuredTransactions);

            } else {
                console.log("Ethereum is not present");
            }

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <TransactionContext.Provider value={{
            connectWallet,
            currentAccount,
            formData,
            sendTransaction,
            handleChange,
            transactions,
            isLoading
        }}>
            {children}
        </TransactionContext.Provider>
    )
}
