export class AIController {
  constructor(collisionSystem, difficulty = 'WARRIOR') {
    this.collision = collisionSystem;
    this.difficulty = difficulty;
    this.decisionCooldown = 0;
  }

  setDifficulty(level) {
    this.difficulty = level;
  }

  update(dt, aiCycle, playerCycle, allSegments) {
    if (!aiCycle.alive) return;

    this.decisionCooldown -= dt;
    if (this.decisionCooldown > 0) return;

    const px = aiCycle.pos.x;
    const pz = aiCycle.pos.y;
    const fx = aiCycle.dir.x;
    const fz = aiCycle.dir.y;

    // Left and Right orthogonal vectors
    const lx = fz;
    const lz = -fx;
    const rx = -fz;
    const rz = fx;

    const fwdDist = this.collision.raycastDistance(px, pz, fx, fz, allSegments, 200);
    const leftDist = this.collision.raycastDistance(px, pz, lx, lz, allSegments, 200);
    const rightDist = this.collision.raycastDistance(px, pz, rx, rz, allSegments, 200);

    // Threshold distance at which AI must turn to avoid immediate wall impact
    const dangerThreshold = this.difficulty === 'NOVICE' ? 8.5 : 13.5;

    // Secondary branch lookahead (estimates open reachable space down each candidate turn)
    const leftOpenScore = this.evaluateBranchSpace(px, pz, lx, lz, leftDist, allSegments);
    const rightOpenScore = this.evaluateBranchSpace(px, pz, rx, rz, rightDist, allSegments);
    const fwdOpenScore = this.evaluateBranchSpace(px, pz, fx, fz, fwdDist, allSegments);

    // Aggressive cutoff bonus when AI is near player and can cross in front of player's nose
    let leftCutoffBonus = 0;
    let rightCutoffBonus = 0;
    if (playerCycle.alive && this.difficulty !== 'NOVICE') {
      const toPlayerX = playerCycle.pos.x - px;
      const toPlayerZ = playerCycle.pos.y - pz;
      const distToPlayer = Math.hypot(toPlayerX, toPlayerZ);

      if (distToPlayer < 65) {
        const playerFutureX = playerCycle.pos.x + playerCycle.dir.x * 18;
        const playerFutureZ = playerCycle.pos.y + playerCycle.dir.y * 18;
        const vecFutureX = playerFutureX - px;
        const vecFutureZ = playerFutureZ - pz;

        const dotLeft = vecFutureX * lx + vecFutureZ * lz;
        const dotRight = vecFutureX * rx + vecFutureZ * rz;

        const cutoffWeight = this.difficulty === 'MCP' ? 28 : 14;
        if (dotLeft > 8 && leftDist > 28) leftCutoffBonus = cutoffWeight;
        if (dotRight > 8 && rightDist > 28) rightCutoffBonus = cutoffWeight;
      }
    }

    // Decide whether to turn now
    const mustTurn = fwdDist < dangerThreshold;
    const opportunisticTurn =
      !mustTurn &&
      fwdDist < 55 &&
      Math.random() < (this.difficulty === 'MCP' ? 0.08 : 0.045) &&
      Math.max(leftOpenScore + leftCutoffBonus, rightOpenScore + rightCutoffBonus) >
        fwdOpenScore * 1.25;

    if (mustTurn || opportunisticTurn) {
      const totalLeft = leftOpenScore + leftCutoffBonus + (Math.random() * 4 - 2);
      const totalRight = rightOpenScore + rightCutoffBonus + (Math.random() * 4 - 2);

      if (totalLeft > totalRight && leftDist > 4.5) {
        aiCycle.queueTurn('LEFT');
        this.decisionCooldown = 0.14;
      } else if (rightDist > 4.5) {
        aiCycle.queueTurn('RIGHT');
        this.decisionCooldown = 0.14;
      } else if (leftDist > rightDist) {
        aiCycle.queueTurn('LEFT');
        this.decisionCooldown = 0.12;
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

  evaluateBranchSpace(ox, oz, dx, dz, primaryDist, allSegments) {
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

    const escape1 = this.collision.raycastDistance(sx, sz, perp1x, perp1z, allSegments, 120);
    const escape2 = this.collision.raycastDistance(sx, sz, perp2x, perp2z, allSegments, 120);

    return primaryDist + (escape1 + escape2) * 0.45;
  }
}
