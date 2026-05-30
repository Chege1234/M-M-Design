import React from 'react';

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 border border-bronze/40 mb-5">
            <Icon className="w-5 h-5 text-bronze" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-linen">{title}</h1>
          {subtitle && <p className="font-body text-stone text-sm mt-2">{subtitle}</p>}
        </div>
        <div className="bg-panel border border-linen/10 p-8">{children}</div>
        {footer && <p className="text-center font-body text-sm text-stone mt-6">{footer}</p>}
      </div>
    </div>
  );
}
