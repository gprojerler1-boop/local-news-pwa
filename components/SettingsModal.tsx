
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { X, Plus, Trash2, Save, Globe, MessageCircle, Key } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, isOpen, onClose, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [newItem, setNewItem] = useState({ web: '', tg: '', kw: '' });

  if (!isOpen) return null;

  const handleAdd = (type: 'webSources' | 'telegramSources' | 'keywords', val: string) => {
    if (!val) return;
    setLocalSettings(prev => ({
      ...prev,
      [type]: [...prev[type], val]
    }));
    setNewItem(prev => ({ ...prev, [type === 'webSources' ? 'web' : type === 'telegramSources' ? 'tg' : 'kw']: '' }));
  };

  const handleRemove = (type: 'webSources' | 'telegramSources' | 'keywords', index: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="text-blue-500" /> إعدادات النظام
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Refresh Interval */}
          <div>
            <label className="block text-sm font-semibold mb-2">زمن التحديث التلقائي (دقيقة)</label>
            <input 
              type="range" min="1" max="10" step="1"
              value={localSettings.refreshInterval}
              onChange={(e) => setLocalSettings(p => ({ ...p, refreshInterval: parseInt(e.target.value) }))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1 دقيقة</span>
              <span className="text-blue-400 font-bold">{localSettings.refreshInterval} دقائق</span>
              <span>10 دقائق</span>
            </div>
          </div>

          {/* Web Sources */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Globe size={16} /> مواقع الويب
            </h3>
            <div className="flex gap-2 mb-3">
              <input 
                type="text" placeholder="رابط الموقع..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                value={newItem.web} onChange={e => setNewItem(p => ({ ...p, web: e.target.value }))}
              />
              <button onClick={() => handleAdd('webSources', newItem.web)} className="bg-blue-600 p-2 rounded-lg"><Plus /></button>
            </div>
            <div className="space-y-2">
              {localSettings.webSources.map((s, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg text-xs border border-slate-700">
                  <span className="truncate max-w-[80%]">{s}</span>
                  <button onClick={() => handleRemove('webSources', i)} className="text-red-500"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </section>

          {/* Telegram Channels */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <MessageCircle size={16} /> قنوات تلجرام (Username فقط)
            </h3>
            <div className="flex gap-2 mb-3">
              <input 
                type="text" placeholder="username..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                value={newItem.tg} onChange={e => setNewItem(p => ({ ...p, tg: e.target.value }))}
              />
              <button onClick={() => handleAdd('telegramSources', newItem.tg)} className="bg-blue-600 p-2 rounded-lg"><Plus /></button>
            </div>
            <div className="space-y-2">
              {localSettings.telegramSources.map((s, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg text-xs border border-slate-700">
                  <span>@{s}</span>
                  <button onClick={() => handleRemove('telegramSources', i)} className="text-red-500"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </section>

          {/* Keywords */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Key size={16} /> الكلمات المفتاحية
            </h3>
            <div className="flex gap-2 mb-3">
              <input 
                type="text" placeholder="كلمة مفتاحية..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                value={newItem.kw} onChange={e => setNewItem(p => ({ ...p, kw: e.target.value }))}
              />
              <button onClick={() => handleAdd('keywords', newItem.kw)} className="bg-blue-600 p-2 rounded-lg"><Plus /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localSettings.keywords.map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-blue-900/30 px-3 py-1 rounded-full text-xs border border-blue-800">
                  <span>{s}</span>
                  <button onClick={() => handleRemove('keywords', i)} className="text-red-400 hover:text-red-200"><X size={12} /></button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-800">
          <button 
            onClick={() => onSave(localSettings)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            <Save size={20} /> حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
