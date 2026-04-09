'use client';

import { useState } from 'react';
import FaqPageHeader        from '@/components/faq-page-header';
import FaqCategoryTabs      from '@/components/faq-category-tabs';
import FaqAccordionSections from '@/components/faq-accordion-sections';
import FaqStillNeedHelp     from '@/components/faq-still-need-help';
import type { CategoryId }  from '@/components/faq-data';

export default function FaqShell() {
  const [query,     setQuery]     = useState('');
  const [activeTab, setActiveTab] = useState<CategoryId>('all');

  // Switching tabs clears the search so the new tab shows all its items
  function handleTabChange(id: CategoryId) {
    setActiveTab(id);
    setQuery('');
  }

  // Typing resets the tab to "all" so results span every category
  function handleQueryChange(q: string) {
    setQuery(q);
    if (q.trim()) setActiveTab('all');
  }

  return (
    <>
      <FaqPageHeader   query={query}     onChange={handleQueryChange} />
      <FaqCategoryTabs active={activeTab} onChange={handleTabChange}  />
      <FaqAccordionSections activeTab={activeTab} query={query} />
      <FaqStillNeedHelp />
    </>
  );
}
