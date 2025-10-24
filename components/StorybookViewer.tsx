import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, BookmarkIcon } from './Icons';
import * as GeminiService from '../services';

interface StorybookViewerProps {
    pages: { text: string; imageUrl: string }[];
    contentId?: string;
    initialPageIndex?: number;
}

export const StorybookViewer: React.FC<StorybookViewerProps> = ({ pages, contentId, initialPageIndex = 0 }) => {
    const [page, setPage] = useState(initialPageIndex);
    const [bookmarkedPageIndex, setBookmarkedPageIndex] = useState(initialPageIndex);
    
    const totalPages = pages.length;
    if (totalPages === 0) return null;

    const isCover = page === 0;
    const isLastPageSingle = (totalPages > 1) && ((totalPages - 1) % 2 !== 0);
    const isViewingLastPage = page === totalPages - 1;
    const isSinglePageView = isCover || (isLastPageSingle && isViewingLastPage);
    
    const goToNext = () => setPage(p => p === 0 ? 1 : Math.min(p + 2, totalPages - 1));
    const goToPrev = () => setPage(p => p === 1 ? 0 : Math.max(p - 2, 0));

    const canGoNext = page === 0 ? totalPages > 1 : page + 2 < totalPages;
    const canGoPrev = page > 0;

    const handleToggleBookmark = () => {
        if (!contentId) return;
        const newBookmarkIndex = page === bookmarkedPageIndex ? 0 : page;
        if (GeminiService.saveBookmark(contentId, newBookmarkIndex)) {
            setBookmarkedPageIndex(newBookmarkIndex);
        }
    };
    
    const isBookmarked = bookmarkedPageIndex === page;

    const PageDisplay = ({ pageData, pageNumber, isCoverPage }: { pageData: { text: string, imageUrl: string }, pageNumber: number | null, isCoverPage: boolean }) => (
        <div className={`flex flex-col h-full ${isCoverPage ? 'justify-center items-center text-center' : ''}`}>
            {pageData.imageUrl && 
              <img src={pageData.imageUrl} alt="" 
                className={`w-full object-cover rounded-md bg-slate-200 ${isCoverPage ? 'h-3/5' : 'h-3/5'} mb-4`} 
              />
            }
            <div className={`overflow-y-auto flex-grow ${isCoverPage ? 'flex flex-col justify-center' : ''}`}>
                <p className={`whitespace-pre-wrap ${isCoverPage ? 'text-2xl font-bold' : 'text-xl'}`}>{pageData.text}</p>
            </div>
            {pageNumber && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-slate-500">{pageNumber}</div>}
        </div>
    );
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-center font-serif relative p-4">
             <style>{`
                .book-viewport {
                    width: 100%;
                    max-width: 1200px;
                    aspect-ratio: 2 / 1.3;
                    max-height: 90vh;
                    position: relative;
                }
                .book-layout {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .book-page {
                    height: 100%;
                    background-color: #fdfaf4;
                    color: #333;
                    padding: 2rem;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .book-page.single {
                    width: 50%;
                    border-radius: 8px;
                }
                .book-spread {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
                }
                .book-page.left {
                    width: 50%;
                    border-top-left-radius: 8px;
                    border-bottom-left-radius: 8px;
                    box-shadow: inset 3px 0px 8px -3px rgba(0,0,0,0.2);
                }
                .book-page.right {
                    width: 50%;
                    border-top-right-radius: 8px;
                    border-bottom-right-radius: 8px;
                    box-shadow: inset -3px 0px 8px -3px rgba(0,0,0,0.2);
                }
                .book-spine {
                    width: 12px;
                    height: 100%;
                    background: linear-gradient(to right, #00000020, #00000000 30%, #00000000 70%, #00000020);
                    flex-shrink: 0;
                }
            `}</style>
            
            <div className="book-viewport">
                <div className="book-layout">
                    {isSinglePageView ? (
                        <div className="book-page single">
                            <PageDisplay pageData={pages[page]} pageNumber={null} isCoverPage={isCover} />
                        </div>
                    ) : (
                        <div className="book-spread">
                             <div className="book-page left">
                                <PageDisplay pageData={pages[page]} pageNumber={page} isCoverPage={false} />
                            </div>
                            <div className="book-spine"></div>
                             <div className="book-page right">
                                {pages[page+1] && <PageDisplay pageData={pages[page+1]} pageNumber={page+1} isCoverPage={false} />}
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={goToPrev} disabled={!canGoPrev} className="absolute left-[-20px] top-1/2 -translate-y-1/2 p-2 bg-brand-accent/80 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent transition-all shadow-lg z-10" aria-label="Previous page">
                    <ChevronLeftIcon className="h-8 w-8"/>
                </button>
                 <button onClick={goToNext} disabled={!canGoNext} className="absolute right-[-20px] top-1/2 -translate-y-1/2 p-2 bg-brand-accent/80 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent transition-all shadow-lg z-10" aria-label="Next page">
                    <ChevronRightIcon className="h-8 w-8"/>
                </button>
            </div>
            
             <div className="w-full max-w-[1000px] mt-4 flex items-center justify-center space-x-4">
                 <span className="text-brand-subtle text-sm font-sans">
                  {isCover ? 'Cover' : (isSinglePageView ? `Page ${page}`: `Pages ${page}-${page+1}`)}
                </span>
                {contentId && (
                   <button onClick={handleToggleBookmark} className="p-2 text-brand-subtle hover:text-brand-accent transition-colors" title="Bookmark this page" aria-label="Bookmark this page">
                      <BookmarkIcon className={`w-6 h-6 ${isBookmarked ? 'fill-brand-accent text-brand-accent' : ''}`} />
                   </button>
                )}
            </div>
        </div>
    );
};
