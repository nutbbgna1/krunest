// ส่วนคลังระบบงาน: จัดการตัวกรอง + แสดงการ์ดโปรแกรมเป็นตาราง
import React, { useState } from 'react';
import { ProgramCategory, SOFTWARE_PROGRAMS } from '../../data/programs';
import { PROGRAM_META } from '../../data/programMeta';
import { filterPrograms } from '../../utils/pricing';
import { TierFilter } from '../../types';
import { CatalogToolbar } from './CatalogToolbar';
import { ProgramCard, ProgramCardProps } from './ProgramCard';

type CatalogSectionProps = Pick<ProgramCardProps, 'onInspect' | 'onLaunch' | 'onOrder' | 'onAddToCart'> & {
  unlockedProgramIds: string[];
};

export function CatalogSection({ unlockedProgramIds, ...cardHandlers }: CatalogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProgramCategory>('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState<TierFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPrograms = filterPrograms(SOFTWARE_PROGRAMS, selectedCategory, searchQuery).filter((prog) => {
    if (selectedTierFilter === 'all') return true;
    if (selectedTierFilter === 'unlocked') return unlockedProgramIds.includes(prog.id);
    return PROGRAM_META[prog.id]?.packageTier === selectedTierFilter;
  });

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedTierFilter('all');
    setSearchQuery('');
  };

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <CatalogToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedTierFilter={selectedTierFilter}
        onTierChange={setSelectedTierFilter}
        unlockedCount={unlockedProgramIds.length}
      />

      {filteredPrograms.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border-2 border-slate-300 space-y-3">
          <p className="text-sm font-bold text-slate-800">ไม่พบระบบงานที่ตรงกับคำค้นหา</p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl"
          >
            แสดงระบบงานทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              isUnlocked={unlockedProgramIds.includes(program.id)}
              {...cardHandlers}
            />
          ))}
        </div>
      )}
    </section>
  );
}
