import assert from "node:assert/strict";
import test from "node:test";

import { itemLimit } from "./limit";

for (const maximum of [5, 10]) {
  test(`item limit accepts numbers and model-generated numeric strings up to ${maximum}`, () => {
    const schema = itemLimit(maximum);
    assert.equal(schema.parse(undefined), undefined);
    for (const value of [1, maximum]) {
      assert.equal(schema.parse(value), value);
      assert.equal(schema.parse(String(value)), value);
    }
    for (const value of [0, "0", maximum + 1, String(maximum + 1), -1, "-1", 1.5, "1.5", "", "five", null, true, {}, []]) {
      assert.equal(schema.safeParse(value).success, false, `accepted ${JSON.stringify(value)}`);
    }
  });
}
