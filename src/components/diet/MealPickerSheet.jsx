import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  MEALS, MEALS_BY_ID, isAllowed, filterByDiet, filterBySlot, searchMeals
} from '../../data/indianMeals';
import Button from '../ui/Button';
import './MealPickerSheet.css';

// Compute recent items by scanning the last N days of logs, across all slots.
// Returns an array of meal objects (library + custom) ordered most-recent first.
function useRecents(days, activeDay, allItemsById, limit = 12) {
  return useMemo(() => {
    const seen = new Set();
    const out = [];
    const keys = Object.keys(days).sort().reverse(); // newest first
    for (const k of keys) {
      const m = days[k]?.meals || {};
      for (const slot of ['D', 'E', 'L', 'M']) {
        const arr = m[slot] || [];
        for (const e of arr) {
          if (seen.has(e.id)) continue;
          seen.add(e.id);
          const lib = allItemsById[e.id];
          // Fall back to the logged entry itself if its id isn't in library anymore
          out.push(lib || { id: e.id, name: e.name, detail: e.detail, kcal: e.kcal, p: e.p, slots: [] });
          if (out.length >= limit) return out;
        }
      }
    }
    return out;
  }, [days, activeDay, allItemsById, limit]);
}

export default function MealPickerSheet({ slot, open, onClose }) {
  const days = useAppStore((s) => s.days);
  const activeDay = useAppStore((s) => s.activeDay);
  const diet = useAppStore((s) => s.profile.diet);
  const mealPrefs = useAppStore((s) => s.mealPrefs);
  const addMealItem = useAppStore((s) => s.addMealItem);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const addCustomMeal = useAppStore((s) => s.addCustomMeal);

  const [tab, setTab] = useState('all'); // 'fav' | 'recent' | 'all'
  const [search, setSearch] = useState('');
  const [strictSlot, setStrictSlot] = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const searchRef = useRef(null);

  // Full library = base + user's custom items
  const allItems = useMemo(() => [...MEALS, ...mealPrefs.customMeals], [mealPrefs.customMeals]);
  const allItemsById = useMemo(() => {
    const o = {};
    for (const m of allItems) o[m.id] = m;
    return o;
  }, [allItems]);

  const recents = useRecents(days, activeDay, allItemsById);

  // Dietary filter applies everywhere.
  const dietFiltered = useMemo(() => filterByDiet(allItems, diet), [allItems, diet]);

  // Source list for the current tab
  const baseList = useMemo(() => {
    if (tab === 'fav') {
      return mealPrefs.favorites
        .map((id) => allItemsById[id])
        .filter(Boolean)
        .filter((m) => isAllowed(m, diet));
    }
    if (tab === 'recent') {
      return recents.filter((m) => isAllowed(m, diet));
    }
    // 'all'
    return filterBySlot(dietFiltered, slot, strictSlot);
  }, [tab, mealPrefs.favorites, allItemsById, diet, recents, dietFiltered, slot, strictSlot]);

  // Text search on whatever list is active
  const list = useMemo(() => searchMeals(baseList, search), [baseList, search]);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTab('all');
      setShowCustom(false);
    }
  }, [open, slot]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const onPick = (item) => {
    addMealItem(slot, item, 1);
    // Light haptic feedback on Android; silent no-op on iOS
    if (navigator.vibrate) navigator.vibrate(8);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="mps-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className="mps-sheet"
          onClick={(e) => e.stopPropagation()}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        >
          <div className="mps-grip" />
          <div className="mps-hdr">
            <div className="mps-hdr-t">ADD TO {slot === 'M' ? 'MORNING' : slot === 'L' ? 'LUNCH' : slot === 'E' ? 'EVENING' : 'DINNER'}</div>
            <button className="mps-close" onClick={onClose} aria-label="Close">×</button>
          </div>

          <div className="mps-search">
            <input
              ref={searchRef}
              className="mps-search-input"
              placeholder="SEARCH… e.g. paneer, roti, whey"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus={false}
            />
          </div>

          <div className="mps-tabs">
            <button className={`mps-tab ${tab === 'fav' ? 'on' : ''}`} onClick={() => setTab('fav')}>
              FAV<span className="mps-tab-n">·{mealPrefs.favorites.length}</span>
            </button>
            <button className={`mps-tab ${tab === 'recent' ? 'on' : ''}`} onClick={() => setTab('recent')}>
              RECENT<span className="mps-tab-n">·{recents.length}</span>
            </button>
            <button className={`mps-tab ${tab === 'all' ? 'on' : ''}`} onClick={() => setTab('all')}>
              ALL
            </button>
            {tab === 'all' && (
              <button
                className={`mps-filter ${strictSlot ? '' : 'off'}`}
                onClick={() => setStrictSlot(!strictSlot)}
                title="Strict-slot filter"
              >
                {strictSlot ? 'SLOT ONLY' : 'ALL SLOTS'}
              </button>
            )}
          </div>

          <div className="mps-list">
            {list.length === 0 ? (
              <div className="mps-empty">
                {tab === 'fav' && 'NO FAVORITES YET · STAR ITEMS TO PIN'}
                {tab === 'recent' && 'NO HISTORY YET'}
                {tab === 'all' && 'NO MATCHES · TRY A DIFFERENT SEARCH'}
              </div>
            ) : list.map((m) => {
              const isFav = mealPrefs.favorites.includes(m.id);
              return (
                <div key={m.id} className="mps-row">
                  <button className="mps-row-body" onClick={() => onPick(m)}>
                    <div className="mps-row-l">
                      <div className="mps-row-t">{m.name}</div>
                      <div className="mps-row-d">{m.detail}{m.custom ? ' · CUSTOM' : ''}</div>
                    </div>
                    <div className="mps-row-r">
                      <div className="mps-row-k">{m.kcal} <span className="mps-row-u">KC</span></div>
                      <div className="mps-row-p">{m.p}g P</div>
                    </div>
                  </button>
                  <button
                    className={`mps-fav ${isFav ? 'on' : ''}`}
                    onClick={() => toggleFavorite(m.id)}
                    aria-label="Toggle favorite"
                    title={isFav ? 'Remove favorite' : 'Add favorite'}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mps-foot">
            {!showCustom ? (
              <Button fullWidth onClick={() => setShowCustom(true)}>+ ADD CUSTOM ITEM</Button>
            ) : (
              <CustomForm
                onCancel={() => setShowCustom(false)}
                onSave={(entry, pinToLibrary) => {
                  if (pinToLibrary) {
                    addCustomMeal(entry);
                  }
                  addMealItem(slot, entry, 1);
                  if (navigator.vibrate) navigator.vibrate(8);
                  setShowCustom(false);
                }}
                slot={slot}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

function CustomForm({ onCancel, onSave, slot }) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [pin, setPin] = useState(false);

  const canSave = name.trim() && +kcal > 0;

  const save = () => {
    if (!canSave) return;
    const entry = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      detail: 'custom',
      kcal: Math.round(+kcal),
      p: Math.round(+p || 0),
      slots: [slot, 'M', 'L', 'E', 'D'].filter((v, i, a) => a.indexOf(v) === i),
      tags: ['veg'],
      custom: true
    };
    onSave(entry, pin);
  };

  return (
    <div className="mps-custom">
      <div className="mps-custom-row">
        <input className="mps-custom-i" placeholder="NAME (e.g. Tandoori roti)" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mps-custom-row mps-custom-row-split">
        <input className="mps-custom-i" type="number" inputMode="numeric" placeholder="KCAL" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        <input className="mps-custom-i" type="number" inputMode="numeric" placeholder="PROTEIN g" value={p} onChange={(e) => setP(e.target.value)} />
      </div>
      <label className="mps-custom-pin">
        <input type="checkbox" checked={pin} onChange={(e) => setPin(e.target.checked)} />
        <span>SAVE TO LIBRARY (reuse later)</span>
      </label>
      <div className="mps-custom-actions">
        <Button onClick={onCancel}>CANCEL</Button>
        <Button tone="primary" onClick={save} disabled={!canSave}>ADD</Button>
      </div>
    </div>
  );
}
