import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fitToCorridor, scoreFit, DEFAULT_CORRIDOR } from '../services/corridor.js';
import {
  ARRIVAL_RADIUS_METRES,
  capabilitiesFor,
  generateJoinCode,
  SQUAD_ROLES,
} from '../services/squads.js';
import { formatPlate, isValidPlate, normalisePlate, findModel } from '../data/vehicles.js';
import { squadPostDenial } from '../services/threads.js';
import { calculateDistance, calculateDistanceMetres } from '../utils/helpers.js';

/**
 * Unit tests for the pure logic — the parts where a wrong answer is silent.
 *
 * Uses node:test, which ships with Node, rather than adding a runner. These
 * touch no database and no network, so they run anywhere the repo does.
 */

const METRES_PER_DEGREE_LAT = 111_320;

describe('corridor matching', () => {
  // A ~11 km due-east route at constant latitude, so offsets are exact.
  const host = [
    { lat: 13.0, lng: 80.2 },
    { lat: 13.0, lng: 80.3 },
  ];
  const offsetNorth = (metres: number, lng: number) => ({
    lat: 13.0 + metres / METRES_PER_DEGREE_LAT,
    lng,
  });

  it('matches a rider 1 km off the route travelling the same way', () => {
    const fit = fitToCorridor(host, offsetNorth(1000, 80.22), offsetNorth(1000, 80.28));
    assert.ok(fit);
    assert.equal(scoreFit(fit).matches, true);
  });

  it('rejects a rider beyond the buffer', () => {
    const fit = fitToCorridor(host, offsetNorth(2500, 80.22), offsetNorth(2500, 80.28));
    assert.ok(fit);
    assert.equal(scoreFit(fit).matches, false);
  });

  it('rejects a rider going the opposite way down the same corridor', () => {
    // Proximity alone would rank this a perfect match; only the ordering check
    // catches it.
    const fit = fitToCorridor(host, { lat: 13.0, lng: 80.28 }, { lat: 13.0, lng: 80.22 });
    assert.ok(fit);
    assert.equal(scoreFit(fit).matches, false);
    assert.ok(scoreFit(fit).sharedMetres < 0);
  });

  it('rejects a pickup and drop-off that barely differ', () => {
    const fit = fitToCorridor(host, { lat: 13.0, lng: 80.25 }, { lat: 13.0, lng: 80.2502 });
    assert.ok(fit);
    assert.ok(scoreFit(fit).sharedMetres < DEFAULT_CORRIDOR.minSharedMetres);
    assert.equal(scoreFit(fit).matches, false);
  });

  it('projects distance accurately', () => {
    const fit = fitToCorridor(host, offsetNorth(1000, 80.25), offsetNorth(1000, 80.28));
    assert.ok(fit);
    assert.ok(Math.abs(fit.pickupDetourMetres - 1000) < 5);
  });

  it('returns null for a path with no direction', () => {
    assert.equal(fitToCorridor([{ lat: 13, lng: 80 }], host[0]!, host[1]!), null);
  });
});

describe('distance units', () => {
  it('calculateDistance is kilometres and the metres helper agrees', () => {
    // The bug this guards: three call sites treated the km result as metres,
    // which silently disabled a radius filter and mislabelled UI distances.
    const km = calculateDistance(13.0, 80.2, 13.0, 80.3);
    const metres = calculateDistanceMetres(13.0, 80.2, 13.0, 80.3);
    assert.ok(km > 10 && km < 12, `expected ~11 km, got ${km}`);
    assert.equal(Math.round(metres), Math.round(km * 1000));
  });
});

describe('squad permissions', () => {
  it('gives the leader every capability', () => {
    const can = capabilitiesFor('leader');
    assert.ok(Object.values(can).every(Boolean));
  });

  it('lets a co-leader run the squad but not end it or reassign roles', () => {
    const can = capabilitiesFor('co-leader');
    assert.equal(can.setMeetingPoint, true);
    assert.equal(can.admitMembers, true);
    assert.equal(can.destroy, false);
    assert.equal(can.assignRoles, false);
  });

  it('limits a member to taking part', () => {
    const can = capabilitiesFor('member');
    assert.equal(can.chat, true);
    assert.equal(can.shareLocation, true);
    assert.equal(can.setMeetingPoint, false);
    assert.equal(can.manageMembers, false);
  });

  it('limits a guest to viewing and navigating', () => {
    const can = capabilitiesFor('guest');
    assert.equal(can.view, true);
    assert.equal(can.shareLocation, true);
    assert.equal(can.chat, false);
    assert.equal(can.admitMembers, false);
  });

  it('never grants destroy below leader', () => {
    for (const role of SQUAD_ROLES.filter((r) => r !== 'leader')) {
      assert.equal(capabilitiesFor(role).destroy, false, `${role} must not destroy`);
    }
  });
});

describe('join codes', () => {
  it('drops one side of every confusable pair', () => {
    // Only one of each pair may survive — O/0, I/1, S/5. Keeping 5 while
    // dropping S is correct; keeping both would not be.
    for (let i = 0; i < 500; i += 1) {
      const code = generateJoinCode();
      assert.equal(code.length, 6);
      assert.match(code, /^[A-Z0-9]{6}$/);
      assert.doesNotMatch(code, /[O0I1S]/, `ambiguous character in ${code}`);
    }
  });

  it('spreads across the alphabet rather than repeating one symbol', () => {
    // A constant or near-constant generator would still satisfy the format
    // assertions above while making collisions certain.
    const seen = new Set<string>();
    for (let i = 0; i < 300; i += 1) {
      for (const char of generateJoinCode()) seen.add(char);
    }
    assert.ok(seen.size > 25, `only ${seen.size} distinct characters generated`);
  });
});

describe('arrival radius', () => {
  it('is tight enough to mean "at the meeting point"', () => {
    assert.ok(ARRIVAL_RADIUS_METRES > 0 && ARRIVAL_RADIUS_METRES <= 50);
  });
});

describe('registration plates', () => {
  it('accepts both live Indian formats however they are typed', () => {
    for (const raw of ['TN07CV1234', 'tn 07 cv 1234', 'TN-07-CV-1234', 'MH12AB1234']) {
      assert.equal(isValidPlate(normalisePlate(raw)), true, raw);
    }
    assert.equal(isValidPlate(normalisePlate('22 BH 1234 AA')), true);
  });

  it('normalises separators away so one plate is one row', () => {
    assert.equal(normalisePlate('tn 07 cv 1234'), 'TN07CV1234');
    assert.equal(normalisePlate('TN-07-CV-1234'), 'TN07CV1234');
  });

  it('rejects malformed marks', () => {
    for (const raw of ['', 'ABC', '1234567890', 'T1N07CV', 'TN07CV12345']) {
      assert.equal(isValidPlate(normalisePlate(raw)), false, raw);
    }
  });

  it('formats back into readable groups', () => {
    assert.equal(formatPlate('TN07CV1234'), 'TN 07 CV 1234');
    assert.equal(formatPlate('22BH1234AA'), '22 BH 1234 AA');
  });
});

describe('vehicle catalogue', () => {
  it('resolves real brand/model pairs and rejects invented ones', () => {
    assert.ok(findModel('maruti-suzuki', 'ertiga'));
    assert.equal(findModel('maruti-suzuki', 'not-a-model'), null);
    assert.equal(findModel('not-a-brand', 'ertiga'), null);
  });

  it('caps seats at what the model actually has', () => {
    // The guard against a host advertising six seats in a hatchback.
    assert.equal(findModel('maruti-suzuki', 'ertiga')?.seats, 6);
    assert.equal(findModel('maruti-suzuki', 'alto-k10')?.seats, 4);
    assert.equal(findModel('hero', 'splendor')?.seats, 1);
  });
});

/**
 * Squad-chat write rule.
 *
 * A cancelled squad went on accepting messages because the only check was
 * `participantIds`, which is a historical list and never shrinks. These pin the
 * rule that replaced it, including the two cases that matter most: a terminal
 * squad, and a member who has left.
 */
describe('squad chat write gate', () => {
  const live = { name: 'Taramani Exam Squad', status: 'active' };

  it('lets an active member of an active squad post', () => {
    assert.equal(squadPostDenial(live, 'active'), null);
  });

  it('lets a member who is travelling or arrived post', () => {
    // Journey states are not membership states.
    assert.equal(squadPostDenial(live, 'travelling'), null);
    assert.equal(squadPostDenial(live, 'arrived'), null);
  });

  it('refuses every writer once the squad is cancelled', () => {
    for (const status of ['active', 'travelling', 'arrived']) {
      const denial = squadPostDenial({ ...live, status: 'cancelled' }, status);
      assert.equal(denial?.code, 'squad-ended');
      assert.equal(denial?.status, 403);
    }
  });

  it('refuses writers once the squad is completed', () => {
    assert.equal(squadPostDenial({ ...live, status: 'completed' }, 'active')?.code, 'squad-ended');
  });

  it('names the squad in the refusal so the client can explain it', () => {
    const denial = squadPostDenial({ ...live, status: 'cancelled' }, 'active');
    assert.ok(denial!.message.includes('Taramani Exam Squad'));
  });

  it('refuses a member who has left, while the squad is still live', () => {
    const denial = squadPostDenial(live, 'left');
    assert.equal(denial?.code, 'not-a-member');
    assert.equal(denial?.status, 403);
  });

  it('refuses someone with no membership row at all', () => {
    assert.equal(squadPostDenial(live, null)?.code, 'not-a-member');
  });

  it('refuses a pending member — approval is what grants the microphone', () => {
    assert.equal(squadPostDenial(live, 'pending')?.code, 'not-a-member');
  });

  it('refuses a removed member', () => {
    assert.equal(squadPostDenial(live, 'removed')?.code, 'not-a-member');
  });

  it('404s when the squad row is gone', () => {
    const denial = squadPostDenial(null, 'active');
    assert.equal(denial?.status, 404);
  });

  it('checks the squad lifecycle before membership', () => {
    // A cancelled squad refuses even someone whose membership is immaculate,
    // and says so as "ended" rather than blaming the member.
    assert.equal(squadPostDenial({ ...live, status: 'cancelled' }, 'active')?.code, 'squad-ended');
  });
});
