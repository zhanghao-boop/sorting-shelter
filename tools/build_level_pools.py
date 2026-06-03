#!/usr/bin/env python3
"""
Build LEVELS_C + LEVELS_S with strict animal-pool rules.

Classic (index i, level i+1):
  - Allowed type ids: 0 .. numTypes(i)-1
  - numTypes(i) = 3 + (i+1)//5   → L1-4: 3 types, L5-9: 4, L10-14: 5, …
  - Milestone levels (5,10,15,…): board MUST include the newest type
  - L1-L4: exactly 3 types on board

Steps (same index i):
  - Same allowed type pool as classic at i
  - MUST be a different puzzle (canonical signature) from classic[i]

Outputs JSON + splices v2/js/data.js
"""
from __future__ import annotations
import json, random, re, sys, time
from collections import deque
from pathlib import Path

CAP = 4
NUM_LEVELS = 50
ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "v2" / "js" / "data.js"


def num_types(level_idx: int) -> int:
    return 3 + (level_idx + 1) // 5


def allowed_pool(level_idx: int) -> list[int]:
    n = num_types(level_idx)
    return list(range(n))


def is_milestone(level_idx: int) -> bool:
    return level_idx >= 4 and (level_idx + 1) % 5 == 0


def target_opt(level_idx: int) -> tuple[int, int]:
    """Return (target, maxSteps_buffer)."""
    if level_idx < 4:
        t = 3 + level_idx // 2  # 3,3,4,4
        return t, 8
    if level_idx < 20:
        targets = [8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 14, 15, 15, 15]
        t = targets[level_idx - 4]
        buf = 8 if t <= 10 else (9 if t <= 13 else 10)
        return t, buf
    # L21+: capped — extra animal types already raise complexity
    t = min(17, 13 + (level_idx - 20) // 4)
    return t, 10


def is_done(t):
    return len(t) == CAP and all(a == t[0] for a in t)


def is_solved(tubes):
    return all(not t or is_done(t) for t in tubes)


def canon(tubes):
    return tuple(sorted((tuple(t) for t in tubes), key=lambda t: (len(t), t)))


def board_sig(tubes):
    return json.dumps(canon(tubes), separators=(",", ":"))


def types_on_board(tubes) -> set[int]:
    return {a for t in tubes for a in t}


def neighbours(skey):
    st = [list(t) for t in skey]
    n = len(st)
    seen = set()
    for i in range(n):
        if not st[i]:
            continue
        top = st[i][-1]
        for j in range(n):
            if i == j or len(st[j]) >= CAP:
                continue
            if st[j] and st[j][-1] != top:
                continue
            ns = [list(t) for t in st]
            ns[j].append(ns[i].pop())
            ck = canon(ns)
            if ck not in seen:
                seen.add(ck)
                yield ck


def bfs_optimal(tubes, state_cap=600_000, depth_cap=24):
    start = canon(tubes)
    if is_solved(tubes):
        return 0
    visited = {start}
    q = deque([(start, 0)])
    while q:
        s, d = q.popleft()
        if d >= depth_cap:
            continue
        for n in neighbours(s):
            if n in visited:
                continue
            visited.add(n)
            if is_solved(n):
                return d + 1
            q.append((n, d + 1))
            if len(visited) > state_cap:
                return None
    return None


def pick_type_subset(pool: list[int], level_idx: int, rng: random.Random) -> list[int]:
    """Which types appear on this level's board."""
    if level_idx < 4:
        return pool[:3]
    newest = pool[-1]
    # Don't put every historical type on one board — cap count for solvability
    cap = min(len(pool), 4 + level_idx // 8)
    lo = max(3, cap - 2)
    hi = max(lo, cap)
    k = rng.randint(lo, min(hi, len(pool)))
    chosen = set(rng.sample(pool, k))
    if is_milestone(level_idx):
        chosen.add(newest)
    return sorted(chosen)


def gen_board(type_ids: list[int], rng: random.Random) -> list[list[int]]:
    n = len(type_ids)
    n_empty = 2 if n <= 6 else 1
    cells = []
    for t in type_ids:
        cells.extend([t] * CAP)
    rng.shuffle(cells)
    tubes = [cells[i * CAP : (i + 1) * CAP] for i in range(n)]
    for _ in range(n_empty):
        tubes.append([])
    rng.shuffle(tubes)
    return tubes


def validate(tubes, type_ids, pool):
    used = types_on_board(tubes)
    if not used.issubset(set(pool)):
        return False
    if used != set(type_ids):
        return False
    for t in used:
        cnt = sum(1 for tube in tubes for a in tube if a == t)
        if cnt != CAP:
            return False
    return True


def try_generate(level_idx, pool, rng, opt_lo, opt_hi, seen_sigs, max_attempts=2500):
    type_ids_list = []
    if level_idx < 4:
        type_ids_list = [pool[:3]]
    else:
        for _ in range(8):
            type_ids_list.append(pick_type_subset(pool, level_idx, rng))

    for attempt in range(max_attempts):
        type_ids = type_ids_list[attempt % len(type_ids_list)]
        tubes = gen_board(type_ids, rng)
        if not validate(tubes, type_ids, pool):
            continue
        sig = board_sig(tubes)
        if sig in seen_sigs:
            continue
        opt = bfs_optimal(tubes)
        if opt is None:
            continue
        if opt_lo <= opt <= opt_hi:
            seen_sigs.add(sig)
            return tubes, opt, sig
    return None


def assign_levels(mode_prefix: str, rng_seed: int, exclude: set[str]):
    rng = random.Random(rng_seed)
    seen = set(exclude)
    levels = []
    for i in range(NUM_LEVELS):
        pool = allowed_pool(i)
        target, buf = target_opt(i)
        opt_lo = max(3, target - 2)
        opt_hi = target + 2 if i < 30 else target + 3
        result = None
        for seed_off in range(12):
            r = random.Random(rng_seed + i * 97 + seed_off * 131)
            result = try_generate(i, pool, r, opt_lo, opt_hi, seen)
            if result:
                break
        if not result:
            # relax opt window
            for seed_off in range(20):
                r = random.Random(rng_seed + i * 97 + seed_off * 131 + 999)
                result = try_generate(i, pool, r, max(3, target - 2), target + 3, seen, max_attempts=4000)
                if result:
                    break
        if not result:
            print(f"  FAIL {mode_prefix} L{i+1} pool={pool}", file=sys.stderr)
            return None
        tubes, opt, sig = result
        seen.add(sig)
        _, buf = target_opt(i)
        levels.append({"tubes": tubes, "opt": opt, "maxSteps": opt + buf})
        if (i + 1) % 10 == 0 or i < 5:
            print(f"  {mode_prefix} L{i+1:>2}: types={sorted(types_on_board(tubes))} opt={opt}")
    return levels


def verify_assignment(classic, steps):
    ok = True
    for i in range(NUM_LEVELS):
        pc, ps = allowed_pool(i), allowed_pool(i)
        tc = types_on_board(classic[i]["tubes"])
        ts = types_on_board(steps[i]["tubes"])
        if not tc.issubset(set(pc)):
            print(f"L{i+1} classic types {tc} not in {pc}", file=sys.stderr)
            ok = False
        if not ts.issubset(set(ps)):
            print(f"L{i+1} steps types {ts} not in {ps}", file=sys.stderr)
            ok = False
        if board_sig(classic[i]["tubes"]) == board_sig(steps[i]["tubes"]):
            print(f"L{i+1} classic == steps puzzle!", file=sys.stderr)
            ok = False
        if i < 4 and tc != {0, 1, 2}:
            print(f"L{i+1} classic should be exactly 3 starter types", file=sys.stderr)
            ok = False
        if is_milestone(i) and max(tc) != pc[-1]:
            print(f"L{i+1} milestone missing newest type {pc[-1]}", file=sys.stderr)
            ok = False
    return ok


def splice_data(classic, steps):
    src = DATA_JS.read_text(encoding="utf-8")
    for name, arr in [("LEVELS_C", classic), ("LEVELS_S", steps)]:
        pat = re.compile(r"(export\s+const\s+" + name + r"\s*=\s*)(\[[\s\S]*?\])(\s*;)")
        m = pat.search(src)
        if not m:
            raise RuntimeError(f"Cannot find {name}")
        src = src[: m.start(2)] + json.dumps(arr, separators=(",", ":")) + src[m.end(2) :]
    # Add COLLECT_UNLOCK if missing
    if "COLLECT_UNLOCK" not in src:
        src = src.replace(
            "export const CAP = 4;",
            "export const CAP = 4;\n\n/** Classic-mode rescues needed to unlock a critter in the Collection. */\nexport const COLLECT_UNLOCK = 10;",
        )
    DATA_JS.write_text(src, encoding="utf-8")


def main():
    t0 = time.time()
    print("Building CLASSIC levels…")
    classic = assign_levels("C", 20260603, exclude=set())
    if not classic:
        sys.exit(1)
    print("\nBuilding STEPS levels (disjoint puzzles)…")
    classic_sigs = {board_sig(l["tubes"]) for l in classic}
    steps = assign_levels("S", 19840603, exclude=classic_sigs)
    if not steps:
        sys.exit(1)
    if not verify_assignment(classic, steps):
        sys.exit(1)
    splice_data(classic, steps)
    print(f"\n✓ Wrote {DATA_JS} ({time.time()-t0:.1f}s)")
    print(f"  Classic: {NUM_LEVELS} levels | Steps: {NUM_LEVELS} levels | All puzzles unique per slot")


if __name__ == "__main__":
    main()
