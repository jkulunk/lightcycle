export class AIController {
  constructor(collisionSystem, difficulty = 'NOVICE') {
    this.collision = collisionSystem;
    this.difficulty = difficulty;
    this.decisionCooldown = 0;
  }

  setDifficulty(level) {
    this.difficulty = level;
  }

  update(dt, aiCycle, targetCycles, allSegments, obstacles = [], powerUps = []) {
    if (!aiCycle || !aiCycle.alive) return;

    // Per-cycle decision cooldown so multiple AI bikes can think independently in the same frame
    aiCycle.aiCooldown = (aiCycle.aiCooldown || 0) - dt;
    if (aiCycle.aiCooldown > 0) return;

    const px = aiCycle.pos.x;
    const pz = aiCycle.pos.y;
    const fx = aiCycle.dir.x;
    const fz = aiCycle.dir.y;

    // Left and Right orthogonal vectors
    const lx = fz;
    const lz = -fx;
    const rx = -fz;
    const rz = fx;

    const fwdDist = this.collision.raycastDistance(px, pz, fx, fz, allSegments, 200, obstacles);
    const leftDist = this.collision.raycastDistance(px, pz, lx, lz, allSegments, 200, obstacles);
    const rightDist = this.collision.raycastDistance(px, pz, rx, rz, allSegments, 200, obstacles);

    // Threshold distance at which AI must turn to avoid immediate wall/pillar impact
    const dangerThreshold = this.difficulty === 'NOVICE' ? 8.5 : 13.5;

    // Secondary branch lookahead (estimates open reachable space down each candidate turn)
    const leftOpenScore = this.evaluateBranchSpace(px, pz, lx, lz, leftDist, allSegments, obstacles);
    const rightOpenScore = this.evaluateBranchSpace(px, pz, rx, rz, rightDist, allSegments, obstacles);
    const fwdOpenScore = this.evaluateBranchSpace(px, pz, fx, fz, fwdDist, allSegments, obstacles);

    // Normalize targetCycles (supports a single cycle object OR an array of cycles for 3-4 bike battles)
    const candidates = Array.isArray(targetCycles)
      ? targetCycles
      : targetCycles
        ? [targetCycles]
        : [];

    let nearestTarget = null;
    let nearestDist = Infinity;
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (!c || c === aiCycle || !c.alive) continue;
      const d = Math.hypot(c.pos.x - px, c.pos.y - pz);
      if (d < nearestDist) {
        nearestDist = d;
        nearestTarget = c;
      }
    }

    // Aggressive cutoff bonus when AI is near an opponent and can cross in front of its nose
    let leftCutoffBonus = 0;
    let rightCutoffBonus = 0;
    if (nearestTarget && this.difficulty !== 'NOVICE' && nearestDist < 65) {
      const targetFutureX = nearestTarget.pos.x + nearestTarget.dir.x * 18;
      const targetFutureZ = nearestTarget.pos.y + nearestTarget.dir.y * 18;
      const vecFutureX = targetFutureX - px;
      const vecFutureZ = targetFutureZ - pz;

      const dotLeft = vecFutureX * lx + vecFutureZ * lz;
      const dotRight = vecFutureX * rx + vecFutureZ * rz;

      const cutoffWeight = this.difficulty === 'MCP' ? 28 : 14;
      if (dotLeft > 8 && leftDist > 28) leftCutoffBonus = cutoffWeight;
      if (dotRight > 8 && rightDist > 28) rightCutoffBonus = cutoffWeight;
    }

    // Smart Power-Up attraction: if an active power-up is within 45 units and turning toward it is safe (dist > 25)
    let leftPowerUpBonus = 0;
    let rightPowerUpBonus = 0;
    let wantsPowerUpTurn = false;
    if (powerUps && powerUps.length > 0) {
      for (let i = 0; i < powerUps.length; i++) {
        const pu = powerUps[i];
        if (!pu || pu.active === false || pu.collected) continue;
        const pux = pu.x !== undefined ? pu.x : (pu.pos ? pu.pos.x : 0);
        const puz =
          pu.z !== undefined
            ? pu.z
            : pu.y !== undefined
              ? pu.y
              : pu.pos
                ? pu.pos.z !== undefined
                  ? pu.pos.z
                  : pu.pos.y
                : 0;

        const toPuX = pux - px;
        const toPuZ = puz - pz;
        const distToPu = Math.hypot(toPuX, toPuZ);

        if (distToPu < 45) {
          const dotLeft = toPuX * lx + toPuZ * lz;
          const dotRight = toPuX * rx + toPuZ * rz;
          const dotFwd = toPuX * fx + toPuZ * fz;

          if (dotLeft > 6 && leftDist > 25) {
            leftPowerUpBonus = Math.max(leftPowerUpBonus, 24);
            if (Math.abs(dotFwd) < 16) wantsPowerUpTurn = true;
          }
          if (dotRight > 6 && rightDist > 25) {
            rightPowerUpBonus = Math.max(rightPowerUpBonus, 24);
            if (Math.abs(dotFwd) < 16) wantsPowerUpTurn = true;
          }
        }
      }
    }

    const leftBonus = leftCutoffBonus + leftPowerUpBonus;
    const rightBonus = rightCutoffBonus + rightPowerUpBonus;

    // Decide whether to turn now
    const mustTurn = fwdDist < dangerThreshold;
    const opportunisticTurn =
      !mustTurn &&
      ((fwdDist < 55 &&
        Math.random() < (this.difficulty === 'MCP' ? 0.08 : 0.045) &&
        Math.max(leftOpenScore + leftBonus, rightOpenScore + rightBonus) > fwdOpenScore * 1.25) ||
        (wantsPowerUpTurn && Math.random() < 0.25));

    if (mustTurn || opportunisticTurn) {
      const totalLeft = leftOpenScore + leftBonus + (Math.random() * 4 - 2);
      const totalRight = rightOpenScore + rightBonus + (Math.random() * 4 - 2);

      if (totalLeft > totalRight && leftDist > 4.5) {
        aiCycle.queueTurn('LEFT');
        aiCycle.aiCooldown = 0.14;
      } else if (rightDist > 4.5) {
        aiCycle.queueTurn('RIGHT');
        aiCycle.aiCooldown = 0.14;
      } else if (leftDist > rightDist) {
        aiCycle.queueTurn('LEFT');
        aiCycle.aiCooldown = 0.12;
      }
    }

    // AI Boost usage
    if (this.difficulty === 'MCP') {
      aiCycle.isBoosting = fwdDist > 38 && aiCycle.boostEnergy > 25;
    } else if (this.difficulty === 'WARRIOR') {
      aiCycle.isBoosting = fwdDist > 55 && aiCycle.boostEnergy > 50;
    } else {
      aiCycle.isBoosting = false;
    }
  }

  evaluateBranchSpace(ox, oz, dx, dz, primaryDist, allSegments, obstacles = []) {
    if (primaryDist < 4) return primaryDist;
    if (this.difficulty === 'NOVICE') return primaryDist;

    // Sample midpoint along the candidate ray and measure perpendicular escape routes
    const sampleDist = Math.min(primaryDist * 0.65, 36);
    const sx = ox + dx * sampleDist;
    const sz = oz + dz * sampleDist;

    const perp1x = dz;
    const perp1z = -dx;
    const perp2x = -dz;
    const perp2z = dx;

    const escape1 = this.collision.raycastDistance(
      sx,
      sz,
      perp1x,
      perp1z,
      allSegments,
      120,
      obstacles
    );
    const escape2 = this.collision.raycastDistance(
      sx,
      sz,
      perp2x,
      perp2z,
      allSegments,
      120,
      obstacles
    );

    return primaryDist + (escape1 + escape2) * 0.45;
  }
}
