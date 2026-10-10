import React from 'react';
import { formatCount } from '../../shared/lib/format';
import { getCategoryGroupById, getSubcategoryById } from '../../shared/data/categoryTaxonomy';
import type { DirectoryScope } from '../../utils/directoryScope';
import { DirectoryScopeSwitch } from './DirectoryScopeSwitch';

export interface ActivityListHeaderProps {
  shown: number;
  total: number;
  filtered: boolean;
  loading?: boolean;
  categoryId?: string;
  subcategoryId?: string;
  zone?: string;
  scope?: DirectoryScope;
  onScopeChange?: (scope: DirectoryScope) => void;
}

function activityNoun(count: number): string {
  if (count === 1) return 'نشاط';
  if (count === 2) return 'نشاطان';
  if (count >= 3 && count <= 10) return 'أنشطة';
  return 'نشاطاً';
}

function scopeLabel(categoryId?: string, subcategoryId?: string, zone?: string): string {
  const sub = subcategoryId && subcategoryId !== 'all' ? getSubcategoryById(subcategoryId) : undefined;
  const group = categoryId && categoryId !== 'all' ? getCategoryGroupById(categoryId) : undefined;
  const place = zone && zone !== 'all' ? `منطقة ${zone}` : '';
  return [sub?.label || group?.word || '', place].filter(Boolean).join(' · ');
}

export const ActivityListHeader: React.FC<ActivityListHeaderProps> = ({
  shown,
  total,
  filtered,
  loading = false,
  categoryId,
  subcategoryId,
  zone,
  scope = 'hadayek',
  onScopeChange,
}) => {
  const place = scopeLabel(categoryId, subcategoryId, scope === 'hadayek' ? zone : 'all');
  const count = loading && shown === 0 ? null : `${formatCount(shown)} ${activityNoun(shown)}`;
  const headline = count && place ? `${count} في ${place}` : count;
  const showDirectoryTotal = filtered && total > 0 && shown !== total;
  const hadayek = scope === 'hadayek';

  return (
    <header className="dl-list-intro">
      <div className="dl-list-scope">
        <p className="dl-list-kicker">{hadayek ? 'دليلك · حدائق الأهرام' : 'دليلك'}</p>
        {onScopeChange && <DirectoryScopeSwitch scope={scope} onChange={onScopeChange} />}
      </div>
      <h1 className="dl-list-title">{hadayek ? 'أنشطة موثّقة في حيّك' : 'أنشطة موثّقة'}</h1>
      <p className="dl-list-lead">
        {hadayek
          ? 'تصفّح المحلات والخدمات، ثم تواصل مباشرة.'
          : 'تصفّح المحلات والخدمات في كل المناطق، ثم تواصل مباشرة.'}
      </p>
      <p className="dl-list-count">
        <b>{headline || 'جارٍ تحميل الأنشطة'}</b>
        {showDirectoryTotal && <span>من {formatCount(total)} في الدليل</span>}
      </p>
    </header>
  );
};
