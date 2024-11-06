import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Settings, Github } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="sticky top-0 z-50">
            <div className="backdrop-blur-md bg-transparent border-b border-gray-200/20 supports-[backdrop-filter]:bg-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo and Brand */}
                        <div className="flex items-center space-x-3">
                            <Wallet className="w-8 h-8 text-cyan-400" />
                            <div className="flex flex-col">
                                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                                    COIN STASH
                                </span>
                                <span className="text-xs text-cyan-300">
                                    Secure Web Wallet 
                                </span>
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-cyan-800/20 text-cyan-400 hover:text-cyan-200"
                            >
                                <Settings className="h-5 w-5" />
                            </Button>
                            <a
                                href="https://github.com/deevee47/minimalistic-web-wallet"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-cyan-800/20 text-cyan-400 hover:text-cyan-200"
                                >
                                    <Github className="h-5 w-5" />
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
