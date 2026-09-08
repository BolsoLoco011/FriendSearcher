import React from 'react';
import { Sparkles, Laugh, Utensils, CalendarCheck, Users, Dumbbell, ExternalLink, Filter } from 'lucide-react';
import { CategoryCardInfo, CategoryKey } from '../types';

interface Square4KCardsProps {
  categories: CategoryCardInfo[];
  selectedCategory: CategoryKey | 'all';
  onSelectCategory: (key: CategoryKey | 'all') => void;
  onOpenCategoryDetail: (key: CategoryKey) => void;
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Sparkles':
      return <Sparkles className="w-5 h-5" />;
    case 'Laugh':
      return <Laugh className="w-5 h-5" />;
    case 'Utensils':
      return <Utensils className="w-5 h-5" />;
    case 'CalendarCheck':
      return <CalendarCheck className="w-5 h-5" />;
    case 'Users':
      return <Users className="w-5 h-5" />;
    case 'Dumbbell':
      return <Dumbbell className="w-5 h-5" />;
    default:
      return <Sparkles className="w-5 h-5" />;
  }
};

export const Square4KCards: React.FC<Square4KCardsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenCategoryDetail,
}) => {
  return (
    <section className="w-full py-4 sm:py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-bold text-sky-600">
              Ecosistemas de Afinidad
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            <span className="text-xs text-slate-400 font-medium">Resolución 4K Ultra HD</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Los {categories.length} Cuadrados de Conexión
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {selectedCategory !== 'all' && (
            <button
              onClick={() => onSelectCategory('all')}
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 bg-white border border-sky-200 px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              Restablecer filtro (Ver todos)
            </button>
          )}
        </div>
      </div>

      {/* Grid of 6 Square 4K HD Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.key;

          return (
            <div
              key={cat.key}
              id={`square-4k-${cat.key}`}
              onClick={() => onSelectCategory(isSelected ? 'all' : cat.key)}
              className={`group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 select-none bg-white ${
                isSelected
                  ? 'border-2 border-sky-500 shadow-lg shadow-sky-100 ring-4 ring-sky-100 scale-[1.02]'
                  : 'border border-slate-200/90 shadow-2xs hover:border-sky-300 hover:shadow-md'
              }`}
            >
              {/* Background 4K HD Image */}
              <img
                src={cat.image}
                alt={cat.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
              />

              {/* Clean Contrast Gradient Overlay for crystal clear typography */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent group-hover:from-slate-950/90 transition-all" />



              {/* Selection Status Pin */}
              {isSelected && (
                <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold shadow-xs">
                    Filtrando
                  </span>
                </div>
              )}

              {/* Card Bottom Content */}
              <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end z-10 text-white">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color} text-white shadow-xs`}>
                    {getCategoryIcon(cat.iconName)}
                  </div>
                  <span className="text-[11px] font-medium text-slate-200 line-clamp-1">
                    {cat.subtitle}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight tracking-tight drop-shadow-xs group-hover:text-sky-200 transition-colors">
                  {cat.title}
                </h3>

                <p className="text-[10px] sm:text-[11px] text-sky-300 font-medium mt-0.5 line-clamp-1">
                  {cat.countLabel}
                </p>

                {/* Direct Action: Open Detail Explorer */}
                <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-slate-200 font-medium">
                    {isSelected ? 'Click para quitar' : 'Filtrar feed'}
                  </span>
                  <button
                    type="button"
                    title={`Explorar ${cat.title} en detalle`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCategoryDetail(cat.key);
                    }}
                    className="p-1.5 rounded-md bg-white/90 hover:bg-sky-500 text-slate-800 hover:text-white border border-white/40 shadow-xs transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};
