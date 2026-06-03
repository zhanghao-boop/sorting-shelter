#!/usr/bin/env python3
"""
Tube-sort level generator — random mixed boards, BFS-verified opt.

How it works:
  1. Pick (n_types, n_empty); produce CAP cells per type and shuffle them
     into n_types tubes (CAP cells each) plus n_empty empty tubes.
  2. Run forward BFS until we either find a "solved" board (and record the depth)
     or run out of budget. The depth = optimal move count.
  3. Keep boards with optimal in [LO, HI]; ideally close to target.

This works because mixed-color tubes are NOT reachable from a solved state
(pours never produce inter-color stacking) — so we have to *start* mixed
and BFS toward solved.

Usage:
  python3 tools/gen_levels.py
"""
from __future__ import annotations
import random, json, sys, time
from collections import deque

CAP = 4
TYPE_POOL = list(range(0, 16))

# Per slot (L5..L20)
TARGETS = [
    # L5  L6  L7  L8  L9  L10 L11 L12 L13 L14 L15 L16 L17 L18 L19 L20
       8,  9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 14, 15, 15, 15,
]
LO, HI = 8, 15


def is_done(t):
    return len(t) == CAP and all(a == t[0] for a in t)

def is_solved_arr(arr):
    return all(not t or is_done(t) for t in arr)

def canon(tubes):
    return tuple(sorted((tuple(t) for t in tubes), key=lambda t: (len(t), t)))


def neighbours(skey):
    """Yield canonical neighbour states reachable by one legal pour."""
    st = [list(t) for t in skey]
    n = len(st)
    seen_local = set()
    for i in range(n):
        if not st[i]:
            continue
        top = st[i][-1]
        for j in range(n):
            if i == j:
                continue
            if len(st[j]) >= CAP:
                continue
            if st[j] and st[j][-1] != top:
                continue
            ns = [list(t) for t in st]
            ns[j].append(ns[i].pop())
            ck = canon(ns)
            if ck in seen_local:
                continue
            seen_local.add(ck)
            yield ck


def bfs_optimal(initial, state_cap=500_000, depth_cap=18):
    """Return optimal move count from initial to a solved state, or None if blew budget."""
    start = canon(initial)
    if is_solved_arr(start):
        return 0
    visited = {start}
    frontier = deque([(start, 0)])
    while frontier:
        s, d = frontier.popleft()
        if d >= depth_cap:
            continue
        for n in neighbours(s):
            if n in visited:
                continue
            visited.add(n)
            if is_solved_arr(n):
                return d + 1
            frontier.append((n, d + 1))
            if len(visited) > state_cap:
                return None
    return None  # unsolvable within budget


def gen_random_initial(n_types, n_empty, rng):
    """Random mixed initial board: shuffle all colored cells into n_types tubes."""
    cells = []
    for t in range(n_types):
        cells.extend([t] * CAP)
    rng.shuffle(cells)
    tubes = []
    for k in range(n_types):
        tubes.append(cells[k * CAP : (k + 1) * CAP])
    for _ in range(n_empty):
        tubes.append([])
    return tubes


def board_signature(tubes):
    """For dedup of generated boards."""
    return canon(tubes)


def gen_level(target_opt, lo, hi, rng, seen, max_attempts=4000):
    """
    Generate a random mixed board whose BFS-optimal ∈ [lo, hi] and ideally == target_opt.
    """
    # Config grid: more types & fewer empties = harder.
    if target_opt <= 9:
        configs = [(4, 2), (4, 1), (3, 2), (5, 2)]
    elif target_opt <= 11:
        configs = [(4, 1), (5, 2), (4, 2), (5, 1)]
    elif target_opt <= 13:
        configs = [(5, 2), (5, 1), (6, 2), (4, 1)]
    else:
        configs = [(5, 1), (6, 2), (5, 2), (6, 1)]
    best = None
    best_diff = 10**9
    for attempt in range(max_attempts):
        n_types, n_empty = configs[attempt % len(configs)]
        tubes = gen_random_initial(n_types, n_empty, rng)
        sig = board_signature(tubes)
        if sig in seen:
            continue
        # Skip already-solved (rare)
        if is_solved_arr(tubes):
            continue
        opt = bfs_optimal(tubes)
        if opt is None:
            continue
        if lo <= opt <= hi:
            diff = abs(opt - target_opt)
            if diff < best_diff:
                best = (tubes, opt, sig)
                best_diff = diff
                if diff == 0 and attempt > 40:
                    # accept once we've sampled enough
                    return best
        if attempt > 0 and attempt % 800 == 0 and best is not None:
            # If we found something good early, take it
            if best_diff <= 1:
                return best
    return best


def remap_types(tubes, rng):
    """Remap internal type ids to a random subset of TYPE_POOL for animal variety."""
    used = sorted({a for t in tubes for a in t})
    target_ids = rng.sample(TYPE_POOL, len(used))
    mapping = dict(zip(used, target_ids))
    return [[mapping[a] for a in t] for t in tubes]


def shuffle_layout(tubes, rng):
    out = list(tubes)
    rng.shuffle(out)
    return out


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=20260602)
    parser.add_argument("--label", default="LEVELS_C")
    args = parser.parse_args()

    t0 = time.time()
    rng = random.Random(args.seed)
    levels = []
    seen = set()
    print(f"[{args.label}] seed={args.seed}", file=sys.stderr)
    for i, target in enumerate(TARGETS):
        slot = i + 5
        result = gen_level(target, LO, HI, rng, seen)
        if result is None:
            print(f"  L{slot:>2}: ✗ failed (target={target})", file=sys.stderr)
            continue
        tubes, opt, sig = result
        seen.add(sig)
        tubes = shuffle_layout(tubes, rng)
        tubes = remap_types(tubes, rng)
        # maxSteps generous on later levels to compensate for harder planning
        if target <= 10:
            ms = opt + 8
        elif target <= 13:
            ms = opt + 9
        else:
            ms = opt + 10
        levels.append({"tubes": tubes, "opt": opt, "maxSteps": ms})
        print(f"  L{slot:>2}: opt={opt:>2}  tubes={len(tubes)}  maxSteps={ms}  ({time.time()-t0:.1f}s)")

    print(f"\n--- {args.label} L5..L20 (JSON) ---\n")
    print(json.dumps(levels, separators=(",", ":")))


if __name__ == "__main__":
    main()
