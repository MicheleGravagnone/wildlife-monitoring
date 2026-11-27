import { useNavigate } from 'react-router';
import { useDetection, useImageUrl, useMe } from '../../api/hooks';
import { isStaffDetection, type AnyDetection } from '../../api/types';
import { CloseButton, Drawer } from '../../components/Drawer';
import { Fields, LoadError, StatusChip } from '../../components/ui';
import { speciesFor } from '../../lib/species';
import { DAY, fmtDateTime, HOUR } from '../../lib/time';
import { labelOf, subLabelOf } from '../bubbles';

export function DetectionDrawer({
  id,
  fromList,
  onClose,
}: {
  id: string;
  fromList?: AnyDetection;
  onClose: () => void;
}) {
  const { data: me } = useMe();
  const fetched = useDetection(fromList ? null : id, me?.id ?? null);
  const d = fromList ?? fetched.data;

  return (
    <Drawer label="Sighting details" onClose={onClose}>
      {d ? (
        <Body d={d} onClose={onClose} />
      ) : fetched.isError ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            padding: 12,
          }}
        >
          <CloseButton onClick={onClose} style={{ alignSelf: 'flex-end' }} />
          <LoadError what="this sighting. It may not exist, or be visible to staff only" />
        </div>
      ) : (
        <div
          className="wm-skeleton"
          style={{ height: 240, borderRadius: '22px 22px 22px 6px' }}
        />
      )}
    </Drawer>
  );
}

function Body({ d, onClose }: { d: AnyDetection; onClose: () => void }) {
  const navigate = useNavigate();
  const sp = speciesFor(d.speciesLabel);
  const staff = isStaffDetection(d);
  const image = useImageUrl(d.id, staff && d.hasImage);
  const captured = Date.parse(d.capturedAt);
  const recent = Date.now() - captured < 6 * HOUR;
  const canLocate = staff && Date.now() - captured < 2 * DAY;

  const photo = staff && image.data ? image.data.url : sp?.photo;
  const isCapture = staff && !!image.data;

  const fields = staff
    ? [
        { k: 'Captured', v: fmtDateTime(d.capturedAt) },
        {
          k: 'Classified',
          v: `+${((Date.parse(d.classifiedAt) - captured) / 1000).toFixed(1)} s`,
        },
        { k: 'Score', v: d.confidence != null ? d.confidence.toFixed(2) : '—' },
        { k: 'Model', v: d.modelVersion },
        { k: 'Park', v: d.parkName },
        { k: 'Deployment', v: d.deploymentName },
        { k: 'Sensor', v: d.deviceId },
        {
          k: 'Location',
          v: `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`,
        },
        { k: 'Time of day', v: d.timeOfDay },
        { k: 'Event ID', v: d.eventId },
        { k: 'Detection ID', v: d.id },
      ]
    : [
        { k: 'Captured', v: fmtDateTime(d.capturedAt) },
        { k: 'Time of day', v: d.timeOfDay },
        { k: 'Near', v: d.parkName },
        { k: 'Detection ID', v: d.id },
      ];

  return (
    <>
      <div
        style={{
          position: 'relative',
          height: 240,
          borderRadius: '22px 22px 22px 6px',
          overflow: 'hidden',
          background: '#1A3024',
          flex: 'none',
        }}
      >
        {photo && (
          <img
            src={photo}
            alt={
              isCapture && staff
                ? `Camera trap capture from ${d.deviceId}`
                : (sp?.alt ?? '')
            }
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: sp?.pos ?? '50% 50%',
            }}
          />
        )}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(0deg, rgba(6,14,10,0.85), rgba(6,14,10,0) 55%)',
          }}
        />
        {staff && (
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: 14,
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--text)',
            }}
          >
            {isCapture
              ? `CAPTURE · ${d.deviceId}`
              : d.hasImage
                ? 'loading capture…'
                : 'no capture stored'}
          </span>
        )}
        <CloseButton
          onClick={onClose}
          style={{ position: 'absolute', right: 12, top: 12 }}
        />
        <span
          style={{
            position: 'absolute',
            left: 18,
            bottom: 14,
            right: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {staff && <StatusChip status={d.classificationStatus} />}
          <span
            style={{
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.05,
              color: 'var(--cream)',
            }}
          >
            {labelOf(d)}
          </span>
          <span
            style={{
              fontStyle: 'italic',
              fontWeight: 300,
              color: 'var(--label)',
            }}
          >
            {subLabelOf(d, true)}
          </span>
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--body)',
        }}
      >
        {sp ? sp.note : 'Kept for researchers; hidden from the public journal.'}
      </p>
      <Fields fields={fields} />
      <span style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--muted)' }}>
        {staff
          ? 'Capture images are fetched as short-lived links and never cached. Coordinates are those of the deployment, not the animal.'
          : 'Reference photo of the species. Capture images, model scores, sensors and exact locations are available to park staff.'}
      </span>
      {canLocate && (
        <button
          type="button"
          onClick={() => navigate(`/live?focus=${d.id}`)}
          style={{
            height: 52,
            borderRadius: 999,
            border: 0,
            background: 'var(--terracotta)',
            color: '#FFFFFF',
            cursor: 'pointer',
            fontWeight: 500,
            flex: 'none',
          }}
        >
          {recent ? 'Show on the live canopy' : 'Replay on the live canopy'}
        </button>
      )}
    </>
  );
}
