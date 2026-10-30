export class CollisionSystem {
  constructor(arenaSize = 200) {
    this.halfSize = arenaSize / 2;
  }

  /**
   * Checks if moving from prevPos to currPos collides with arena bounds or any trail segment
   */
  checkCycleCollision(prevPos, currPos, allSegments) {
    const margin = 0.7;
    if (
      currPos.x <= -this.halfSize + margin ||
      currPos.x >= this.halfSize - margin ||
      currPos.y <= -this.halfSize + margin ||
      currPos.y >= this.halfSize - margin
    ) {
      return true;
    }

    for (let i = 0; i < allSegments.length; i++) {
      const seg = allSegments[i];
      if (this.sweptSegmentHit(prevPos.x, prevPos.y, currPos.x, currPos.y, seg, 0.58)) {
        return true;
      }
    }
    return false;
  }

  sweptSegmentHit(px1, pz1, px2, pz2, seg, radius = 0.58) {
    // Axis-aligned or general segment distance check
    const minX = Math.min(seg.x1, seg.x2) - radius;
    const maxX = Math.max(seg.x1, seg.x2) + radius;
    const minZ = Math.min(seg.z1, seg.z2) - radius;
    const maxZ = Math.max(seg.z1, seg.z2) + radius;

    const moveMinX = Math.min(px1, px2);
    const moveMaxX = Math.max(px1, px2);
    const moveMinZ = Math.min(pz1, pz2);
    const moveMaxZ = Math.max(pz1, pz2);

    // Quick AABB reject
    if (moveMaxX < minX || moveMinX > maxX || moveMaxZ < minZ || moveMinZ > maxZ) {
      return false;
    }

    // Check endpoint distance or segment intersection
    const distEnd = this.pointToSegmentDistance(px2, pz2, seg.x1, seg.z1, seg.x2, seg.z2);
    if (distEnd <= radius) return true;

    return this.segmentsIntersect(px1, pz1, px2, pz2, seg.x1, seg.z1, seg.x2, seg.z2);
  }

  pointToSegmentDistance(px, pz, x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const lenSq = dx * dx + dz * dz;
    if (lenSq < 0.0001) return Math.hypot(px - x1, pz - z1);
    let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projZ = z1 + t * dz;
    return Math.hypot(px - projX, pz - projZ);
  }

  segmentsIntersect(ax, az, bx, bz, cx, cz, dx, dz) {
    const ccw = (p1x, p1z, p2x, p2z, p3x, p3z) =>
      (p3z - p1z) * (p2x - p1x) > (p2z - p1z) * (p3x - p1x);
    return (
      ccw(ax, az, cx, cz, dx, dz) !== ccw(bx, bz, cx, cz, dx, dz) &&
      ccw(ax, az, bx, bz, cx, cz) !== ccw(ax, az, bx, bz, dx, dz)
    );
  }

  /**
   * Casts an orthogonal ray from (ox, oz) along (dx, dz) and returns distance to nearest wall/trail
   */
  raycastDistance(ox, oz, dx, dz, allSegments, maxDist = 200) {
    let minDist = maxDist;

    // Distance to arena boundary
    if (dx > 0.5) minDist = Math.min(minDist, this.halfSize - ox);
    else if (dx < -0.5) minDist = Math.min(minDist, ox + this.halfSize);
    else if (dz > 0.5) minDist = Math.min(minDist, this.halfSize - oz);
    else if (dz < -0.5) minDist = Math.min(minDist, oz + this.halfSize);

    for (let i = 0; i < allSegments.length; i++) {
      const s = allSegments[i];
      const segMinX = Math.min(s.x1, s.x2) - 0.5;
      const segMaxX = Math.max(s.x1, s.x2) + 0.5;
      const segMinZ = Math.min(s.z1, s.z2) - 0.5;
      const segMaxZ = Math.max(s.z1, s.z2) + 0.5;

      if (Math.abs(dx) > 0.5) {
        // Horizontal ray along X
        if (oz >= segMinZ && oz <= segMaxZ) {
          const targetX = dx > 0 ? segMinX : segMaxX;
          const dist = (targetX - ox) * dx;
          if (dist > 0.2 && dist < minDist) {
            minDist = dist;
          }
        }
      } else {
        // Vertical ray along Z
        if (ox >= segMinX && ox <= segMaxX) {
          const targetZ = dz > 0 ? segMinZ : segMaxZ;
          const dist = (targetZ - oz) * dz;
          if (dist > 0.2 && dist < minDist) {
            minDist = dist;
          }
        }
      }
    }

    return Math.max(0, minDist);
  }

  /**
   * Checks if cycle is within slipstream distance of any wall on its left or right flank
   */
  checkSlipstream(cycle, allSegments) {
    const leftDir = { x: cycle.dir.y, z: -cycle.dir.x };
    const rightDir = { x: -cycle.dir.y, z: cycle.dir.x };
    const dLeft = this.raycastDistance(cycle.pos.x, cycle.pos.y, leftDir.x, leftDir.z, allSegments, 5);
    const dRight = this.raycastDistance(cycle.pos.x, cycle.pos.y, rightDir.x, rightDir.z, allSegments, 5);
    return dLeft < 3.6 || dRight < 3.6;
  }
}
