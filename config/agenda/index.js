const Agenda = require("agenda");

const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "jobs" },
});

agenda.on("ready", () => console.log("✅ Agenda started"));

(async function () {
  await agenda.start();
})();

module.exports = agenda;
