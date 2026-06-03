#!/usr/bin/env python3
"""Splice generated L5-L20 into v2/js/data.js for both LEVELS_C and LEVELS_S."""
from __future__ import annotations
import json, re, sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "v2" / "js" / "data.js"

NEW_C = json.loads(r'''[{"tubes":[[8,8,14,8],[6,6,6,14],[],[],[14,6,8,14]],"opt":8,"maxSteps":16},{"tubes":[[11,10,10,13],[11,11,10,10],[],[],[13,13,11,13]],"opt":9,"maxSteps":17},{"tubes":[[9,9,15,15],[],[4,4,4,8],[8,8,15,8],[],[9,15,9,4]],"opt":10,"maxSteps":18},{"tubes":[[10,10,10,11],[6,4,6,10],[],[11,4,4,4],[6,6,11,11]],"opt":10,"maxSteps":18},{"tubes":[[8,8,6,0],[],[6,0,6,0],[15,15,15,8],[8,6,0,15],[]],"opt":11,"maxSteps":20},{"tubes":[[15,6,6,6],[],[],[14,14,15,2],[15,15,14,6],[2,2,2,14]],"opt":11,"maxSteps":20},{"tubes":[[1,1,7,1],[3,7,3,7],[],[3,1,11,3],[11,11,11,7]],"opt":12,"maxSteps":21},{"tubes":[[5,9,9,12],[12,12,5,9],[5,12,13,5],[],[13,13,13,9]],"opt":12,"maxSteps":21},{"tubes":[[],[3,10,0,0],[3,11,3,10],[0,0,11,11],[10,10,11,3]],"opt":13,"maxSteps":22},{"tubes":[[3,3,3,8],[],[15,7,15,5],[8,8,5,5],[7,7,3,15],[15,8,5,7]],"opt":13,"maxSteps":22},{"tubes":[[6,2,15,2],[],[],[11,11,11,15],[10,10,15,6],[10,6,15,2],[2,10,6,11]],"opt":14,"maxSteps":24},{"tubes":[[],[13,12,4,2],[13,4,13,4],[],[13,2,12,12],[0,0,0,0],[4,12,2,2]],"opt":14,"maxSteps":24},{"tubes":[[7,2,2,1],[],[7,1,4,1],[2,6,2,4],[],[4,4,7,1],[6,6,6,7]],"opt":14,"maxSteps":24},{"tubes":[[],[2,0,10,0],[3,2,3,10],[3,10,0,2],[11,11,11,3],[11,10,0,2],[]],"opt":15,"maxSteps":25},{"tubes":[[2,3,6,6],[2,11,4,6],[],[11,11,2,3],[],[3,4,2,11],[4,4,3,6]],"opt":15,"maxSteps":25},{"tubes":[[],[5,5,0,5],[13,5,0,6],[],[7,7,13,13],[6,7,0,13],[6,6,7,0]],"opt":15,"maxSteps":25}]''')

NEW_S = json.loads(r'''[{"tubes":[[4,4,4,6],[],[4,6,8,6],[],[8,8,6,8]],"opt":8,"maxSteps":16},{"tubes":[[14,14,11,12],[],[12,14,14,12],[11,11,12,11],[]],"opt":9,"maxSteps":17},{"tubes":[[12,12,3,7],[7,7,7,4],[12,3,12,3],[3,4,4,4],[],[]],"opt":10,"maxSteps":18},{"tubes":[[],[9,14,0,0],[9,9,0,14],[12,12,12,9],[14,14,12,0]],"opt":10,"maxSteps":18},{"tubes":[[7,7,15,14],[14,4,15,4],[15,15,4,4],[],[14,7,7,14]],"opt":11,"maxSteps":20},{"tubes":[[13,8,13,8],[],[],[14,14,11,14],[11,11,8,8],[13,13,14,11]],"opt":11,"maxSteps":20},{"tubes":[[],[14,10,8,8],[14,14,14,1],[10,8,10,1],[1,1,10,8]],"opt":12,"maxSteps":21},{"tubes":[[6,6,1,15],[4,4,6,4],[],[6,15,1,15],[1,1,4,15]],"opt":12,"maxSteps":21},{"tubes":[[1,11,11,13],[12,1,12,13],[12,1,1,13],[],[11,11,13,12]],"opt":13,"maxSteps":22},{"tubes":[[11,0,10,10],[],[7,7,0,11],[0,0,7,7],[10,11,11,10]],"opt":13,"maxSteps":22},{"tubes":[[15,15,4,4],[2,2,2,4],[14,0,0,4],[],[0,15,14,2],[0,14,14,15]],"opt":14,"maxSteps":24},{"tubes":[[0,14,14,14],[4,4,0,3],[],[],[3,14,4,0],[3,0,15,4],[15,15,15,3]],"opt":14,"maxSteps":24},{"tubes":[[13,13,8,8],[],[],[8,5,11,8],[11,5,13,15],[11,11,15,15],[5,5,13,15]],"opt":14,"maxSteps":24},{"tubes":[[11,11,10,10],[11,0,5,9],[9,5,5,11],[],[0,0,5,9],[9,10,0,10],[]],"opt":15,"maxSteps":25},{"tubes":[[9,1,5,9],[],[5,15,15,15],[],[1,1,5,15],[9,9,10,5],[10,1,10,10]],"opt":15,"maxSteps":25},{"tubes":[[13,6,6,6],[14,14,5,5],[6,15,14,13],[13,13,5,5],[],[],[14,15,15,15]],"opt":15,"maxSteps":25}]''')


def replace_array(src: str, var_name: str, new_levels: list) -> str:
    """Replace `export const VAR_NAME = [...];` array, swapping indices 4..19."""
    # Find the array literal after `export const <var> = `
    pattern = re.compile(
        r'(export\s+const\s+' + re.escape(var_name) + r'\s*=\s*)(\[[\s\S]*?\])(\s*;)'
    )
    m = pattern.search(src)
    if not m:
        raise RuntimeError(f"Could not locate {var_name}")
    arr_text = m.group(2)
    existing = json.loads(arr_text)
    if len(existing) < 20:
        raise RuntimeError(f"{var_name} has fewer than 20 entries ({len(existing)})")
    if len(new_levels) != 16:
        raise RuntimeError(f"Expected 16 new levels, got {len(new_levels)}")
    spliced = existing[:4] + new_levels + existing[20:]
    new_arr = json.dumps(spliced, separators=(",", ":"))
    return src[:m.start(2)] + new_arr + src[m.end(2):]


def main():
    src = DATA.read_text(encoding="utf-8")
    src = replace_array(src, "LEVELS_C", NEW_C)
    src = replace_array(src, "LEVELS_S", NEW_S)
    DATA.write_text(src, encoding="utf-8")
    print(f"Updated {DATA}")


if __name__ == "__main__":
    main()
