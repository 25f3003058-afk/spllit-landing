/**
 * Reading API features back as two readable lines.
 *
 * Fixtures are trimmed copies of real responses — including the Arabic commas
 * and the postcodes glued to city names that Mapbox returns for Indian places.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  describeFeature,
  parseSearchBoxFeature,
  type GeocodeFeature,
  type SearchBoxFeature,
} from '../lib/place-feature.ts';

// --- Search Box /forward ----------------------------------------------------

test('builds street, area, city and state into the second line', () => {
  const parsed = parseSearchBoxFeature({
    geometry: { coordinates: [80.21644, 12.99104] },
    properties: {
      mapbox_id: 'dXJuOm1ieHBvaTox',
      name: 'The Souled Store',
      feature_type: 'poi',
      context: {
        street: { name: 'Velachery Main Rd' },
        neighborhood: { name: 'Indira Gandhi Nagar' },
        place: { name: 'Chennai' },
        region: { name: 'Tamil Nadu' },
      },
    },
  });
  assert.equal(parsed?.name, 'The Souled Store');
  assert.equal(parsed?.address, 'Velachery Main Rd, Indira Gandhi Nagar, Chennai');
  assert.deepEqual(parsed?.center, [80.21644, 12.99104]);
  assert.equal(parsed?.featureType, 'poi');
});

test('a street whose name is a whole formatted address is cut back to the street', () => {
  // Measured: this is exactly what "Sardar Patel Road Chennai" returns.
  const parsed = parseSearchBoxFeature({
    geometry: { coordinates: [80.22198, 13.01182] },
    properties: {
      mapbox_id: 'street-1',
      name: 'Sardar Patel Road ، 600085 Chennai، India',
      feature_type: 'street',
    },
  });
  assert.equal(parsed?.name, 'Sardar Patel Road');
  // The postcode and the country are dropped rather than rendered as an address.
  assert.equal(parsed?.address, 'Chennai');
});

test('a name that legitimately contains a comma survives', () => {
  const parsed = parseSearchBoxFeature({
    geometry: { coordinates: [83.97, 21.47] },
    properties: {
      mapbox_id: 'poi-2',
      name: 'Zudio - Fortune Tower, Sambalpur',
      feature_type: 'poi',
      context: { place: { name: 'Sambalpur' } },
    },
  });
  assert.equal(parsed?.name, 'Zudio - Fortune Tower, Sambalpur');
});

test('the city is never repeated as its own address', () => {
  const parsed = parseSearchBoxFeature({
    geometry: { coordinates: [80.2427, 13.05051] },
    properties: {
      mapbox_id: 'place-1',
      name: 'Chennai',
      feature_type: 'place',
      context: { place: { name: 'Chennai' }, region: { name: 'Tamil Nadu' } },
    },
  });
  assert.equal(parsed?.name, 'Chennai');
  assert.equal(parsed?.address, 'Tamil Nadu');
});

test('falls back to the formatted string when there is no structured context', () => {
  const parsed = parseSearchBoxFeature({
    geometry: { coordinates: [80.21683, 12.99184] },
    properties: {
      mapbox_id: 'poi-3',
      name: 'Phoenix Marketcity',
      feature_type: 'poi',
      place_formatted: 'Chennai, 600088, India',
    },
  });
  assert.equal(parsed?.address, 'Chennai');
});

test('reads coordinates from properties when geometry is absent', () => {
  const parsed = parseSearchBoxFeature({
    properties: {
      mapbox_id: 'poi-4',
      name: 'SAC IIT Madras',
      feature_type: 'poi',
      coordinates: { longitude: 80.23768, latitude: 12.98934 },
    },
  });
  assert.deepEqual(parsed?.center, [80.23768, 12.98934]);
});

test('an unselectable row is dropped rather than offered', () => {
  const noId: SearchBoxFeature = {
    geometry: { coordinates: [80, 13] },
    properties: { name: 'No id' },
  };
  const noCoords: SearchBoxFeature = { properties: { mapbox_id: 'x', name: 'Nowhere' } };
  const noName: SearchBoxFeature = {
    geometry: { coordinates: [80, 13] },
    properties: { mapbox_id: 'y', name: '   ' },
  };
  assert.equal(parseSearchBoxFeature(noId), null);
  assert.equal(parseSearchBoxFeature(noCoords), null);
  assert.equal(parseSearchBoxFeature(noName), null);
});

// --- Geocoding v5 reverse ---------------------------------------------------

test('an address feature carries its house number into the name', () => {
  const feature: GeocodeFeature = {
    id: 'address.1',
    text: 'Bazullah Road',
    address: '14',
    center: [80.2337, 13.0432],
    place_type: ['address'],
    context: [
      { id: 'neighborhood.1', text: 'T Nagar' },
      { id: 'place.1', text: 'Chennai' },
      { id: 'region.1', text: 'Tamil Nadu' },
    ],
  };
  const { name, address } = describeFeature(feature);
  assert.equal(name, '14 Bazullah Road');
  // The street is already in the name, so it is not repeated below it.
  assert.equal(address, 'T Nagar, Chennai, Tamil Nadu');
});

test('a poi adds its street line, and never repeats its own name', () => {
  const { name, address } = describeFeature({
    id: 'poi.1',
    text: 'Fortune Tower',
    place_name: 'Fortune Tower, Ring Road, Chennai, Tamil Nadu 600042, India',
    center: [80.22, 12.99],
    place_type: ['poi'],
    properties: { address: 'Ring Road' },
    context: [
      { id: 'place.1', text: 'Chennai' },
      { id: 'region.1', text: 'Tamil Nadu' },
    ],
  });
  assert.equal(name, 'Fortune Tower');
  assert.equal(address, 'Ring Road, Chennai, Tamil Nadu');
});

test('with no context, the formatted string minus its own name is used', () => {
  const { name, address } = describeFeature({
    id: 'poi.2',
    text: 'Alpha Kitchens',
    place_name: 'Alpha Kitchens، 600113 Chennai، India',
    center: [80.22, 12.99],
    place_type: ['poi'],
  });
  assert.equal(name, 'Alpha Kitchens');
  assert.equal(address, 'Chennai');
});

test('a feature with nothing left to say reports no address rather than a blank', () => {
  const { name, address } = describeFeature({
    id: 'country.1',
    text: 'India',
    place_name: 'India',
    center: [79, 22],
    place_type: ['country'],
  });
  assert.equal(name, 'India');
  assert.equal(address, null);
});
