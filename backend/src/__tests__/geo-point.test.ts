/**
 * Writing a meeting point without losing what is already stored.
 *
 * Every case here exists because Prisma replaces a composite field wholesale on
 * MongoDB. The bug this guards against has no symptom at the call site — the
 * update succeeds, the response looks right, and a field is simply gone — so it
 * can only be caught here.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { mergeMeetingPoint, toStoredGeoPoint } from '../services/geoPoint.js';
import { geoPoint } from '../utils/validate.js';

/** A stored point with every field populated, as a fully-described pin would be. */
const STORED = {
  lat: 12.99129,
  lng: 80.218552,
  label: 'Velachery Main Rd',
  address: 'Indira Gandhi Nagar, Chennai',
  featureType: 'street',
  roadDistanceMetres: 12,
  source: 'suggestion',
  accuracyMetres: null,
};

describe('meeting-point update preserves the stored point', () => {
  /** An old client: it knows about lat, lng and label and nothing else. */
  const legacyPatch = { lat: STORED.lat, lng: STORED.lng, label: 'Renamed' };

  it('does not erase address', () => {
    const merged = mergeMeetingPoint(STORED, legacyPatch);
    assert.equal(merged.address, 'Indira Gandhi Nagar, Chennai');
  });

  it('does not erase featureType', () => {
    assert.equal(mergeMeetingPoint(STORED, legacyPatch).featureType, 'street');
  });

  it('does not erase roadDistanceMetres', () => {
    assert.equal(mergeMeetingPoint(STORED, legacyPatch).roadDistanceMetres, 12);
  });

  it('does not erase source', () => {
    assert.equal(mergeMeetingPoint(STORED, legacyPatch).source, 'suggestion');
  });

  it('does not erase accuracyMetres', () => {
    const device = { ...STORED, source: 'device', accuracyMetres: 22 };
    const merged = mergeMeetingPoint(device, { lat: device.lat, lng: device.lng });
    assert.equal(merged.accuracyMetres, 22);
  });

  it('still applies what the request actually sends', () => {
    assert.equal(mergeMeetingPoint(STORED, legacyPatch).label, 'Renamed');
  });
});

describe('meeting-point update does not carry metadata onto a different place', () => {
  /**
   * The other half of the rule, and the reason "preserve everything" would be
   * wrong: these fields describe where the pin *was*.
   */
  const moved = { lat: 13.08236, lng: 80.27553 };

  it('drops the old address rather than misattributing it', () => {
    assert.equal(mergeMeetingPoint(STORED, moved).address, null);
  });

  it('drops the old road distance rather than claiming it for a new coordinate', () => {
    assert.equal(mergeMeetingPoint(STORED, moved).roadDistanceMetres, null);
  });

  it('drops the old feature type and provenance', () => {
    const merged = mergeMeetingPoint(STORED, moved);
    assert.equal(merged.featureType, null);
    assert.equal(merged.source, null);
  });

  it('writes the new coordinate, not the old one', () => {
    const merged = mergeMeetingPoint(STORED, moved);
    assert.equal(merged.lat, 13.08236);
    assert.equal(merged.lng, 80.27553);
  });

  it('takes metadata the request supplies for the new place', () => {
    const merged = mergeMeetingPoint(STORED, {
      ...moved,
      label: 'Chennai Central',
      featureType: 'poi',
      roadDistanceMetres: 8,
      source: 'search',
    });
    assert.equal(merged.label, 'Chennai Central');
    assert.equal(merged.featureType, 'poi');
    assert.equal(merged.roadDistanceMetres, 8);
    assert.equal(merged.source, 'search');
  });

  it('treats a coordinate that survived a six-decimal round trip as unmoved', () => {
    const merged = mergeMeetingPoint(STORED, { lat: 12.991290, lng: 80.218552 });
    assert.equal(merged.address, 'Indira Gandhi Nagar, Chennai');
  });
});

describe('accuracy belongs to a measurement', () => {
  it('is kept for a device point', () => {
    const stored = toStoredGeoPoint({ lat: 13, lng: 80.2, source: 'device', accuracyMetres: 22 });
    assert.equal(stored.accuracyMetres, 22);
    assert.equal(stored.source, 'device');
  });

  it('is cleared when a device point is moved by hand', () => {
    const device = { ...STORED, source: 'device', accuracyMetres: 22 };
    const merged = mergeMeetingPoint(device, {
      lat: 13.0,
      lng: 80.25,
      source: 'manual',
    });
    assert.equal(merged.source, 'manual');
    assert.equal(merged.accuracyMetres, null, 'a pin nobody measured has no measurement error');
  });

  it('is refused for a search or suggestion point even if a client sends one', () => {
    for (const source of ['search', 'manual', 'suggestion']) {
      const stored = toStoredGeoPoint({ lat: 13, lng: 80.2, source, accuracyMetres: 9 });
      assert.equal(stored.accuracyMetres, null, `${source} must not carry an accuracy`);
    }
  });
});

describe('a point with no metadata at all still stores', () => {
  it('normalises absent fields to null rather than undefined', () => {
    const stored = toStoredGeoPoint({ lat: 13, lng: 80.2 });
    assert.deepEqual(stored, {
      lat: 13,
      lng: 80.2,
      label: null,
      address: null,
      featureType: null,
      roadDistanceMetres: null,
      source: null,
      accuracyMetres: null,
    });
  });

  it('merges onto a squad that has no meeting point yet', () => {
    const merged = mergeMeetingPoint(null, { lat: 13, lng: 80.2, label: 'First' });
    assert.equal(merged.label, 'First');
    assert.equal(merged.address, null);
  });

  it('reads an existing document written before the new fields existed', () => {
    // Exactly what MongoDB returns for a pre-migration record.
    const legacy = { lat: 13, lng: 80.2, label: 'Old', address: 'Somewhere' };
    const merged = mergeMeetingPoint(legacy, { lat: 13, lng: 80.2 });
    assert.equal(merged.address, 'Somewhere');
    assert.equal(merged.featureType, null);
    assert.equal(merged.roadDistanceMetres, null);
  });
});

describe('geoPoint validation', () => {
  const base = { lat: 13, lng: 80.2 };

  it('accepts a point with no metadata', () => {
    assert.equal(geoPoint.safeParse(base).success, true);
  });

  it('accepts every allowed source', () => {
    for (const source of ['search', 'manual', 'device', 'suggestion']) {
      assert.equal(geoPoint.safeParse({ ...base, source }).success, true, source);
    }
  });

  it('rejects a source outside the vocabulary', () => {
    assert.equal(geoPoint.safeParse({ ...base, source: 'roadside' }).success, false);
    assert.equal(geoPoint.safeParse({ ...base, source: 'guessed' }).success, false);
  });

  it('rejects a negative road distance', () => {
    assert.equal(geoPoint.safeParse({ ...base, roadDistanceMetres: -5 }).success, false);
    // Zero is legitimate: a pin exactly on the road.
    assert.equal(geoPoint.safeParse({ ...base, roadDistanceMetres: 0 }).success, true);
  });

  it('rejects a non-positive accuracy', () => {
    assert.equal(geoPoint.safeParse({ ...base, accuracyMetres: 0 }).success, false);
    assert.equal(geoPoint.safeParse({ ...base, accuracyMetres: -1 }).success, false);
    assert.equal(geoPoint.safeParse({ ...base, accuracyMetres: 12.5 }).success, true);
  });

  it('keeps featureType open to provider vocabulary, lowercased', () => {
    const parsed = geoPoint.safeParse({ ...base, featureType: 'POI' });
    assert.equal(parsed.success, true);
    if (parsed.success) assert.equal(parsed.data.featureType, 'poi');
    // A type Mapbox has not invented yet must not be rejected.
    assert.equal(geoPoint.safeParse({ ...base, featureType: 'something_new' }).success, true);
  });

  it('never accepts the derived ranking integer as a stored field', () => {
    // `precision` is a view-layer sort key. If it ever reaches the schema it is
    // stripped rather than stored, so a stored row cannot depend on the table.
    const parsed = geoPoint.safeParse({ ...base, precision: 0 });
    assert.equal(parsed.success, true);
    assert.equal('precision' in (parsed.success ? parsed.data : {}), false);
  });
});
