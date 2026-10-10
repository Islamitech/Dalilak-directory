import React from 'react';
import { Pressable } from '../../shared/ui';
import type { DirectoryScope } from '../../utils/directoryScope';

export interface DirectoryScopeSwitchProps {
  scope: DirectoryScope;
  onChange: (scope: DirectoryScope) => void;
}

export const DirectoryScopeSwitch: React.FC<DirectoryScopeSwitchProps> = ({ scope, onChange }) => (
  <div className="dl-scope" role="group" aria-label="نطاق الدليل">
    <Pressable
      className="dl-scope-btn"
      aria-pressed={scope === 'hadayek'}
      onClick={() => onChange('hadayek')}
    >
      حدائق الأهرام
    </Pressable>
    <Pressable
      className="dl-scope-btn"
      aria-pressed={scope === 'all'}
      onClick={() => onChange('all')}
    >
      كل المناطق
    </Pressable>
  </div>
);
