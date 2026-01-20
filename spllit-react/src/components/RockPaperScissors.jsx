import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHandRock, FaHandPaper, FaHandScissors } from 'react-icons/fa';

const RockPaperScissors = ({ onGameComplete }) => {
    const [gameState, setGameState] = useState('waiting'); // waiting, shaking, result
    const [userChoice, setUserChoice] = useState(null);
    const [computerChoice, setComputerChoice] = useState(null);
    const [resultMessage, setResultMessage] = useState('');

    const choices = [
        { id: 'rock', icon: <FaHandRock className="text-5xl" />, label: 'Stone' },
        { id: 'paper', icon: <FaHandPaper className="text-5xl" />, label: 'Paper' },
        { id: 'scissors', icon: <FaHandScissors className="text-5xl" />, label: 'Thread' } // Using "Thread" label as requested
    ];

    const handleChoice = (choiceId) => {
        setUserChoice(choiceId);
        setGameState('shaking');

        // Rigged Logic: 90% chance to win
        const winChance = Math.random();
        let compChoice = '';

        if (winChance < 0.9) {
            // User wins
            if (choiceId === 'rock') compChoice = 'scissors';
            else if (choiceId === 'paper') compChoice = 'rock';
            else if (choiceId === 'scissors') compChoice = 'paper';
        } else {
            // User loses or draws (10% chance)
            // For simplicity, let's just make them lose or draw randomly
            const options = ['rock', 'paper', 'scissors'];
            compChoice = options[Math.floor(Math.random() * options.length)];
        }

        setComputerChoice(compChoice);

        setTimeout(() => {
            setGameState('result');
            determineWinner(choiceId, compChoice);
        }, 2000); // 2 seconds shaking animation
    };

    const determineWinner = (user, computer) => {
        if (user === computer) {
            setResultMessage("It's a Draw! Try Again.");
            setTimeout(() => {
                setGameState('waiting');
                setUserChoice(null);
                setComputerChoice(null);
            }, 2000);
        } else if (
            (user === 'rock' && computer === 'scissors') ||
            (user === 'paper' && computer === 'rock') ||
            (user === 'scissors' && computer === 'paper')
        ) {
            setResultMessage("You Won! 80% OFF Unlocked! 🎉");
            setTimeout(() => {
                onGameComplete(true); // true = won
            }, 1500);
        } else {
            setResultMessage("Better Luck Next Time!");
            setTimeout(() => {
                onGameComplete(false); // false = lost
            }, 1500);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto text-center py-6">
            <AnimatePresence mode="wait">
                {gameState === 'waiting' && (
                    <motion.div
                        key="waiting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <h3 className="text-xl font-bold mb-8 text-gray-800">Choose Your Move</h3>
                        <div className="flex justify-center gap-6">
                            {choices.map((choice) => (
                                <motion.button
                                    key={choice.id}
                                    whileHover={{ scale: 1.1, rotate: 10 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleChoice(choice.id)}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-accent-green hover:bg-accent-green/5 transition-all group"
                                >
                                    <div className="text-gray-600 group-hover:text-accent-green transition-colors">
                                        {choice.icon}
                                    </div>
                                    <span className="font-bold text-gray-700 group-hover:text-accent-green">{choice.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {gameState === 'shaking' && (
                    <motion.div
                        key="shaking"
                        className="flex justify-center items-center gap-12 py-10"
                    >
                        {/* User Hand */}
                        <motion.div
                            animate={{ rotate: [0, -20, 0, -20, 0], y: [0, -30, 0, -30, 0] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                            className="text-6xl text-accent-green transform scale-x-[-1]"
                        >
                            <FaHandRock />
                        </motion.div>

                        {/* Computer Hand */}
                        <motion.div
                            animate={{ rotate: [0, 20, 0, 20, 0], y: [0, -30, 0, -30, 0] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                            className="text-6xl text-gray-400"
                        >
                            <FaHandRock />
                        </motion.div>
                    </motion.div>
                )}

                {gameState === 'result' && (
                    <motion.div
                        key="result"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="py-6"
                    >
                        <div className="flex justify-center items-center gap-12 mb-8">
                            <div className="flex flex-col items-center">
                                <span className="text-sm text-gray-500 mb-2">You</span>
                                <div className="text-6xl text-accent-green">
                                    {choices.find(c => c.id === userChoice)?.icon}
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-300">VS</div>
                            <div className="flex flex-col items-center">
                                <span className="text-sm text-gray-500 mb-2">Spllit AI</span>
                                <div className="text-6xl text-red-500">
                                    {choices.find(c => c.id === computerChoice)?.icon}
                                </div>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 animate-bounce">{resultMessage}</h3>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RockPaperScissors;
