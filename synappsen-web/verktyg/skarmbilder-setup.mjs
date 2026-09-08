import seedaDemodata from "./demodata.mjs";

export default async function globalSetup() {
  await seedaDemodata();
}
