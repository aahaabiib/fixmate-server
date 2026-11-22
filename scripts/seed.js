import "dotenv/config";
import { getDb } from "../src/config/db.js";

const AUTH_URL = (process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const USER_PASSWORD = process.env.SEED_USER_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !USER_PASSWORD) {
  console.error(
    "Missing env: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD are required."
  );
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 8 || USER_PASSWORD.length < 8) {
  console.error("Seed passwords must be at least 8 characters.");
  process.exit(1);
}

// ---------- data ----------

const img = (label) =>
  `https://placehold.co/800x500/0f172a/f97316/png?text=${encodeURIComponent(label)}`;

const TECHNICIANS = [
  {
    name: "Rafiq Ahmed",
    email: "rafiq.tech@fixmate.dev",
    phone: "01711000001",
    area: "Dhanmondi, Dhaka",
    bio: "10 years of experience in phone, TV and electrical repair.",
  },
  {
    name: "Nusrat Jahan",
    email: "nusrat.tech@fixmate.dev",
    phone: "01711000002",
    area: "Mirpur, Dhaka",
    bio: "Certified AC, refrigerator and washing machine technician.",
  },
  {
    name: "Tanvir Hasan",
    email: "tanvir.tech@fixmate.dev",
    phone: "01711000003",
    area: "Uttara, Dhaka",
    bio: "Laptop, PC and smart TV specialist. Fast and honest service.",
  },
];

const CUSTOMERS = [
  {
    name: "Sadia Rahman",
    email: "sadia.customer@fixmate.dev",
    phone: "01811000001",
    area: "Banani, Dhaka",
    address: "House 12, Road 5, Banani, Dhaka",
  },
  {
    name: "Imran Hossain",
    email: "imran.customer@fixmate.dev",
    phone: "01811000002",
    area: "Gulshan, Dhaka",
    address: "Flat 4B, Road 90, Gulshan 2, Dhaka",
  },
];

// tech = TECHNICIANS er index
const SERVICES = [
  { tech: 0, category: "Smartphone", title: "iPhone Screen Replacement", price: 80, duration: "1-2 hours", mode: "Home Visit", area: "Dhanmondi, Dhaka", description: "Cracked or unresponsive iPhone screen replaced with a high quality panel. Includes 3 months warranty on the new screen." },
  { tech: 0, category: "Smartphone", title: "Android Battery Replacement", price: 35, duration: "45 minutes", mode: "Shop Drop-off", area: "Dhanmondi, Dhaka", description: "Phone draining too fast? We replace the battery with a genuine quality cell and test charging and health." },
  { tech: 2, category: "Laptop & PC", title: "Laptop Motherboard Repair", price: 120, duration: "2-3 days", mode: "Shop Drop-off", area: "Uttara, Dhaka", description: "Chip-level motherboard repair for laptops that do not power on, restart randomly or have liquid damage." },
  { tech: 2, category: "Laptop & PC", title: "Laptop Software and Virus Cleanup", price: 25, duration: "1 hour", mode: "Home Visit", area: "Uttara, Dhaka", description: "Windows reinstall, virus removal, driver updates and speed tuning to make your slow laptop fast again." },
  { tech: 1, category: "AC", title: "AC Gas Refill and Servicing", price: 60, duration: "1-2 hours", mode: "Home Visit", area: "Mirpur, Dhaka", description: "Full AC servicing with indoor and outdoor cleaning, gas pressure check and refill if needed." },
  { tech: 1, category: "AC", title: "AC Installation", price: 90, duration: "3-4 hours", mode: "Home Visit", area: "Mirpur, Dhaka", description: "Professional split AC installation with piping, wiring, drain setup and a full cooling test." },
  { tech: 2, category: "Refrigerator", title: "Refrigerator Compressor Repair", price: 110, duration: "3-5 hours", mode: "Home Visit", area: "Uttara, Dhaka", description: "Compressor diagnosis and repair or replacement for fridges that are not cooling or make loud noise." },
  { tech: 1, category: "Refrigerator", title: "Fridge Cooling Problem Fix", price: 45, duration: "1-2 hours", mode: "Home Visit", area: "Mirpur, Dhaka", description: "Fix thermostat, door seal and fan issues so your refrigerator and freezer cool properly again." },
  { tech: 0, category: "TV", title: "LED TV Panel Repair", price: 95, duration: "1-2 days", mode: "Shop Drop-off", area: "Dhanmondi, Dhaka", description: "Repair of LED TV backlight, lines and dark screen problems. We check the panel before quoting." },
  { tech: 2, category: "TV", title: "Smart TV Software Fix", price: 30, duration: "1 hour", mode: "Home Visit", area: "Uttara, Dhaka", description: "Smart TV stuck on logo, apps not working or slow? We update firmware and reset the system safely." },
  { tech: 1, category: "Washing Machine", title: "Washing Machine Motor Repair", price: 70, duration: "2-3 hours", mode: "Home Visit", area: "Mirpur, Dhaka", description: "Motor and belt repair for washing machines that do not spin or make grinding noise during the wash." },
  { tech: 2, category: "Washing Machine", title: "Washing Machine Drain and Leak Fix", price: 40, duration: "1-2 hours", mode: "Home Visit", area: "Uttara, Dhaka", description: "Fix drain blockage, pump and hose leaks so water drains properly and nothing leaks on your floor." },
  { tech: 0, category: "Electrical", title: "House Wiring and Switch Repair", price: 35, duration: "1-3 hours", mode: "Home Visit", area: "Dhanmondi, Dhaka", description: "Repair of faulty switches, sockets and wiring problems. Safe work with proper materials and testing." },
  { tech: 1, category: "Electrical", title: "Ceiling Fan and Light Installation", price: 20, duration: "1 hour", mode: "Home Visit", area: "Mirpur, Dhaka", description: "Installation of ceiling fans, tube lights and decorative lights, including regulator and wiring check." },
  // admin demo er jonno ekta pending service
  { tech: 2, category: "Laptop & PC", title: "Gaming PC Cleaning and Thermal Paste", price: 30, duration: "1-2 hours", mode: "Home Visit", area: "Uttara, Dhaka", description: "Deep dust cleaning and thermal paste replacement to lower temperatures on your gaming PC.", status: "pending" },
];

// svc = service title, cust = CUSTOMERS index
const BOOKINGS = [
  { key: "b1", svc: "iPhone Screen Replacement", cust: 0, status: "requested", daysAgo: 1, problem: "The screen is cracked and touch does not work on the right side." },
  { key: "b2", svc: "AC Gas Refill and Servicing", cust: 0, status: "accepted", daysAgo: 2, problem: "AC is running but the room is not cooling properly anymore." },
  { key: "b3", svc: "LED TV Panel Repair", cust: 1, status: "in-progress", daysAgo: 3, problem: "Vertical lines appeared on the TV screen after a power cut." },
  { key: "b4", svc: "Washing Machine Motor Repair", cust: 1, status: "completed", daysAgo: 5, final: 75, paid: false, problem: "Washing machine does not spin and makes a loud humming sound." },
  { key: "b5", svc: "Laptop Motherboard Repair", cust: 0, status: "completed", daysAgo: 8, final: 130, paid: true, problem: "Laptop does not turn on at all, only the charging light blinks." },
  { key: "b6", svc: "Fridge Cooling Problem Fix", cust: 1, status: "rejected", daysAgo: 6, problem: "Freezer is working but the main fridge section stays warm." },
  { key: "b7", svc: "House Wiring and Switch Repair", cust: 0, status: "cancelled", daysAgo: 4, problem: "Two wall switches in the bedroom spark when I turn them on." },
  { key: "b8", svc: "Smart TV Software Fix", cust: 1, status: "completed", daysAgo: 12, final: 30, paid: true, problem: "Smart TV is stuck on the logo screen and will not start apps." },
];

const PATHS = {
  requested: ["requested"],
  accepted: ["requested", "accepted"],
  "in-progress": ["requested", "accepted", "in-progress"],
  completed: ["requested", "accepted", "in-progress", "completed"],
  rejected: ["requested", "rejected"],
  cancelled: ["requested", "cancelled"],
};

// ---------- helpers ----------

async function ensureUser(db, { name, email, password, role, extra = {} }) {
  const users = db.collection("user");

  const existing = await users.findOne({ email });
  if (!existing) {
    const res = await fetch(`${AUTH_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: AUTH_URL },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(
        `Sign up failed for ${email} (${res.status}) ${json.message || ""}. Is the client running at ${AUTH_URL}?`
      );
    }
    console.log(`  + created user ${email}`);
  } else {
    console.log(`  = user exists ${email}`);
  }

  await users.updateOne(
    { email },
    { $set: { role, emailVerified: true, updatedAt: new Date(), ...extra } }
  );
  return users.findOne({ email });
}

const dayMs = 24 * 60 * 60 * 1000;
const dateOnly = (d) => d.toISOString().slice(0, 10);

// ---------- main ----------

async function main() {
  const db = await getDb();
  const services = db.collection("services");
  const bookings = db.collection("bookings");
  const payments = db.collection("payments");

  console.log("Users");
  await ensureUser(db, {
    name: "FixMate Admin",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
  });
  for (const t of TECHNICIANS) {
    await ensureUser(db, {
      name: t.name,
      email: t.email,
      password: USER_PASSWORD,
      role: "technician",
      extra: { phone: t.phone, area: t.area, bio: t.bio },
    });
  }
  for (const c of CUSTOMERS) {
    await ensureUser(db, {
      name: c.name,
      email: c.email,
      password: USER_PASSWORD,
      role: "customer",
      extra: { phone: c.phone, area: c.area },
    });
  }

  console.log("Services");
  const serviceByTitle = {};
  let newServices = 0;
  for (const s of SERVICES) {
    const tech = TECHNICIANS[s.tech];
    const result = await services.updateOne(
      { title: s.title, technicianEmail: tech.email },
      {
        $setOnInsert: {
          title: s.title,
          category: s.category,
          description: s.description,
          image: img(s.title),
          basePrice: s.price,
          estimatedDuration: s.duration,
          serviceMode: s.mode,
          serviceArea: s.area,
          technicianName: tech.name,
          technicianEmail: tech.email,
          approvalStatus: s.status || "approved",
          isAvailable: true,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) newServices++;
    serviceByTitle[s.title] = await services.findOne({
      title: s.title,
      technicianEmail: tech.email,
    });
  }
  console.log(`  ${newServices} new, ${SERVICES.length - newServices} already existed`);

  console.log("Bookings and payments");
  let newBookings = 0;
  let newPayments = 0;

  for (const b of BOOKINGS) {
    const seedKey = `seed-${b.key}`;
    const service = serviceByTitle[b.svc];
    const customer = CUSTOMERS[b.cust];

    let booking = await bookings.findOne({ seedKey });

    if (!booking) {
      const created = new Date(Date.now() - b.daysAgo * dayMs);
      const history = PATHS[b.status].map((status, i) => ({
        status,
        changedAt: new Date(created.getTime() + i * 3 * 60 * 60 * 1000),
      }));
      const isCompleted = b.status === "completed";

      const doc = {
        seedKey,
        serviceId: String(service._id),
        serviceTitle: service.title,
        serviceImage: service.image,
        category: service.category,
        basePrice: service.basePrice,
        technicianName: service.technicianName,
        technicianEmail: service.technicianEmail,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        address: customer.address,
        preferredDate: dateOnly(new Date(created.getTime() + 3 * dayMs)),
        problemDescription: b.problem,
        status: b.status,
        finalAmount: isCompleted ? b.final : service.basePrice,
        paymentStatus: isCompleted && b.paid ? "paid" : "unpaid",
        rating: null,
        review: "",
        statusHistory: history,
        createdAt: created,
      };
      const result = await bookings.insertOne(doc);
      booking = { ...doc, _id: result.insertedId };
      newBookings++;
    }

    if (b.status === "completed" && b.paid) {
      const sessionId = `seed_cs_${b.key}`;
      const result = await payments.updateOne(
        { stripeSessionId: sessionId },
        {
          $setOnInsert: {
            bookingId: String(booking._id),
            serviceTitle: booking.serviceTitle,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            technicianName: booking.technicianName,
            technicianEmail: booking.technicianEmail,
            amount: booking.finalAmount,
            currency: "usd",
            transactionId: `pi_seed_${b.key}`,
            paymentStatus: "paid",
            type: "job",
            paidAt: new Date(Date.now() - (b.daysAgo - 1) * dayMs),
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount) newPayments++;
    }
  }
  console.log(`  ${newBookings} new bookings, ${newPayments} new payments`);

  console.log("\nSeed finished.");
  console.log(`Admin: ${ADMIN_EMAIL}`);
  console.log("Technicians:", TECHNICIANS.map((t) => t.email).join(", "));
  console.log("Customers:", CUSTOMERS.map((c) => c.email).join(", "));
  console.log("(technician/customer password = SEED_USER_PASSWORD from your .env)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nSeed failed:", err.message);
    process.exit(1);
  });