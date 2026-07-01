import { useState } from 'react';
import { Code, Search, Tag, Star, Trash2, Copy, Plus, Check } from 'lucide-react';
import { mongoClient } from '../lib/mongodbClient';

const snippetLanguageS = ['JavaScript', 'TypeScript', 'Python', 'CSS', 'HTML', 'SQL', 'JSON', 'Bash'];

export function CodeSnippetManager({ snippets, onDataRefresh }) {
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    snippetLanguage: 'JavaScript',
    tags: '',
  });
  const [copiedId, setCopiedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase());
    const matchesLang = !filterLang || s.snippetLanguage === filterLang;
    return matchesSearch && matchesLang;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await mongoClient.createSnippet({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      isFavorite: false,
    });

    await onDataRefresh();

    setFormData({ title: '', description: '', code: '', snippetLanguage: 'JavaScript', tags: '' });
    setShowForm(false);
  };

  const handleCopy = async (code, id) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleFavorite = async (id, current) => {
    await mongoClient.updateSnippet(id, { isFavorite: !current });
    onDataRefresh();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this snippet?')) {
      await mongoClient.deleteSnippet(id);
      onDataRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Code className="w-5 h-5 text-primary-400" />
            Code Snippets
          </h2>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Snippet
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search snippets..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="input-field w-40"
          >
            <option value="">Languages</option>
            {snippetLanguageS.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-slate-800/30 rounded-lg p-6 mb-6 space-y-4 animate-slide-up">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Snippet name"
                className="input-field"
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">snippet Language</label>
                <select
                  value={formData.snippetLanguage}
                  onChange={(e) => setFormData({ ...formData, snippetLanguage: e.target.value })}
                  className="input-field"
                >
                  {snippetLanguageS.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="react, hooks, utility"
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this code do?"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Code</label>
              <textarea
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Paste your code here..."
                className="input-field font-mono h-40 resize-y"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Save Snippet</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}

        {filteredSnippets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No snippets found. Start building your code library!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSnippets.map(snippet => (
              <div key={snippet._id} className="bg-slate-800/30 rounded-lg overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === snippet._id ? null : snippet._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-200">{snippet.title}</h3>
                        <span className="px-2 py-0.5 text-xs bg-primary-600/30 text-primary-300 rounded">
                          {snippet.snippetLanguage}
                        </span>
                        {snippet.isFavorite && <Star className="w-4 h-4 text-warm-400 fill-warm-400" />}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{snippet.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {snippet.tags?.map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(snippet.code, snippet._id); }}
                        className="p-2 hover:bg-slate-700 rounded transition-colors"
                      >
                        {copiedId === snippet._id ? (
                          <Check className="w-4 h-4 text-accent-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(snippet._id, snippet.isFavorite); }}
                        className="p-2 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Star className={`w-4 h-4 ${snippet.isFavorite ? 'text-warm-400 fill-warm-400' : 'text-slate-400'}`} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(snippet._id); }}
                        className="p-2 hover:bg-red-900/50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
                {expandedId === snippet._id && (
                  <div className="border-t border-slate-700/50 p-4 bg-slate-900/50 animate-slide-down">
                    <pre className="code-block text-slate-300 overflow-x-auto">{snippet.code}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}