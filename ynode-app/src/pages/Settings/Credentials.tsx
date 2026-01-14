import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Key, Shield } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  fetchCredentials,
  createCredential,
  deleteCredential,
  type Credential,
} from '../../api/credentialsApi';
import { Badge } from '../../components/ui/badge';

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('openai');
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

    try {
      await createCredential(name, type, { apiKey });
      setName('');
      setApiKey('');
      setType('openai');
      setIsCreating(false);
      loadCredentials();
    } catch (err: any) {
      setError(err.message || 'Failed to create credential');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    try {
      await deleteCredential(id);
      setCredentials((creds) => creds.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Credentials
          </h1>
          <p className="text-zinc-400 mt-2">
            Manage API keys and secrets for your workflows
          </p>
        </div>
        <Button
          className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          onClick={() => setIsCreating(!isCreating)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Credential
        </Button>
      </div>

      {isCreating && (
        <Card className="border-white/10 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Add Credential</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="My OpenAI Key"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key / Secret</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  type="submit"
                >
                  Save Credential
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {credentials.map((cred) => (
          <Card
            key={cred.id}
            className="border-white/5 bg-zinc-900/30 hover:border-white/10 transition-colors"
          >
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{cred.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="text-xs border-white/10"
                    >
                      {cred.type}
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      Created {new Date(cred.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                onClick={() => handleDelete(cred.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {!loading && credentials.length === 0 && !isCreating && (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
            <Shield className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white">
              No credentials yet
            </h3>
            <p className="text-zinc-500">
              Add your first API key to start using external services
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
