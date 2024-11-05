"use client";
import { generateMnemonic, mnemonicToSeed } from "bip39";
import React, { useEffect, useState } from "react";
import copy from "clipboard-copy";
import { toast, Toaster } from "sonner";
import { Wallet, HDNodeWallet, encodeBase58 } from "ethers";
import { Clipboard, Eye, EyeOff, Plus } from "lucide-react";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios"
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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setMnemonics(generateMnemonic());
        }
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

    const fetchBalance = async (publicKey: string, type : "solana" | "ethereum", index : number) => {
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
        <div className="flex flex-col items-center p-6">
            <Button className="py-4 px-8 mb-6" onClick={() => setMnemonics(generateMnemonic())}>
                Generate Mnemonics
            </Button>
            <Toaster position="top-right" />
            {mnemonics && (
                <div
                    onClick={handleCopyClick}
                    className="bg-gray-800 p-4 rounded-md shadow-md grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl w-full"
                >
                    {mnemonics.split(" ").map((word, index) => (
                        <Button
                            key={index}
                            className="px-2 py-3 bg-gray-800 border-2 border-gray-700 hover:bg-gray-700 text-center rounded text-sm font-medium text-gray-200"
                        >
                            {word}
                        </Button>
                    ))}
                    <div className="col-span-full flex items-center justify-center text-gray-400 text-sm">
                        <Clipboard className="mr-2" /> Click anywhere to copy!
                    </div>
                </div>
            )}
            <Tabs defaultValue="solana" className="w-full">
                <TabsList className="grid w-[50%] mx-auto my-4 grid-cols-2">
                    <TabsTrigger value="solana">Solana</TabsTrigger>
                    <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
                </TabsList>
                {["solana", "ethereum"].map((type) => (
                    <TabsContent value={type} key={type}>
                        <Card className="w-full">
                            <CardHeader className="flex justify-between flex-row items-center">
                                <CardTitle className="text-2xl">{type.charAt(0).toUpperCase() + type.slice(1)} Wallets</CardTitle>
                                
                                <Button variant="outline" className="mb-4 min-w-28 " onClick={() => generateWallet(type as "solana" | "ethereum")}>
                                     <Plus /> Add wallet
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {wallets[type as "solana" | "ethereum"].map((walletInfo, index) => (
                                    <Card key={index} className="mb-4">
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <div className="">
                                                    <div className="font-bold text-lg">
                                                        Wallet Address
                                                    </div>
                                                    <div className="italic"> {walletInfo.publicKey} </div></div>
                                                
                                                <Button
                                                    variant="outline"
                                                    onClick={() => fetchBalance(walletInfo.publicKey, type as "solana" | "ethereum", index)}
                                                > {walletInfo.balance} </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => togglePrivateKeyVisibility(type as "solana" | "ethereum", index)}
                                                >
                                                    {walletInfo.visible ? <EyeOff /> : <Eye />}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="font-bold text-lg">
                                                Private Key
                                            </div>
                                            <div className="italic"> {walletInfo.visible ? walletInfo.privateKey : "Click the eye to reveal"} </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default MnemonicGenerator;
