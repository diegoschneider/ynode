import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Key, Shield, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  fetchCredentials,
  createCredential,
  deleteCredential,
  type Credential,
} from '../../api/credentialsApi';

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    try {
      const data = await fetchCredentials();
      setCredentials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!type.trim()) {
      setError('Type is required');
      return;
    }
    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }

    setSaving(true);
    try {
      await createCredential(name.trim(), type.trim().toLowerCase(), {
        apiKey: apiKey.trim(),
      });
      setName('');
      setApiKey('');
      setType('');
      setIsCreating(false);
      loadCredentials();
    } catch (err: any) {
      setError(err.message || 'Failed to create credential');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this credential? Workflows using it will fail.'))
      return;
    try {
      await deleteCredential(id);
      setCredentials((creds) => creds.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Credentials</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Store API keys for your integrations
          </p>
        </div>
        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-white text-black hover:bg-zinc-200 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Credential
          </Button>
        )}
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">New Credential</h2>
            <button
              onClick={() => {
                setIsCreating(false);
                setError('');
              }}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Name</Label>
                <Input
                  placeholder="e.g., My OpenRouter Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-800 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Type</Label>
                <Input
                  placeholder="e.g., openrouter, openai, telegram"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="bg-zinc-800 border-white/10"
                />
                <p className="text-[10px] text-zinc-600">
                  Match this with what your nodes expect
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">API Key / Token</Label>
              <Input
                type="password"
                placeholder="sk-... or your secret token"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-zinc-800 border-white/10 font-mono"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-white text-black hover:bg-zinc-200 font-medium"
              >
                {saving ? 'Saving...' : 'Save Credential'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Credentials List */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        )}

        {!loading && credentials.length === 0 && !isCreating && (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
            <Shield className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
            <h3 className="text-white font-medium">No credentials yet</h3>
            <p className="text-zinc-500 text-sm mt-1">
              Add API keys for OpenAI, Telegram, OpenRouter, etc.
            </p>
          </div>
        )}

        {credentials.map((cred) => (
          <div
            key={cred.id}
            className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 rounded-lg hover:border-white/10 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-white/5 text-zinc-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-medium text-white">{cred.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">
                    {cred.type}
                  </span>
                  <span className="text-xs text-zinc-600">
                    Added {new Date(cred.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
              onClick={() => handleDelete(cred.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
