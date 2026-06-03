"use client";
import { useState } from "react";
import { useCartStore } from "@/lib/store";
import { formatNGN } from "@/lib/utils";
import { Calculator, ShoppingCart, Users, Clock } from "lucide-react";
import toast from "react-hot-toast";

type DrinkPref = "beer-heavy" | "wine-heavy" | "spirits-heavy" | "mixed";
type EventType = "party" | "wedding" | "corporate" | "birthday" | "casual";

interface Recommendation {
  category: string;
  emoji: string;
  quantity: number;
  rationale: string;
  estimatedCost: number;
}

function calculate(guests: number, hours: number, pref: DrinkPref, type: EventType): Recommendation[] {
  const drinksPerPersonPerHour = type === "corporate" ? 1.5 : type === "casual" ? 1.5 : 2;
  const total = Math.ceil(guests * hours * drinksPerPersonPerHour);
  const recs: Recommendation[] = [];

  const splits: Record<DrinkPref, [number, number, number]> = {
    "beer-heavy": [0.6, 0.15, 0.25],
    "wine-heavy": [0.15, 0.55, 0.3],
    "spirits-heavy": [0.2, 0.15, 0.65],
    "mixed": [0.35, 0.30, 0.35],
  };

  const [beerShare, wineShare, spiritsShare] = splits[pref];

  recs.push({ category: "Beer & Ciders", emoji: "🍺", quantity: Math.ceil(total * beerShare), rationale: "Include a mix of lager and stout", estimatedCost: Math.ceil(total * beerShare) * 800 });
  recs.push({ category: "Wines", emoji: "🍷", quantity: Math.ceil(total * wineShare / 5), rationale: "Each bottle serves ~5 glasses", estimatedCost: Math.ceil(total * wineShare / 5) * 8000 });
  recs.push({ category: "Spirits", emoji: "🥃", quantity: Math.ceil(total * spiritsShare / 20), rationale: "Each bottle serves ~20 shots/measures", estimatedCost: Math.ceil(total * spiritsShare / 20) * 15000 });
  recs.push({ category: "Non-Alcoholic", emoji: "🧃", quantity: Math.ceil(guests * hours * 0.5), rationale: "Soft drinks & water for drivers and non-drinkers", estimatedCost: Math.ceil(guests * hours * 0.5) * 500 });

  return recs;
}

export default function EventCalculatorPage() {
  const [guests, setGuests] = useState(50);
  const [hours, setHours] = useState(4);
  const [pref, setPref] = useState<DrinkPref>("mixed");
  const [type, setType] = useState<EventType>("party");
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const { addItem } = useCartStore();

  function handleCalculate() {
    if (guests < 1 || hours < 1) { toast.error("Please enter valid values"); return; }
    setResults(calculate(guests, hours, pref, type));
  }

  const totalCost = results?.reduce((s, r) => s + r.estimatedCost, 0) || 0;

  async function handleAddAll() {
    toast.success("Event pack added to cart! Browse products to select specific items.");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calculator size={32} className="text-accent" />
        </div>
        <h1 className="text-3xl font-black text-ink-primary mb-2">Event Drink Calculator</h1>
        <p className="text-ink-secondary">Tell us about your event and we'll recommend the perfect drinks order.</p>
      </div>

      <div className="card p-8 mb-8">
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-2 flex items-center gap-2">
              <Users size={16} /> Number of Guests
            </label>
            <input type="number" value={guests} onChange={(e) => setGuests(Number(e.target.value))} min="1" max="1000" className="input text-lg font-bold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-2 flex items-center gap-2">
              <Clock size={16} /> Duration (hours)
            </label>
            <input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} min="1" max="24" className="input text-lg font-bold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-2">Event Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as EventType)} className="input">
              <option value="party">House Party</option>
              <option value="birthday">Birthday</option>
              <option value="wedding">Wedding</option>
              <option value="corporate">Corporate Event</option>
              <option value="casual">Casual Gathering</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-2">Drinks Preference</label>
            <select value={pref} onChange={(e) => setPref(e.target.value as DrinkPref)} className="input">
              <option value="mixed">Mixed (balanced)</option>
              <option value="beer-heavy">Beer-heavy</option>
              <option value="wine-heavy">Wine-heavy</option>
              <option value="spirits-heavy">Spirits-heavy</option>
            </select>
          </div>
        </div>
        <button onClick={handleCalculate} className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2">
          <Calculator size={20} /> Calculate Drinks
        </button>
      </div>

      {results && (
        <div>
          <h2 className="text-xl font-bold text-ink-primary mb-4">Recommended for {guests} guests over {hours} hours</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {results.map((r) => (
              <div key={r.category} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{r.emoji}</span>
                  <div>
                    <h3 className="font-bold text-ink-primary">{r.category}</h3>
                    <p className="text-2xl font-black text-brand-primary">{r.quantity} <span className="text-sm font-normal text-ink-secondary">{r.category === "Wines" || r.category === "Spirits" ? "bottles" : "units"}</span></p>
                  </div>
                </div>
                <p className="text-sm text-ink-secondary mb-2">{r.rationale}</p>
                <p className="text-sm font-semibold text-accent">Est. {formatNGN(r.estimatedCost)}</p>
              </div>
            ))}
          </div>
          <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-ink-secondary text-sm">Estimated total budget</p>
              <p className="text-3xl font-black text-brand-primary tabular-nums">{formatNGN(totalCost)}</p>
              <p className="text-xs text-ink-muted">Based on average prices. Actual cost may vary.</p>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <a href="/category/beer-ciders" className="btn-secondary flex items-center gap-2 justify-center">
                <ShoppingCart size={18} /> Shop Beer
              </a>
              <a href="/category/spirits" className="btn-primary flex items-center gap-2 justify-center">
                <ShoppingCart size={18} /> Shop Spirits
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
