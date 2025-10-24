import React, { useState, useEffect } from 'react';
import { ViewHeader } from '../components/ui/ViewHeader';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';
import { GenerateButton } from '../components/ui/GenerateButton';
import { FileQuestionIcon } from '../components/Icons';
import * as GeminiService from '../services';
import { QuestionType } from '../types';
import { useGemini } from '../hooks/useGemini';
import { Slider } from '../components/ui/Slider';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { assessmentQuestionTypes, assessmentDifficultyOptions } from '../constants';

const AssessmentGeneratorView: React.FC = () => {
    const [sourceText, setSourceText] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>(['multiple-choice', 'short-answer']);
    const [difficulty, setDifficulty] = useState('Medium');
    const [showAnswers, setShowAnswers] = useState(false);
    
    const {
        data: quiz, 
        isLoading, 
        execute: generateAssessment,
        setData: setQuiz
    } = useGemini(GeminiService.generateAssessment, undefined, "Failed to generate assessment");

    useEffect(() => {
        setQuiz(null);
    }, [sourceText, numQuestions, selectedQuestionTypes, difficulty, setQuiz]);

    const handleQuestionTypeChange = (type: QuestionType, isChecked: boolean) => {
        setSelectedQuestionTypes(prev => {
            if (isChecked) {
                return [...prev, type];
            } else {
                return prev.filter(t => t !== type);
            }
        });
    };

    const handleGenerate = () => {
        if (!sourceText || selectedQuestionTypes.length === 0) return;
        generateAssessment(sourceText, numQuestions, selectedQuestionTypes, difficulty).catch(() => {});
    };
    
    const handlePrint = () => {
        const printContent = document.getElementById('printable-quiz-area');
        if (printContent) {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write('<html><head><title>Print Quiz</title>');
                newWindow.document.write('<style>body{font-family: sans-serif;} h1, h2, h3 {color: #333;} .question {margin-bottom: 20px;} .options {list-style-type: lower-alpha; padding-left: 20px;} .answer {color: #007bff; font-weight: bold;}</style>');
                newWindow.document.write('</head><body>');
                newWindow.document.write(printContent.innerHTML);
                newWindow.document.write('</body></html>');
                newWindow.document.close();
                newWindow.focus();
                newWindow.print();
            }
        }
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={FileQuestionIcon} title="Assessment Generator" description="Paste text to automatically generate a quiz with various question types." />
            
            <Card>
                <h3 className="text-xl font-bold text-brand-text mb-2">1. Paste Your Content</h3>
                <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste the article, story, or lesson content here..."
                    className="w-full h-48 p-4 bg-brand-primary/50 rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                />
            </Card>

             <Card>
                <h3 className="text-xl font-bold text-brand-text mb-4">2. Configure Your Quiz</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Slider
                        label="Number of Questions"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                        min="1"
                        max="20"
                    />
                    <Select
                        label="Difficulty"
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                        options={assessmentDifficultyOptions}
                    />
                     <div className="md:col-span-2">
                        <label className="block text-brand-subtle mb-2">Question Types</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {assessmentQuestionTypes.map(type => (
                                <Checkbox
                                    key={type.id}
                                    label={type.label}
                                    checked={selectedQuestionTypes.includes(type.id)}
                                    onChange={(e) => handleQuestionTypeChange(type.id, e.target.checked)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <GenerateButton
                onClick={handleGenerate}
                isLoading={isLoading}
                disabled={!sourceText || selectedQuestionTypes.length === 0}
                loadingText="Generating Quiz..."
            >
                Generate Quiz
            </GenerateButton>
            
            {isLoading && <Loader text="Designing your assessment..." />}

            {quiz && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-brand-text">{quiz.title}</h2>
                        <div className="flex items-center space-x-4">
                            <button onClick={handlePrint} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors text-sm">Print</button>
                             <label className="flex items-center cursor-pointer">
                                <span className="mr-2 text-brand-subtle">Show Answers</span>
                                <div className="relative">
                                    <input type="checkbox" checked={showAnswers} onChange={() => setShowAnswers(!showAnswers)} className="sr-only" />
                                    <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${showAnswers ? 'translate-x-full !bg-brand-accent' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div id="printable-quiz-area" className="prose prose-invert max-w-none prose-p:text-brand-text prose-headings:text-brand-text prose-li:text-brand-text space-y-6">
                        {quiz.questions.map((q, index) => (
                            <div key={index} className="question">
                                <h3 className="font-bold">{index + 1}. {q.question}</h3>
                                {q.type === 'multiple-choice' && q.options && (
                                    <ul className="options">
                                        {q.options.map((opt, i) => <li key={i}>{opt}</li>)}
                                    </ul>
                                )}
                                {showAnswers && <p className="answer">Answer: {q.answer}</p>}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default AssessmentGeneratorView;
