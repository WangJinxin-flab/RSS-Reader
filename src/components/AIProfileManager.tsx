import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Key, Globe, Cpu, MessageSquare, Save, X, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { AIProfile } from '@/types';
import { useToastStore } from '@/stores/toastStore';

export default function AIProfileManager() {
  const { t } = useTranslation();
  const { aiProfiles, addAIProfile, updateAIProfile, deleteAIProfile } = useSettingsStore();
  const { addToast } = useToastStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const initialProfile: Omit<AIProfile, 'id'> = {
    name: '',
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    prompt: 'You are a helpful assistant that summarizes articles. Please provide a concise summary of the following content.',
  };

  const [formData, setFormData] = useState<Omit<AIProfile, 'id'>>(initialProfile);

  const handleEdit = (profile: AIProfile) => {
    setFormData({
      name: profile.name,
      provider: profile.provider,
      apiKey: profile.apiKey,
      baseUrl: profile.baseUrl,
      model: profile.model,
      prompt: profile.prompt,
    });
    setEditingId(profile.id);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('aiProfileManager.deleteConfirm'))) {
      deleteAIProfile(id);
      addToast({ message: t('aiProfileManager.deleteSuccess'), type: 'success' });
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.apiKey) {
      addToast({ message: t('aiProfileManager.nameAndKeyRequired'), type: 'error' });
      return;
    }

    if (editingId) {
      updateAIProfile(editingId, formData);
      addToast({ message: t('aiProfileManager.saveSuccess'), type: 'success' });
    } else {
      addAIProfile(formData);
      addToast({ message: t('aiProfileManager.saveSuccess'), type: 'success' });
    }
    resetForm();
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialProfile);
    setShowApiKey(false);
  };

  if (isEditing) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            {editingId ? t('aiProfileManager.editProfile') : t('aiProfileManager.newProfile')}
          </h3>
          <button onClick={resetForm} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('aiProfileManager.name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('aiProfileManager.namePlaceholder')}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('aiProfileManager.provider')}
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'openai' | 'anthropic' })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="openai">{t('aiProfileManager.openaiCompat')}</option>
                <option value="anthropic">{t('aiProfileManager.anthropicCompat')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  {t('aiProfileManager.model')}
                </div>
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder={t('aiProfileManager.modelPlaceholder')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('aiProfileManager.apiUrl')}
              </div>
            </label>
            <input
              type="text"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder={t('aiProfileManager.apiUrlPlaceholder')}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                {t('aiProfileManager.apiKey')}
              </div>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder={t('aiProfileManager.apiKeyPlaceholder')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {t('aiProfileManager.systemPrompt')}
              </div>
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('aiProfileManager.promptNote')}
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {t('aiProfileManager.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t('aiProfileManager.save')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-slate-900 dark:text-white">{t('aiProfileManager.profileList')}</h3>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1.5 text-sm bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('aiProfileManager.new')}
        </button>
      </div>

      {aiProfiles.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
          <p>{t('aiProfileManager.noProfiles')}</p>
          <p className="text-sm mt-1">{t('aiProfileManager.noProfilesHint')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {aiProfiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg group hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-colors"
            >
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  {profile.name}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-normal">
                    {profile.provider}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {profile.model} · {new URL(profile.baseUrl).hostname}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(profile)}
                  className="p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
