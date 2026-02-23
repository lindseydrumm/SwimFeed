// web/src/pages/OnboardingPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ATHLETES, INTERESTS } from "../data/onboardingOptions";
import { SelectableTile } from "../components/SelectableTile";

type OnboardingState = {
  athletes: string[];
  interests: string[];
  completedAt: string;
};

const STORAGE_KEY = "swimlive_onboarding_v1";

function saveOnboarding(state: OnboardingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function hasCompletedOnboarding(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return Array.isArray(parsed.athletes) && Array.isArray(parsed.interests);
  } catch {
    return false;
  }
}

export default function OnboardingPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [athletes, setAthletes] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const canContinue = useMemo(() => {
    if (step === 1) return true; // allow skipping selection
    if (step === 2) return true; // allow skipping selection
    return true;
  }, [step]);

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const finish = () => {
    saveOnboarding({
      athletes,
      interests,
      completedAt: new Date().toISOString(),
    });
    nav("/", { replace: true });
  };

  const skipAll = () => {
    saveOnboarding({
      athletes: [],
      interests: [],
      completedAt: new Date().toISOString(),
    });
    nav("/", { replace: true });
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Set up your Swim Live feed</h1>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            Under 1 minute. Pick a few things you recognize — or skip.
          </p>
        </div>
        <button
          type="button"
          onClick={skipAll}
          style={{
            height: 40,
            padding: "0 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Skip
        </button>
      </div>

      <Progress step={step} />

      {step === 1 && (
        <>
          <h2 style={{ marginTop: 18 }}>1) Tap athletes you recognize</h2>
          <p style={{ marginTop: 6, opacity: 0.75 }}>
            This prioritizes their races and news in your feed.
          </p>

          <Grid>
            {ATHLETES.map((a) => (
              <SelectableTile
                key={a.id}
                title={a.name}
                subtitle={a.country ? `Country: ${a.country}` : undefined}
                selected={athletes.includes(a.id)}
                onClick={() => setAthletes((prev) => toggle(prev, a.id))}
              />
            ))}
          </Grid>

          <Footer
            leftText={`${athletes.length} selected`}
            onBack={undefined}
            onNext={() => setStep(2)}
            canNext={canContinue}
            nextLabel="Continue"
          />
        </>
      )}

      {step === 2 && (
        <>
          <h2 style={{ marginTop: 18 }}>2) Pick events / strokes you care about</h2>
          <p style={{ marginTop: 6, opacity: 0.75 }}>
            This affects reminders, storylines, and how events are framed.
          </p>

          <Grid>
            {INTERESTS.map((i) => (
              <SelectableTile
                key={i.id}
                title={i.label}
                selected={interests.includes(i.id)}
                onClick={() => setInterests((prev) => toggle(prev, i.id))}
              />
            ))}
          </Grid>

          <Footer
            leftText={`${interests.length} selected`}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            canNext={canContinue}
            nextLabel="Continue"
          />
        </>
      )}

      {step === 3 && (
        <>
          <h2 style={{ marginTop: 18 }}>3) Done — here’s what “Follow” means</h2>
          <ul style={{ lineHeight: 1.7, opacity: 0.9 }}>
            <li><b>Follow an athlete</b> → their races/news rank higher</li>
            <li><b>Follow an event</b> → reminders + related recaps surface</li>
            <li><b>Follow a storyline</b> → records/rivalries stay connected over time</li>
          </ul>

          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 12,
              border: "1px solid #eee",
              background: "#fafafa",
            }}
          >
            <div style={{ fontWeight: 700 }}>Your selections</div>
            <div style={{ marginTop: 8, opacity: 0.85 }}>
              Athletes: {athletes.length ? athletes.join(", ") : "None (skipped)"}
              <br />
              Interests: {interests.length ? interests.join(", ") : "None (skipped)"}
            </div>
          </div>

          <Footer
            leftText="You can change this later"
            onBack={() => setStep(2)}
            onNext={finish}
            canNext={true}
            nextLabel="Finish"
          />
        </>
      )}
    </div>
  );
}

function Progress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          style={{
            height: 6,
            flex: 1,
            borderRadius: 999,
            background: n <= step ? "#111" : "#e8e8e8",
          }}
        />
      ))}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
        marginTop: 12,
      }}
    >
      {children}
    </div>
  );
}

function Footer({
  leftText,
  onBack,
  onNext,
  canNext,
  nextLabel,
}: {
  leftText: string;
  onBack?: (() => void) | undefined;
  onNext: () => void;
  canNext: boolean;
  nextLabel: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 18,
        paddingTop: 12,
        borderTop: "1px solid #eee",
      }}
    >
      <div style={{ opacity: 0.75 }}>{leftText}</div>
      <div style={{ display: "flex", gap: 10 }}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            style={{
              height: 40,
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          style={{
            height: 40,
            padding: "0 14px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
            opacity: canNext ? 1 : 0.5,
          }}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}