const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SR_BASE = "https://api.simpliroute.com/v1";
const START = { addr: "Av. Vasco de Quiroga 3800, Santa Fe, CDMX", lat: 19.3595, lng: -99.2738 };

const VEHICLES = [
  { name: "Sprinter Norte LIV-001", capacity: 30 },
  { name: "Transit Sur LIV-002", capacity: 25 },
  { name: "NV400 Poniente LIV-003", capacity: 20 },
  { name: "Daily Oriente LIV-004", capacity: 35 },
  { name: "Sprinter Centro LIV-005", capacity: 30 },
];
const DRIVERS = [
  { name: "Carlos Martínez" },
  { name: "Roberto Hernández" },
  { name: "Miguel López" },
  { name: "Javier García" },
  { name: "Fernando Torres" },
];
const VISITS = [
  ["Liverpool Polanco", "Masaryk 340, Polanco, Miguel Hidalgo, Ciudad de México", 19.432, -99.194, 3],
  ["Liverpool Santa Fe", "Vasco de Quiroga 3850, Santa Fe, Cuajimalpa, Ciudad de México", 19.366, -99.262, 4],
  ["Liverpool Perisur", "Periférico Sur 4690, Coyoacán, Ciudad de México", 19.303, -99.191, 3],
  ["Liverpool Insurgentes", "Insurgentes Sur 1310, Del Valle, Benito Juárez, Ciudad de México", 19.385, -99.177, 5],
  ["Liverpool Centro", "20 de Noviembre 4, Centro, Cuauhtémoc, Ciudad de México", 19.433, -99.133, 2],
  ["Entrega Condesa", "Tamaulipas 150, Condesa, Ciudad de México", 19.412, -99.170, 2],
  ["Entrega Roma Norte", "Orizaba 42, Roma Norte, Ciudad de México", 19.418, -99.163, 1],
  ["Entrega Coyoacán", "Av. México 154, Coyoacán, Ciudad de México", 19.350, -99.162, 3],
  ["Entrega Del Valle", "Gabriel Mancera 800, Del Valle, Ciudad de México", 19.378, -99.166, 2],
  ["Entrega San Ángel", "Revolución 1877, San Ángel, Ciudad de México", 19.347, -99.189, 3],
  ["Entrega Mixcoac", "Revolución 1233, Mixcoac, Ciudad de México", 19.372, -99.187, 2],
  ["Entrega Lomas", "Palmas 820, Lomas de Chapultepec, Ciudad de México", 19.428, -99.215, 1],
  ["Entrega Tacubaya", "Jalisco 117, Tacubaya, Ciudad de México", 19.402, -99.192, 2],
  ["Entrega Observatorio", "Observatorio 340, Ciudad de México", 19.393, -99.205, 2],
  ["Entrega Anzures", "Euler 120, Anzures, Ciudad de México", 19.435, -99.183, 1],
  ["Entrega Pedregal", "Periférico Sur 3430, Pedregal, Ciudad de México", 19.320, -99.201, 3],
  ["Entrega Escandón", "Nuevo León 80, Escandón, Ciudad de México", 19.407, -99.176, 2],
  ["Entrega Nápoles", "Insurgentes Sur 1602, Nápoles, Ciudad de México", 19.375, -99.178, 1],
  ["Entrega Doctores", "Dr. Lavista 130, Doctores, Ciudad de México", 19.415, -99.147, 2],
  ["Entrega Reforma", "Reforma 505, Cuauhtémoc, Ciudad de México", 19.429, -99.167, 1],
];

// Helper: call SimpliRoute API
async function sr(token, method, endpoint, body = null) {
  const opts = {
    method,
    headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${SR_BASE}${endpoint}`, opts);
  if (r.status === 204) return { status: 204, data: null };
  try {
    const data = await r.json();
    return { status: r.status, data };
  } catch {
    return { status: r.status, data: null };
  }
}

function getList(result) {
  if (!result.data) return [];
  return Array.isArray(result.data) ? result.data : result.data.results || [];
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ── GET /api/status ──
app.get("/api/status", async (req, res) => {
  const token = req.headers["x-token"];
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    const me = await sr(token, "GET", "/accounts/me/");
    if (me.status !== 200) return res.status(401).json({ error: "Invalid token" });

    const vehs = getList(await sr(token, "GET", "/routes/vehicles/"));
    const allDrivers = getList(await sr(token, "GET", "/accounts/drivers/"));
    const drivers = allDrivers.filter(d => d.status === 'active');

    // Fetch visits for today, tomorrow, and next few days to catch all created visits
    let visits = [];
    for (let offset = 0; offset <= 3; offset++) {
      const d = new Date(); d.setDate(d.getDate() + offset);
      const dt = d.toISOString().split("T")[0];
      const dayVisits = getList(await sr(token, "GET", `/routes/visits/?planned_date=${dt}&limit=500`));
      visits = visits.concat(dayVisits);
    }

    const plans = getList(await sr(token, "GET", "/routes/plans/"));

    // Enrich vehicles with driver names
    const enriched = vehs.map((v) => ({
      ...v,
      driver_name: drivers.find((d) => d.id === v.default_driver)?.name || "Sin asignar",
    }));

    res.json({
      account: me.data.email,
      vehicles: enriched,
      drivers,
      visits,
      plans,
      summary: {
        vehicles: vehs.length,
        drivers: drivers.length,
        visits: visits.length,
        plans: plans.length,
        total_capacity: vehs.reduce((a, v) => a + (v.capacity || 0), 0),
        total_load: visits.reduce((a, v) => a + (v.load || 0), 0),
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/create ──
app.post("/api/create", async (req, res) => {
  const token = req.headers["x-token"];
  if (!token) return res.status(400).json({ error: "Token required" });

  const log = [];
  const ts = Date.now();

  try {
    // Create vehicles
    const vehIds = [];
    for (const v of VEHICLES) {
      const r = await sr(token, "POST", "/routes/vehicles/", {
        name: v.name, capacity: v.capacity,
        location_start_address: START.addr, location_start_latitude: START.lat, location_start_longitude: START.lng,
        location_end_address: START.addr, location_end_latitude: START.lat, location_end_longitude: START.lng,
      });
      if (r.status === 201) { vehIds.push(r.data.id); log.push(`🚛 ${v.name} (ID: ${r.data.id})`); }
    }

    // Create drivers
    const drvIds = [];
    for (const d of DRIVERS) {
      const uname = d.name.toLowerCase().replace(/ /g, ".").replace(/[áéíóúñ]/g, c => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ñ: "n" })[c] || c) + ts;
      const r = await sr(token, "POST", "/accounts/drivers/", {
        username: uname, name: d.name, email: `${uname}@demo.com`,
        password: "Demo2026!", is_driver: true, is_admin: false, is_dispatcher: false,
      });
      if (r.status === 201) { drvIds.push(r.data.id); log.push(`👤 ${d.name} (ID: ${r.data.id})`); }
    }

    // Link drivers to vehicles
    for (let i = 0; i < Math.min(vehIds.length, drvIds.length); i++) {
      await sr(token, "PATCH", `/routes/vehicles/${vehIds[i]}/`, { default_driver: drvIds[i] });
      log.push(`🔗 ${DRIVERS[i].name} → ${VEHICLES[i].name}`);
    }

    // Create visits
    const date = tomorrow();
    const batch = VISITS.map(([title, addr, lat, lng, load]) => ({
      title, address: addr, latitude: lat, longitude: lng, load,
      planned_date: date,
      notes: `Integración Enterprise Liverpool — LIV-${Math.floor(Math.random() * 900000 + 100000)}`,
    }));
    const vr = await sr(token, "POST", "/routes/visits/", batch);
    const created = Array.isArray(vr.data) ? vr.data.length : 1;
    log.push(`📦 ${created} visitas creadas para ${date}`);

    // Create plan
    await sr(token, "POST", "/routes/plans/", { name: `Liverpool CDMX ${date}`, date });
    log.push(`🗺️ Plan creado: Liverpool CDMX ${date}`);

    res.json({ success: true, log, vehicles: vehIds.length, drivers: drvIds.length, visits: created });
  } catch (e) {
    res.status(500).json({ error: e.message, log });
  }
});

// ── POST /api/delete ──
app.post("/api/delete", async (req, res) => {
  const token = req.headers["x-token"];
  if (!token) return res.status(400).json({ error: "Token required" });

  const log = [];
  try {
    // Delete visits (check multiple dates)
    for (let offset = -2; offset <= 5; offset++) {
      const d = new Date(); d.setDate(d.getDate() + offset);
      const dt = d.toISOString().split("T")[0];
      const visits = getList(await sr(token, "GET", `/routes/visits/?planned_date=${dt}&limit=500`));
      for (const v of visits) await sr(token, "DELETE", `/routes/visits/${v.id}/`);
      if (visits.length) log.push(`📦 ${visits.length} visitas eliminadas (${dt})`);
    }

    // Delete plans
    const plans = getList(await sr(token, "GET", "/routes/plans/"));
    for (const p of plans) { await sr(token, "DELETE", `/routes/plans/${p.id}/`); log.push(`🗺️ Plan eliminado`); }

    // Delete vehicles
    const vehs = getList(await sr(token, "GET", "/routes/vehicles/"));
    for (const v of vehs) { await sr(token, "DELETE", `/routes/vehicles/${v.id}/`); log.push(`🚛 ${v.name} eliminado`); }

    // Delete/deactivate drivers
    const drivers = getList(await sr(token, "GET", "/accounts/drivers/"));
    for (const d of drivers) {
      const del = await sr(token, "PATCH", `/accounts/drivers/${d.id}/`, { status: "blocked", is_driver: true });
      log.push(`👤 ${d.name} ${del.status === 200 ? 'bloqueado' : `error (${del.status})`}`);
    }

    res.json({ success: true, log });
  } catch (e) {
    res.status(500).json({ error: e.message, log });
  }
});

// ── POST /api/reset ──
app.post("/api/reset", async (req, res) => {
  const token = req.headers["x-token"];
  if (!token) return res.status(400).json({ error: "Token required" });

  // Proxy to delete then create
  try {
    const delRes = await fetch(`http://localhost:${PORT}/api/delete`, {
      method: "POST", headers: { "x-token": token },
    }).then((r) => r.json());

    const createRes = await fetch(`http://localhost:${PORT}/api/create`, {
      method: "POST", headers: { "x-token": token },
    }).then((r) => r.json());

    res.json({
      success: true,
      deleted: delRes.log || [],
      created: createRes.log || [],
      summary: { vehicles: createRes.vehicles, drivers: createRes.drivers, visits: createRes.visits },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/simulate ── Complete visits via API to generate reports in SimpliRoute
app.post("/api/simulate", async (req, res) => {
  const token = req.headers["x-token"];
  if (!token) return res.status(400).json({ error: "Token required" });

  const log = [];
  try {
    // Get all pending visits
    let visits = [];
    for (let offset = 0; offset <= 3; offset++) {
      const d = new Date(); d.setDate(d.getDate() + offset);
      const dt = d.toISOString().split("T")[0];
      const dayVisits = getList(await sr(token, "GET", `/routes/visits/?planned_date=${dt}&limit=500`));
      visits = visits.concat(dayVisits);
    }

    const pending = visits.filter(v => v.status === "pending");
    const results = { completed: 0, failed: 0, total: pending.length, details: [] };

    for (const visit of pending) {
      // Simulate: 80% success, 20% failed
      const success = Math.random() > 0.2;
      const baseTime = new Date();
      baseTime.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      const checkin = baseTime.toISOString();
      baseTime.setMinutes(baseTime.getMinutes() + 3 + Math.floor(Math.random() * 10));
      const checkout = baseTime.toISOString();

      if (success) {
        const r = await sr(token, "PATCH", `/routes/visits/${visit.id}/`, {
          status: "completed",
          checkin_time: checkin,
          checkout_time: checkout,
          checkout_latitude: visit.latitude,
          checkout_longitude: visit.longitude,
          checkout_comment: "Entrega exitosa — Simulación Torre de Control"
        });
        if (r.status === 200) {
          results.completed++;
          log.push(`✅ ${visit.title} — completada`);
          results.details.push({ id: visit.id, title: visit.title, status: "completed", lat: visit.latitude, lng: visit.longitude });
        }
      } else {
        const r = await sr(token, "PATCH", `/routes/visits/${visit.id}/`, {
          status: "failed",
          checkin_time: checkin,
          checkout_time: checkout,
          checkout_latitude: visit.latitude,
          checkout_longitude: visit.longitude,
          checkout_comment: "Cliente ausente — Simulación Torre de Control"
        });
        if (r.status === 200) {
          results.failed++;
          log.push(`❌ ${visit.title} — fallida (cliente ausente)`);
          results.details.push({ id: visit.id, title: visit.title, status: "failed", lat: visit.latitude, lng: visit.longitude });
        }
      }
    }

    res.json({ success: true, log, results });
  } catch (e) {
    res.status(500).json({ error: e.message, log });
  }
});

// ── POST /api/vehicles (custom) ──
app.post("/api/vehicles", async (req, res) => {
  const token = req.headers["x-token"];
  const { name, capacity } = req.body;
  const r = await sr(token, "POST", "/routes/vehicles/", {
    name, capacity: capacity || 30,
    location_start_address: START.addr, location_start_latitude: START.lat, location_start_longitude: START.lng,
    location_end_address: START.addr, location_end_latitude: START.lat, location_end_longitude: START.lng,
  });
  res.status(r.status).json(r.data);
});

// ── POST /api/visits (custom) ──
app.post("/api/visits", async (req, res) => {
  const token = req.headers["x-token"];
  const visit = { ...req.body, planned_date: req.body.planned_date || tomorrow() };
  const r = await sr(token, "POST", "/routes/visits/", visit);
  res.status(r.status).json(r.data);
});

// Fallback to index.html
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SimpliRoute Demo Server running on port ${PORT}`));
