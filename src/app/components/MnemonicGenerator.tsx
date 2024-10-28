"use client";
import { generateMnemonic } from "bip39";
import React, { useEffect, useState } from "react";
import copy from "clipboard-copy";
import { toast, Toaster } from "sonner";
import { mnemonicToSeed } from "bip39";
import { Wallet, HDNodeWallet, encodeBase58 } from "ethers";
import { Clipboard, Eye, EyeOff } from "lucide-react";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl"


const MnemonicGenerator = () => {
    const [mnemonics, setMnemonics] = useState(" ");
    const [isCopied, setIsCopied] = useState(false);

    const makeMnemonics = () => {
        setMnemonics(generateMnemonic());
    };

    useEffect(() => {
        makeMnemonics();
    }, []);

    const handleCopyClick = async () => {
        try {
            await copy(mnemonics);
            toast.success("All Mnemonics Copied to Clipboard!");
            setIsCopied(true);
        } catch (error) {
            console.error("Failed to copy text to clipboard", error);
        }
    };

    return (
        <div className="flex flex-col items-center p-6">
            <button
                onClick={makeMnemonics}
                className="mb-8 px-6 py-3 text-base font-medium bg-gray-700 border-2 border-transparent hover:bg-gray-800 hover:border-gray-700 hover:border-2 text-white rounded-md transition-all duration-200"
            >
                Generate Mnemonics
            </button>
            <Toaster position="top-right" />
            {mnemonics !== " " && (
                <div
                    onClick={handleCopyClick}
                    className="bg-gray-800 p-4 rounded-md shadow-md grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl w-full"
                >
                    {mnemonics.split(" ").map((word, index) => (
                        <p
                            key={index}
                            className="p-3 bg-gray-800 border-2 border-gray-700 hover:bg-gray-700 text-center rounded text-sm font-medium text-gray-200"
                        >
                            {word}
                        </p>
                    ))}
                    <div className="col-span-full flex items-center justify-center text-gray-400 text-sm">
                        <Clipboard className="mr-2" /> Click anywhere to copy!
                    </div>
                </div>
            )}
            <EthWallet mnemonics={mnemonics} />
            <SolanaWallet mnemonics={mnemonics} />
        </div>
    );
};

export default MnemonicGenerator;



type WalletAddress = {
    publicKey: string,
    privateKey: string,
    visible: boolean
}
export function SolanaWallet({ mnemonics }: { mnemonics: string }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [addresses, setAddresses] = useState<WalletAddress[]>([]);
    const togglePrivateKeyVisibility = (index: number) => {
        setAddresses((prevAddresses) =>
            prevAddresses.map((addr, i) =>
                i === index ? { ...addr, visible: !addr.visible } : addr
            )
        );
    };

    return <div>
        <button
            className="mb-4 px-4 py-2 text-base font-medium bg-gray-700 border-2 border-transparent hover:bg-gray-800 hover:border-gray-700 text-white rounded-md transition-all duration-200"
            onClick={function () {
            const seed = mnemonicToSeed(mnemonics);
            const path = `m/44'/501'/${currentIndex}'/0'`;
            const derivedSeed = derivePath(path, seed.toString()).key;
            const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
            const keypair = Keypair.fromSecretKey(secret);
            setCurrentIndex(currentIndex + 1);
            let privateKeyEncoded = encodeBase58(secret);
            let publicKeyEncoded = keypair.publicKey.toBase58();
            setAddresses((prev) => [
            ...prev, { publicKey: publicKeyEncoded, privateKey: privateKeyEncoded, visible: false }])
        }}>
            Add Solana wallet
        </button>

        {addresses.map((walletInfo, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-md shadow-md mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-200">Wallet Address: {walletInfo.publicKey}</span>
                    <button onClick={() => togglePrivateKeyVisibility(index)}>
                        {walletInfo.visible ? <EyeOff /> : <Eye />}
                    </button>
                </div>
                <div className="text-gray-200">
                    Private Key: {walletInfo.visible ? walletInfo.privateKey : "* * * * * * * * "}
                </div>
            </div>
        ))}
        
    </div>
}

export const EthWallet = ({ mnemonics }: { mnemonics: string }) => {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [addresses, setAddresses] = useState<WalletAddress[]>([]);

    const togglePrivateKeyVisibility = (index: number) => {
        setAddresses((prevAddresses) =>
            prevAddresses.map((addr, i) =>
                i === index ? { ...addr, visible: !addr.visible } : addr
            )
        );
    };

    const addWallet = async () => {
        const seed = await mnemonicToSeed(mnemonics);
        const derivationPath = `m/44'/60'/${currentIndex}'/0'`;
        const hdNode = HDNodeWallet.fromSeed(seed);
        const child = hdNode.derivePath(derivationPath);
        const privateKey = child.privateKey;
        const wallet = new Wallet(privateKey);

        setAddresses((prev) => [
            ...prev,
            { publicKey: wallet.address, privateKey, visible: false },
        ]);
        setCurrentIndex(currentIndex + 1);
    };

    return (
        <div className="mt-6">
            <button
                onClick={addWallet}
                className="mb-4 px-4 py-2 text-base font-medium bg-gray-700 border-2 border-transparent hover:bg-gray-800 hover:border-gray-700 text-white rounded-md transition-all duration-200"
            >
                Add ETH Wallet
            </button>

            {addresses.map((walletInfo, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-md shadow-md mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-200">Wallet Address: {walletInfo.publicKey}</span>
                        <button onClick={() => togglePrivateKeyVisibility(index)}>
                            {walletInfo.visible ? <EyeOff /> : <Eye />}
                        </button>
                    </div>
                    <div className="text-gray-200">
                        Private Key: {walletInfo.visible ? walletInfo.privateKey : "* * * * * * * * "}
                    </div>
                </div>
            ))}
        </div>
    );
};
