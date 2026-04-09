/**
 * /settings — edit displayName, digest, manage follows, Restart onboarding, Reset demo data.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { useUser } from '../store/UserStore';
import { useGuestGate } from '../hooks/useGuestGate';
import type { DigestPreference } from '../types/domain';
import { RotateCcw, Trash2 } from 'lucide-react';

const DIGEST_OPTIONS: { value: DigestPreference; label: string }[] = [
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly roundup' },
  { value: 'big_news_only', label: 'Big news only' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { state, updateProfile, unfollow, resetProfile } = useUser();
  const { isGuest, requireAuth } = useGuestGate();
  const [displayName, setDisplayName] = useState(state?.profile?.displayName ?? '');
  const [digest, setDigest] = useState<DigestPreference>(state?.profile?.digestPreference ?? 'weekly');

  const handleSaveProfile = () => {
    requireAuth(() => updateProfile({ displayName, digestPreference: digest }));
  };

  const handleRestartOnboarding = async () => {
    requireAuth(async () => {
      await resetProfile();
      navigate('/onboarding', { replace: true });
    });
  };

  const follows = state?.follows;
  const allFollows = [
    ...(follows?.athletes ?? []).map((e) => ({ ...e, type: 'athlete' as const })),
    ...(follows?.events ?? []).map((e) => ({ ...e, type: 'event' as const })),
    ...(follows?.topics ?? []).map((e) => ({ ...e, type: 'topic' as const })),
    ...(follows?.storylines ?? []).map((e) => ({ ...e, type: 'storyline' as const })),
  ];

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      <Card animate={false} className="mb-8">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-white">Profile</h3>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Digest preference</label>
            <select
              value={digest}
              onChange={(e) => setDigest(e.target.value as DigestPreference)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
            >
              {DIGEST_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {isGuest ? 'Sign in to save' : 'Save'}
          </button>
        </CardContent>
      </Card>

      <Card animate={false} className="mb-8">
        <CardContent className="p-6">
          <h3 className="font-semibold text-white mb-4">Manage follows</h3>
          {allFollows.length === 0 ? (
            <p className="text-slate-500 text-sm">You haven&apos;t followed anything yet. Add some from Explore or onboarding.</p>
          ) : (
            <ul className="space-y-2">
              {allFollows.map((e) => (
                <li key={`${e.type}-${e.id}`} className="flex items-center justify-between gap-2 py-2 border-b border-slate-800 last:border-0">
                  <span className="text-slate-300 truncate">{e.name}</span>
                  <button
                    type="button"
                    onClick={() => requireAuth(() => unfollow(e.type, e.id))}
                    className="text-slate-500 hover:text-red-400 text-sm shrink-0"
                  >
                    Unfollow
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card animate={false} className="mb-8 border-amber-500/20">
        <CardContent className="p-6">
          <h3 className="font-semibold text-white mb-2">Restart onboarding</h3>
          <p className="text-slate-400 text-sm mb-4">
            Clear your profile and go through the onboarding wizard again. Your follows and saved items will be reset.
          </p>
          <button
            type="button"
            onClick={handleRestartOnboarding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Restart onboarding
          </button>
        </CardContent>
      </Card>

      <Card animate={false} className="border-slate-700">
        <CardContent className="p-6">
          <h3 className="font-semibold text-white mb-2">Reset demo data</h3>
          <p className="text-slate-400 text-sm mb-4">
            Clear all local data (profile, follows, saved, seen, streak). Useful for testing.
          </p>
          <button
            type="button"
            onClick={handleRestartOnboarding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/40 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Reset demo data
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
