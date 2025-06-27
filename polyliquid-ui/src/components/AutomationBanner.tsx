'use client';

export default function AutomationBanner() {
  return (
    <div className="mx-4 my-4 animate-slide-up">
      <div className="glass-card rounded-lg overflow-hidden border-l-4 border-green-500">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                 style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              ✅
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Automation Active
                </span>
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-green-500/50 shadow-lg animate-pulse"></div>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Vault is being automatically maintained
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 