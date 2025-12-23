

import React from 'react';
import { NewsItem } from '../types';
import { Trash2, Edit3, Share2, ExternalLink, Clock, MapPin, Hash, Link as LinkIcon } from 'lucide-react';

interface NewsCardProps {
  item: NewsItem;
  onDelete: (id: string) => void;
  onEdit: (item: NewsItem) => void;
  onShare: (item: NewsItem) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ item, onDelete, onEdit, onShare }) => {
  const publishDate = new Date(item.publishTime);
  const formattedTime = publishDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = publishDate.toLocaleDateString('ar-EG');

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg transition-all hover:border-blue-500/50 flex flex-col h-full">
      {/* Visual Proof / Screenshot */}
      <div className="relative group">
        <img 
          src={item.screenshot} 
          alt="Screenshot evidence" 
          className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          مباشر
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded border border-white/20">
              دليل بصري: {item.source}
            </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <span className="text-blue-400 text-xs font-bold flex items-center gap-1">
             <Hash size={14} /> {item.source}
          </span>
          <div className="flex gap-1 text-slate-400 text-[10px] items-center">
            <Clock size={12} />
            <span>{formattedDate} - {formattedTime}</span>
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-white mb-3 leading-tight">
          {item.title}
        </h3>

        <div className="text-slate-300 text-sm mb-4 leading-relaxed line-clamp-4">
          {item.content}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {item.matchedKeywords.map((kw, idx) => (
            <span key={idx} className="bg-blue-900/40 text-blue-300 text-[10px] px-2 py-0.5 rounded-full border border-blue-800 flex items-center gap-1">
              <MapPin size={10} /> {kw}
            </span>
          ))}
        </div>

        {/* Display Grounding Sources required for Search Grounding implementation */}
        {item.groundingSources && item.groundingSources.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <LinkIcon size={10} /> مصادر التحقق (Gemini Grounding)
            </p>
            <div className="flex flex-col gap-1">
              {item.groundingSources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 truncate underline"
                  title={source.title}
                >
                  {source.title || source.uri}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-700 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={() => onDelete(item.id)}
              className="p-2 bg-slate-700 hover:bg-red-900/40 hover:text-red-400 rounded-lg transition-colors"
              title="حذف نهائي"
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={() => onEdit(item)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              title="تعديل"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={() => onShare(item)}
              className="p-2 bg-slate-700 hover:bg-green-900/40 hover:text-green-400 rounded-lg transition-colors"
              title="مشاركة واتساب"
            >
              <Share2 size={18} />
            </button>
          </div>
          
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-400 text-sm hover:underline font-semibold"
          >
            المصدر الأصلي <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;