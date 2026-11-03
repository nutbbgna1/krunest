// ช่องค้นหา + ปุ่มกรองหมวดหมู่/แพ็กเกจ (ข้อมูลปุ่มอยู่ที่ data/catalogFilters.ts)
import React from 'react';
import { Search } from 'lucide-react';
import { ProgramCategory } from '../../data/programs';
import { CATEGORY_TABS, TIER_FILTERS } from '../../data/catalogFilters';
import { TierFilter } from '../../types';

interface CatalogToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: ProgramCategory;
  onCategoryChange: (category: ProgramCategory) => void;
  selectedTierFilter: TierFilter;
  onTierChange: (tier: TierFilter) => void;
  unlockedCount: number;
}

export function CatalogToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTierFilter,
  onTierChange,
  unlockedCount,
}: CatalogToolbarProps) {
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
        <div>
          <div className="inline-block text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-md mb-2">
            SYSTEM REPOSITORY · คลังระบบงานทั้งหมด
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            เลือกระบบงานที่ต้องการใช้งาน
          </h2>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อระบบงาน เช่น สต็อก, ขายหน้าร้าน..."
            aria-label="ค้นหาโปรแกรม"
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
          />
        </div>
      </div>

      {/* Filter Row: Package Tiers & Categories */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-slate-300">
        {/* Left: Category Filter */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="หมวดหมู่ระบบงาน"
        >
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onCategoryChange(tab.id)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-102'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right: Package / Ownership Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {TIER_FILTERS.map((tier) => {
            const active = selectedTierFilter === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => onTierChange(tier.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white/80 text-slate-700 border border-slate-200 hover:bg-white'
                }`}
              >
                {tier.id === 'unlocked' ? `${tier.label} (${unlockedCount})` : tier.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
