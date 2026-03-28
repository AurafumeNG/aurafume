'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

const MAX = 200;

export default function DeliveryNotes() {
  const [value, setValue] = useState('');
  const remaining = MAX - value.length;
  const nearLimit = remaining <= 40;

  return (
    <section>
      {/* Heading */}
      <div className="flex items-center gap-2 mb-1.5">
        <MessageSquare size={13} strokeWidth={1.8} className="text-muted-foreground" />
        <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground">
          Delivery Instructions
          <span className="ml-1.5 normal-case tracking-normal text-muted-foreground/60">(optional)</span>
        </h2>
      </div>

      {/* Textarea */}
      <div className={`border transition-colors duration-200 focus-within:border-foreground/50 ${
        nearLimit ? 'border-accent/60' : 'border-border'
      }`}>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value.slice(0, MAX))}
          rows={3}
          placeholder={'e.g. "Call before delivery", "Leave with the gateman", "Ring flat 4B"'}
          aria-label="Delivery instructions"
          className="w-full px-3 py-3 bg-transparent text-[0.84rem] text-foreground placeholder:text-muted-foreground/40 outline-none resize-none"
        />

        {/* Counter row */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <span className="text-[0.58rem] tracking-[0.1em] uppercase text-muted-foreground/50">
            {value.length === 0 ? 'Max 200 characters' : ''}
          </span>
          <span className={`text-[0.6rem] tabular-nums tracking-[0.06em] transition-colors duration-200 ${
            nearLimit ? 'text-accent font-medium' : 'text-muted-foreground/60'
          }`}>
            {value.length}/{MAX}
          </span>
        </div>
      </div>
    </section>
  );
}
