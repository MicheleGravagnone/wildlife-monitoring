import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useMe } from '../api/hooks';
import { IconLock } from '../components/icons';
import { useSignIn } from '../components/SignIn';

export function StaffOnly({
  what,
  next,
  children,
}: {
  what: string;
  next: string;
  children: ReactNode;
}) {
  const { data: me, isPending } = useMe();
  const { openSignIn } = useSignIn();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !me)
      openSignIn(next, () => navigate('/', { replace: true }));
  }, [isPending, me, next, openSignIn, navigate]);

  if (me) return <>{children}</>;
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'grid',
        placeItems: 'center',
        padding: '140px 20px',
      }}
    >
      {!isPending && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            textAlign: 'center',
            maxWidth: 380,
          }}
        >
          <IconLock size={28} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: 22, fontWeight: 500 }}>
            {what} is for park staff.
          </span>
          <button
            type="button"
            onClick={() =>
              openSignIn(next, () => navigate('/', { replace: true }))
            }
            style={{
              height: 46,
              padding: '0 22px',
              borderRadius: 999,
              border: 0,
              background: 'var(--terracotta)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Staff sign in
          </button>
        </div>
      )}
    </div>
  );
}
