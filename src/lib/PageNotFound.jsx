import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);
  const { isAdmin, isLoadingAuth } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink">
      <div className="max-w-md w-full text-center space-y-6">
        <p className="font-display text-7xl text-linen/20">404</p>
        <h1 className="font-display text-2xl text-linen">Page not found</h1>
        <p className="font-body text-stone text-sm">
          &ldquo;{pageName || 'this page'}&rdquo; does not exist.
        </p>
        {!isLoadingAuth && isAdmin && (
          <p className="font-body text-stone/80 text-xs border border-linen/10 bg-panel p-4">
            Admin: this route has not been added yet.
          </p>
        )}
        <Link
          to="/"
          className="inline-block font-body text-[0.65rem] tracking-[0.25em] uppercase text-bronze hover:text-linen transition-colors"
        >
          ← Back home
        </Link>
      </div>
    </div>
  );
}
