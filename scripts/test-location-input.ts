import {
  resolveManualEntryInput,
  seedManualLocationFields
} from "../lib/locationInput";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(
  resolveManualEntryInput({ address: "Philadelphia, PA", zip: "19103" }).input === "Philadelphia, PA",
  "address field wins when both are filled"
);
assert(
  resolveManualEntryInput({ address: "", zip: "19103", zipPlaceId: "zip-id" }).input === "19103",
  "zip field used when address empty"
);
assert(
  seedManualLocationFields("19103", "zip-id").zip === "19103",
  "zip seed goes to zip field"
);
assert(
  seedManualLocationFields("Philadelphia, PA", "place-id").address === "Philadelphia, PA",
  "city seed goes to address field"
);

console.log("PASS location input");
