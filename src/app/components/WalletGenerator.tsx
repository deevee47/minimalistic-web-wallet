"use client";
import { generateMnemonic, mnemonicToSeed } from "bip39";
import React, { useEffect, useState } from "react";
import copy from "clipboard-copy";
import { toast, Toaster } from "sonner";
import { Wallet, HDNodeWallet, encodeBase58 } from "ethers";
import { Clipboard, Eye, EyeOff, Plus, RefreshCw, Wallet2 } from "lucide-react";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

type WalletAddress = {
    publicKey: string;
    privateKey: string;
    visible: boolean;
    balance: string;
};

type WalletsState = {
    solana: WalletAddress[];
    ethereum: WalletAddress[];
};

const MnemonicGenerator = () => {
    const [mnemonics, setMnemonics] = useState<string>("");
    const [, setIsCopied] = useState(false);
    const [wallets, setWallets] = useState<WalletsState>({
        solana: [],
        ethereum: []
    });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setMnemonics(generateMnemonic());
        }
    }, []);

    const handleCopyClick = async () => {
        try {
            await copy(mnemonics);
            toast.success("Mnemonics copied!", {
                className: "bg-slate-900 text-cyan-400 border border-cyan-700"
            });
            setIsCopied(true);
        } catch (error) {
            console.error("Failed to copy text to clipboard", error);
        }
    };

    const generateNewMnemonic = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setMnemonics(generateMnemonic());
            setIsGenerating(false);
        }, 500);
    };

    // ... (keeping the wallet generation and balance fetching functions the same)
    const generateWallet = async (type: "solana" | "ethereum") => {
        const seed = await mnemonicToSeed(mnemonics);
        const path = type === "solana" ? `m/44'/501'/${currentIndex}'/0'` : `m/44'/60'/${currentIndex}'/0'`;
        let walletInfo: WalletAddress;

        if (type === "solana") {
            const derivedSeed = derivePath(path, seed.toString()).key;
            const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
            const keypair = Keypair.fromSecretKey(secret);
            walletInfo = {
                publicKey: keypair.publicKey.toBase58(),
                privateKey: encodeBase58(secret),
                visible: false,
                balance: "Check Balance"
            };
        } else {
            const hdNode = HDNodeWallet.fromSeed(seed);
            const child = hdNode.derivePath(path);
            const wallet = new Wallet(child.privateKey);
            walletInfo = {
                publicKey: wallet.address,
                privateKey: child.privateKey,
                visible: false,
                balance: "Check Balance"
            };
        }

        setWallets((prevWallets) => ({
            ...prevWallets,
            [type]: [...prevWallets[type], walletInfo]
        }));
        setCurrentIndex(currentIndex + 1);
    };

    const togglePrivateKeyVisibility = (type: "solana" | "ethereum", index: number) => {
        setWallets((prevWallets) => ({
            ...prevWallets,
            [type]: prevWallets[type].map((wallet, i) =>
                i === index ? { ...wallet, visible: !wallet.visible } : wallet
            )
        }));
    };

    const fetchBalance = async (publicKey: string, type: "solana" | "ethereum", index: number) => {
        const formData = type === "ethereum" ? {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_getBalance",
            "params": [`${publicKey}`, "latest"]
        } : {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBalance",
            "params": [`${publicKey}`]
        }
        const URL = type === "ethereum" ? "https://eth-mainnet.g.alchemy.com/v2/nA0KT5oVQ_EKD4kfLE0PCea0YER_p03-" : "https://solana-mainnet.g.alchemy.com/v2/nA0KT5oVQ_EKD4kfLE0PCea0YER_p03-"
        const res = await axios.post(URL, formData);
        const balanceReceived = type === "ethereum" ? res.data.result : res.data.result.value;

        const balance = type === "ethereum"
            ? parseInt(balanceReceived.slice(2), 16).toString()
            : (balanceReceived / 1e9).toString();

        setWallets((prevWallets) => ({
            ...prevWallets,
            [type]: prevWallets[type].map((wallet, i) =>
                i === index ? { ...wallet, balance } : wallet
            )
        }));
    }

    return (
        <div className="min-h-screen bg-slate-950 text-cyan-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
                        COIN STASH
                    </h1>
                    <h1 className="text-md font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
                        Your Go To Web Wallet
                    </h1>
                    <Button
                        onClick={generateNewMnemonic}
                        className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-700 hover:border-cyan-500 transition-all duration-300 group"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
                        Generate New Seed
                    </Button>
                </div>

                {/* Mnemonic Display */}
                {mnemonics && (
                    <div className="mb-12">
                        <div
                            onClick={handleCopyClick}
                            className="bg-slate-900 rounded-xl border border-cyan-900 hover:border-cyan-700 transition-all duration-300 p-6 cursor-pointer relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {mnemonics.split(" ").map((word, index) => (
                                    <div
                                        key={index}
                                        className="bg-slate-800 px-4 py-2 rounded-lg text-center font-mono text-sm text-cyan-400 border border-cyan-900/50"
                                    >
                                        {word}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center justify-center text-cyan-500 text-sm">
                                <Clipboard className="mr-2 w-4 h-4" /> Click to copy seed phrase
                            </div>
                        </div>
                    </div>
                )}

                {/* Wallet Section */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-purple-500/5 rounded-2xl" />
                    <Tabs defaultValue="solana" className="relative">
                        <TabsList className="w-full max-w-xs mx-auto mb-8 bg-slate-900 p-1 rounded-lg border border-cyan-900">
                            <TabsTrigger
                                value="solana"
                                className="w-1/2 data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-400 rounded-md transition-all duration-300"
                            >
                                Solana
                            </TabsTrigger>
                            <TabsTrigger
                                value="ethereum"
                                className="w-1/2 data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-400 rounded-md transition-all duration-300"
                            >
                                Ethereum
                            </TabsTrigger>
                        </TabsList>

                        {["solana", "ethereum"].map((type) => (
                            <TabsContent value={type} key={type}>
                                <Card className="bg-slate-900 border-cyan-900">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-cyan-900/30">
                                        <CardTitle className="text-xl text-cyan-400 flex items-center">
                                            <Wallet2 className="mr-2" />
                                            {type.charAt(0).toUpperCase() + type.slice(1)} Wallets
                                        </CardTitle>
                                        <Button
                                            onClick={() => generateWallet(type as "solana" | "ethereum")}
                                            className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-700 hover:border-cyan-500"
                                        >
                                            <Plus className="mr-2 w-4 h-4" /> New Wallet
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4 mt-4">
                                        {wallets[type as "solana" | "ethereum"].map((walletInfo, index) => (
                                            <div
                                                key={index}
                                                className="bg-slate-950 rounded-lg border border-cyan-900 hover:border-cyan-700 transition-all duration-300 p-4 group"
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-cyan-500 text-xs mb-1">Public Address</div>
                                                            <div className="font-mono text-sm break-all text-cyan-100">
                                                                {walletInfo.publicKey}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                onClick={() => fetchBalance(walletInfo.publicKey, type as "solana" | "ethereum", index)}
                                                                className="bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-900 hover:border-cyan-700"
                                                            >
                                                                {walletInfo.balance}
                                                            </Button>
                                                            <Button
                                                                onClick={() => togglePrivateKeyVisibility(type as "solana" | "ethereum", index)}
                                                                className="bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-900 hover:border-cyan-700"
                                                            >
                                                                {walletInfo.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-cyan-500 text-xs mb-1">Private Key</div>
                                                        <div className="font-mono text-sm break-all text-cyan-100">
                                                            {walletInfo.visible ? (
                                                                walletInfo.privateKey
                                                            ) : (
                                                                <span className="text-slate-500">Click the eye icon to reveal</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
};

export default MnemonicGenerator;