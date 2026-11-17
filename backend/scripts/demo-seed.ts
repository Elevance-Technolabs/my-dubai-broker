/**
 * Demo data: wipes the database down to the super admin, then creates one
 * approved company per category, each with one approved, live listing.
 *
 *   npx tsx --env-file=.env scripts/demo-seed.ts --wipe --backup <file.json>
 *
 * Every table is saved to the backup file before anything is deleted.
 * Quality and rank rules (platform settings) are kept.
 */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { Prisma } from "../generated/prisma/client.js";
import { hashPassword } from "../src/lib/password.js";
import { createPresignedPutUrl } from "../src/lib/r2.js";
import { prisma } from "../src/prisma/client.js";
import { recalculateQuality } from "../src/modules/scoring/quality.service.js";
import { recalculateVisibilityGroup } from "../src/modules/scoring/visibility.service.js";

const args = process.argv.slice(2);
const backupPath = args[args.indexOf("--backup") + 1];
if (!args.includes("--wipe") || !args.includes("--backup") || !backupPath) {
	console.error("Usage: tsx scripts/demo-seed.ts --wipe --backup <file.json>");
	process.exit(1);
}

const SUPER_ADMIN_EMAIL = "super.admin@mdb.com";
const PASSWORD = "admin@123";
const KEEP_TABLES = ["_prisma_migrations", "quality_rules", "rank_rules"];

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?q=80&w=1920&auto=format&fit=crop`;
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// ─── Files in R2: a sample document and a logo per company ───

const sharp = createRequire(import.meta.url)(
	"../../frontend/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp",
);

const put = async (key: string, body: Buffer, contentType: string) => {
	const url = await createPresignedPutUrl(key, contentType, body.length);
	const res = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: new Uint8Array(body) });
	if (!res.ok) throw new Error(`Upload of ${key} failed: ${res.status} ${await res.text()}`);
	return key;
};

/** A one-page PDF that says plainly it is sample data. */
const samplePdf = (title: string, lines: string[]) => {
	const text = [title, "", ...lines, "", "SAMPLE DOCUMENT - DEMO DATA ONLY - NOT A REAL LICENCE"]
		.map((l, i) => `BT /F1 ${i === 0 ? 18 : 12} Tf 72 ${740 - i * 22} Td (${l.replace(/[()\\]/g, "")}) Tj ET`)
		.join("\n");
	const objects = [
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
		`<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
	];
	let pdf = "%PDF-1.4\n";
	const offsets: number[] = [];
	objects.forEach((o, i) => {
		offsets.push(Buffer.byteLength(pdf));
		pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
	});
	const xref = Buffer.byteLength(pdf);
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return Buffer.from(pdf);
};

/** Gold monogram on black, 400x400 PNG. */
const logoPng = (initials: string) =>
	sharp(
		Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
			<rect width="400" height="400" rx="48" fill="#111111"/>
			<rect x="18" y="18" width="364" height="364" rx="36" fill="none" stroke="#C9A24D" stroke-width="4"/>
			<text x="200" y="250" font-family="Georgia, serif" font-size="150" fill="#C9A24D" text-anchor="middle">${initials}</text>
		</svg>`),
	)
		.png()
		.toBuffer() as Promise<Buffer>;

// ─── The demo companies and listings ─────────────────────────

type Doc = { type: string; title: string; number: string; authority: string };
type Demo = {
	key: string;
	email: string;
	ownerName: string;
	phone: string;
	brn?: string;
	company: {
		name: string;
		slug: string;
		initials: string;
		category: "REAL_ESTATE" | "CARS" | "YACHTS" | "PRIVATE_AVIATION";
		description: string;
		address: string;
		languages: string[];
	};
	documents: Doc[];
	ownerBio: string;
	listing: Record<string, any>;
	details: Record<string, any>;
	photos: string[];
};

const DEMOS: Demo[] = [
	{
		key: "realestate",
		email: "realestate.owner@mdb.com",
		ownerName: "Khalid Al Mansoori",
		phone: "+971 50 214 7801",
		brn: "61523",
		company: {
			name: "Azure Crest Realty",
			slug: "azure-crest-realty",
			initials: "AC",
			category: "REAL_ESTATE",
			description:
				"Azure Crest Realty is a RERA-registered brokerage specialising in prime waterfront homes on Palm Jumeirah, Emirates Hills and Dubai Hills Estate. Our advisers handle sales, leasing and off-plan investment for private buyers and family offices, with full support on mortgages, Golden Visa applications and handover.",
			address: "Office 1804, Marina Plaza, Dubai Marina, Dubai, UAE",
			languages: ["English", "Arabic", "Russian"],
		},
		documents: [
			{ type: "trade_license", title: "Trade Licence", number: "1084472", authority: "Dubai Department of Economy and Tourism" },
			{ type: "rera_license", title: "RERA Office Registration", number: "ORN 28451", authority: "Real Estate Regulatory Agency (RERA)" },
		],
		ownerBio:
			"Founder of Azure Crest Realty with 14 years in Dubai prime residential. Khalid has advised on more than AED 2 billion of villa and penthouse transactions on Palm Jumeirah and Emirates Hills.",
		listing: {
			title: "Signature 6-Bedroom Beachfront Villa, Frond G, Palm Jumeirah",
			description:
				"A fully upgraded Signature Villa on the coveted Frond G, set on a 14,000 sq ft plot with 70 metres of private beach and uninterrupted views of the Dubai Marina skyline and the Arabian Gulf.\n\nThe ground floor opens onto a double-height living room, a formal dining room for twelve and a Gaggenau show kitchen with a separate prep kitchen. Floor-to-ceiling glass slides away to a temperature-controlled infinity pool, a shaded majlis and a landscaped garden that leads straight to the sand.\n\nUpstairs are five en-suite bedrooms, including a principal suite with a private terrace, his-and-hers dressing rooms and a marble bathroom with sea views. A sixth bedroom on the ground floor suits guests or staff. The villa also has a home cinema, a gym, an elevator, maid's and driver's rooms and covered parking for four cars.\n\nVacant on transfer. Viewings by appointment only.",
			assetType: "VILLA",
			offeringType: "SALE",
			salePrice: 48_500_000,
			currency: "AED",
			negotiable: true,
			country: "United Arab Emirates",
			city: "Dubai",
			area: "Palm Jumeirah",
			address: "Frond G, Palm Jumeirah, Dubai",
			latitude: 25.1189,
			longitude: 55.1336,
			licenseNumber: "7148302915",
			internalReferenceCode: "ACR-PJ-0612",
		},
		details: {
			propertyType: "Villa",
			emirate: "Dubai",
			community: "Palm Jumeirah",
			building: "Signature Villas, Frond G",
			permitNumber: "7148302915",
			bedrooms: 6,
			bathrooms: 7,
			builtUpArea: 10_500,
			plotArea: 14_000,
			floor: 0,
			totalFloors: 2,
			parking: 4,
			furnished: true,
			completionStatus: "ready",
			developer: "Nakheel",
			paymentPlan: "Cash or mortgage. 10% deposit on signing the MOU, balance on transfer at the Dubai Land Department.",
			serviceCharge: 52_500,
			views: ["Sea", "Dubai Marina skyline", "Burj Al Arab"],
			outdoor: ["Private beach", "Infinity pool", "Landscaped garden", "Shaded majlis", "Outdoor kitchen"],
			indoor: ["Home cinema", "Gym", "Elevator", "Walk-in closets", "Maid's room", "Driver's room"],
			communityFeatures: ["24/7 security", "Gated frond", "Close to Nakheel Mall", "Marina access"],
			amenities: ["Smart home system", "Central A/C", "Water filtration", "Backup generator"],
			propertyTags: ["Beachfront", "Fully upgraded", "Vacant on transfer"],
		},
		photos: [
			"1613490493576-7fde63acd811",
			"1613977257365-aaae5a9817ff",
			"1613545325278-f24b0cae1224",
			"1683629357963-adf2b1fa9ad9",
			"1638284556849-1848ec7beb4a",
		],
	},
	{
		key: "car",
		email: "car.owner@mdb.com",
		ownerName: "Rashid Haddad",
		phone: "+971 55 318 6402",
		company: {
			name: "Velocity Prestige Motors",
			slug: "velocity-prestige-motors",
			initials: "VP",
			category: "CARS",
			description:
				"Velocity Prestige Motors is a pre-owned luxury and performance car dealer on Sheikh Zayed Road. Every car is GCC-spec or fully converted, inspected on 200 points and sold with a clear service history. We arrange financing, export, insurance and RTA registration in-house.",
			address: "Showroom 7, Al Quoz Industrial Area 1, Sheikh Zayed Road, Dubai, UAE",
			languages: ["English", "Arabic", "Hindi"],
		},
		documents: [
			{ type: "car_trade_license", title: "Trade Licence - Motor Vehicle Trading", number: "1129305", authority: "Dubai Department of Economy and Tourism" },
			{ type: "car_dealer_license", title: "Used Car Dealer Licence", number: "RTA-UCD-55184", authority: "Roads and Transport Authority (RTA)" },
			{ type: "showroom_registration", title: "Showroom Registration", number: "SR-2021-0417", authority: "Dubai Municipality" },
		],
		ownerBio:
			"Rashid has sold luxury and collector cars in Dubai since 2010 and founded Velocity Prestige Motors in 2016. He specialises in Rolls-Royce, Bentley and Ferrari.",
		listing: {
			title: "2024 Rolls-Royce Cullinan Black Badge, GCC Spec, Under Warranty",
			description:
				"A one-owner 2024 Rolls-Royce Cullinan Black Badge in Black Diamond with a Black and Mandarin leather interior, supplied new by the official UAE dealer.\n\nThe 6.75-litre twin-turbo V12 makes 592 hp and 900 Nm. Options include the Starlight headliner with shooting stars, the Viewing Suite, the Bespoke Audio system, rear theatre configuration, Night Vision and 22-inch forged Black Badge wheels.\n\nThe car has covered 6,200 km, has a full service history at the dealer and remains under the manufacturer warranty and service package until March 2028. Paint protection film and ceramic coating were applied from new.\n\nFinancing and export available. Inspection welcome at our showroom.",
			assetType: "SUV",
			offeringType: "SALE",
			salePrice: 1_595_000,
			currency: "AED",
			negotiable: true,
			country: "United Arab Emirates",
			city: "Dubai",
			area: "Al Quoz",
			address: "Showroom 7, Al Quoz Industrial Area 1, Dubai",
			latitude: 25.1425,
			longitude: 55.2268,
			licenseNumber: "RTA-UCD-55184",
			internalReferenceCode: "VPM-RR-2407",
		},
		details: {
			make: "Rolls-Royce",
			model: "Cullinan",
			variant: "Black Badge",
			year: 2024,
			mileage: 6_200,
			condition: "Like New",
			bodyType: "SUV",
			transmission: "Automatic",
			fuelType: "Petrol",
			engineSize: "6.75L twin-turbo V12",
			horsepower: 592,
			exteriorColor: "Black Diamond",
			interiorColor: "Black and Mandarin leather",
			doors: 4,
			seats: 5,
			regionalSpec: "GCC",
			warranty: true,
			serviceHistory: true,
			registrationYear: 2024,
			plateNumber: "Dubai P 48217",
			chassisNumber: "SCATV4C04RU212345",
			options: [
				"Starlight headliner",
				"Viewing Suite",
				"Bespoke Audio",
				"Rear theatre configuration",
				"Night Vision",
				"22-inch forged wheels",
				"Massage seats",
				"Paint protection film",
			],
		},
		photos: [
			"1687634366100-547fd24324f1",
			"1760413452048-19700bc898ea",
			"1760413451905-3f082abc2f48",
			"1760413452902-8d9da07f61d7",
			"1581966451257-a5c7c5afa833",
		],
	},
	{
		key: "yacht",
		email: "yacht.owner@mdb.com",
		ownerName: "Marco Bellini",
		phone: "+971 52 447 9013",
		company: {
			name: "Blue Meridian Yachts",
			slug: "blue-meridian-yachts",
			initials: "BM",
			category: "YACHTS",
			description:
				"Blue Meridian Yachts is a yacht brokerage based at Dubai Harbour, handling sales, central agency and new-build projects for yachts from 20 to 60 metres. Our team covers survey, sea trial, registration with the Dubai Maritime Authority and crew placement.",
			address: "Unit 12, Dubai Harbour Yacht Club, Dubai Harbour, Dubai, UAE",
			languages: ["English", "Arabic", "Italian"],
		},
		documents: [
			{ type: "marine_trade_license", title: "Marine Trade Licence", number: "1156720", authority: "Dubai Department of Economy and Tourism" },
			{ type: "boat_dealer_certificate", title: "Boat Dealer Certificate", number: "DMA-BD-3381", authority: "Dubai Maritime Authority" },
		],
		ownerBio:
			"Marco spent 12 years with an Italian shipyard before founding Blue Meridian Yachts in Dubai. He has brokered more than 80 yachts across the Gulf and the Mediterranean.",
		listing: {
			title: "2019 Azimut Grande 27 Metri, Fresh Refit, Dubai Harbour",
			description:
				"A beautifully kept 2019 Azimut Grande 27 Metri, privately owned and lying at Dubai Harbour. She completed a full refit in 2025 including new upholstery, teak deck restoration and fresh antifouling.\n\nThe main deck has a wide saloon with panoramic windows, a formal dining area and a forward galley. Below deck are four en-suite cabins for eight guests: a full-beam master, a VIP forward and two twins. Crew quarters sleep four.\n\nShe is powered by twin MAN V12 engines of 1,800 hp each, cruising at 24 knots with a top speed of 28 knots. Seakeeper gyro stabilisers keep her steady at anchor. The flybridge has a jacuzzi, a wet bar and sun pads; the tender garage holds a Williams tender and a jet ski.\n\nUAE-flagged, RINA classed, with complete maintenance records. Sea trial available on request.",
			assetType: "MOTOR_YACHT",
			offeringType: "SALE",
			salePrice: 19_750_000,
			currency: "AED",
			negotiable: true,
			country: "United Arab Emirates",
			city: "Dubai",
			area: "Dubai Harbour",
			address: "Dubai Harbour Marina, Dubai",
			latitude: 25.0921,
			longitude: 55.1428,
			operatingBase: "Dubai Harbour Marina",
			licenseNumber: "DMA-BD-3381",
			internalReferenceCode: "BMY-AZ27-019",
		},
		details: {
			builder: "Azimut",
			model: "Grande 27 Metri",
			year: 2019,
			lengthFt: 88.6,
			beamFt: 21.3,
			draftFt: 6.9,
			hullMaterial: "GRP with carbon fibre superstructure",
			cabins: 4,
			guestCapacity: 8,
			crewCapacity: 4,
			crewIncluded: true,
			engineHours: 1_450,
			engines: "2 x MAN V12 1,800 hp",
			flag: "UAE",
			registrationNumber: "DXB-M-48213",
			classification: "RINA",
			navigation: ["Raymarine radar", "Twin Garmin chartplotters", "Autopilot", "AIS", "Satellite compass", "Night vision camera"],
			amenities: ["Flybridge jacuzzi", "Seakeeper stabilisers", "Tender garage", "Jet ski", "Starlink internet", "Wet bar"],
			charterAvailability: "Private sale only, not offered for charter",
			homePort: "Dubai Harbour Marina",
		},
		photos: [
			"1567899378494-47b22a2ae96a",
			"1605281317010-fe5ffe798166",
			"1785695583677-bb6cf19e274e",
			"1697124510322-27ef594f67fd",
			"1697207340462-c9eac5047014",
		],
	},
	{
		key: "jet",
		email: "jet.owner@mdb.com",
		ownerName: "Sarah Whitfield",
		phone: "+971 56 902 3375",
		company: {
			name: "Skyline Jet Partners",
			slug: "skyline-jet-partners",
			initials: "SJ",
			category: "PRIVATE_AVIATION",
			description:
				"Skyline Jet Partners is an aircraft sales and acquisition firm at Dubai South, representing buyers and sellers of large-cabin business jets across the Middle East, Europe and Asia. We manage pre-purchase inspections, escrow, registration and delivery.",
			address: "Office 305, Executive Business Aviation Terminal, Dubai South, Dubai, UAE",
			languages: ["English", "Arabic", "French"],
		},
		documents: [
			{ type: "aviation_dealer_license", title: "Aircraft Trading Licence", number: "DWC-AT-2271", authority: "Dubai Aviation City Corporation" },
			{ type: "aoc_operator_document", title: "Air Operator Certificate (partner operator)", number: "AOC-UAE-0193", authority: "General Civil Aviation Authority (GCAA)" },
		],
		ownerBio:
			"Sarah is a former corporate pilot and has been selling business jets for 15 years. She leads acquisitions for family offices and corporate flight departments across the Gulf.",
		listing: {
			title: "2017 Gulfstream G650ER, Low Hours, Fully Enrolled",
			description:
				"A low-time 2017 Gulfstream G650ER with 2,140 hours since new, flown privately by one owner and maintained to the highest standard.\n\nThe 14-seat cabin is laid out in three zones: a forward four-seat club, a mid-cabin conference and dining group, and an aft stateroom with a divan that converts to a full bed. It sleeps six. The galley is fully equipped, and the cabin has Ka-band high-speed connectivity and the Gulfstream Cabin Management System.\n\nWith a range of 7,500 nautical miles at Mach 0.85, she flies Dubai to New York or Los Angeles non-stop. Engines are enrolled on Rolls-Royce CorporateCare and the airframe on Gulfstream PlaneParts. The 72-month inspection was completed in 2023 at the Gulfstream service centre. No damage history.\n\nBased at Al Maktoum International. Records available to qualified buyers after an NDA.",
			assetType: "JET",
			offeringType: "SALE",
			salePrice: 46_500_000,
			currency: "USD",
			negotiable: true,
			country: "United Arab Emirates",
			city: "Dubai",
			area: "Dubai South",
			address: "Al Maktoum International Airport (DWC), Dubai South",
			latitude: 24.8964,
			longitude: 55.1611,
			operatingBase: "Al Maktoum International Airport (DWC)",
			licenseNumber: "DWC-AT-2271",
			internalReferenceCode: "SJP-G650ER-6278",
		},
		details: {
			manufacturer: "Gulfstream",
			model: "G650ER",
			year: 2017,
			serialNumber: "6278",
			registrationTail: "A6-SJP",
			totalHours: 2_140,
			engineHours: 2_140,
			passengerCapacity: 14,
			rangeNm: 7_500,
			avionics: "Honeywell PlaneView II, Synthetic Vision, EVS II, head-up display, dual FMS, TCAS II, ADS-B Out",
			interiorConfig: "14 seats in three zones, sleeps 6",
			interiorDetails: "Forward club seating, mid-cabin conference and dining group, aft stateroom with a convertible divan, full galley, Ka-band Wi-Fi, cabin management system.",
			maintenanceHistory: "One owner. Rolls-Royce CorporateCare and Gulfstream PlaneParts enrolled. 72-month inspection completed 2023. No damage history.",
			lastInspectionDate: new Date("2026-03-12"),
		},
		photos: [
			"1684838200815-36eef38f353c",
			"1684838200888-192e2a163cc9",
			"1772354967311-167285eaa5f5",
			"1772354838120-a78234bf7316",
			"1772354852092-0685c2bf32b2",
		],
	},
	{
		key: "helicopter",
		email: "helicopter.owner@mdb.com",
		ownerName: "Ahmed Al Falasi",
		phone: "+971 50 776 1290",
		company: {
			name: "Falcon Rotor Aviation",
			slug: "falcon-rotor-aviation",
			initials: "FR",
			category: "PRIVATE_AVIATION",
			description:
				"Falcon Rotor Aviation operates private helicopter charters and sightseeing flights across the UAE, from Dubai to Abu Dhabi, Ras Al Khaimah and the Hajar Mountains. Our fleet of Airbus helicopters is flown by experienced GCAA-licensed pilots.",
			address: "Hangar 4, Dubai Creek Heliport, Al Jaddaf, Dubai, UAE",
			languages: ["English", "Arabic"],
		},
		documents: [
			{ type: "aviation_dealer_license", title: "Commercial Aviation Licence", number: "DXB-AV-4410", authority: "Dubai Department of Economy and Tourism" },
			{ type: "aoc_operator_document", title: "Air Operator Certificate", number: "AOC-UAE-0257", authority: "General Civil Aviation Authority (GCAA)" },
		],
		ownerBio:
			"Ahmed is a GCAA-licensed helicopter pilot with more than 6,000 flight hours. He founded Falcon Rotor Aviation to offer private, discreet rotor charters across the UAE.",
		listing: {
			title: "Airbus H130 Private Charter, Dubai Skyline and Palm Tours",
			description:
				"Charter our 2021 Airbus H130 T2 for private flights over Dubai or point-to-point transfers across the UAE. The H130 has the widest cabin in its class and floor-to-ceiling windows, so every passenger gets an unobstructed view.\n\nPopular routes include the Palm Jumeirah, Burj Al Arab and Burj Khalifa skyline tour (25 minutes), Dubai to Abu Dhabi transfers (45 minutes), and private flights to the Hajar Mountains and Ras Al Khaimah.\n\nThe cabin seats six in leather seats with noise-cancelling headsets. Flights depart from Dubai Creek Heliport, or from hotel and private helipads by arrangement. All flights are flown by two GCAA-licensed pilots.\n\nPrice is per flight hour for the whole helicopter. Landing fees and permits are quoted with each booking.",
			assetType: "HELICOPTER",
			offeringType: "CHARTER",
			charterRate: 9_500,
			currency: "AED",
			negotiable: false,
			country: "United Arab Emirates",
			city: "Dubai",
			area: "Al Jaddaf",
			address: "Dubai Creek Heliport, Al Jaddaf, Dubai",
			latitude: 25.2186,
			longitude: 55.3329,
			operatingBase: "Dubai Creek Heliport",
			licenseNumber: "AOC-UAE-0257",
			internalReferenceCode: "FRA-H130-8612",
		},
		details: {
			manufacturer: "Airbus",
			model: "H130 T2",
			year: 2021,
			serialNumber: "8612",
			registrationTail: "A6-FRA",
			totalHours: 980,
			engineHours: 980,
			passengerCapacity: 6,
			rangeNm: 330,
			avionics: "Garmin G500H TXi, helicopter terrain awareness (HTAWS), dual GPS, weather radar",
			interiorConfig: "6 passengers, forward-facing panoramic cabin",
			interiorDetails: "Wide cabin with floor-to-ceiling windows, leather seats, Bose noise-cancelling headsets, air conditioning.",
			maintenanceHistory: "Maintained by an Airbus-approved centre. 600-hour inspection completed August 2026. No incident history.",
			lastInspectionDate: new Date("2026-08-20"),
		},
		photos: [
			"1792838648647-a1b530e98c7e",
			"1792838648670-f52b89294b87",
			"1792838649071-c52decc685a6",
			"1772965490916-348cb87597a3",
			"1656994865114-bff5b906522d",
		],
	},
];

const PUBLIC_REF_PREFIX: Record<string, string> = {
	REAL_ESTATE: "RE",
	CARS: "CR",
	YACHTS: "YT",
	PRIVATE_AVIATION: "AV",
};

// ─── 1. Backup ────────────────────────────────────────────────

const backup = async () => {
	const tables = await prisma.$queryRaw<{ tablename: string }[]>`
		SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
	const out: Record<string, unknown[]> = {};
	for (const { tablename } of tables) {
		out[tablename] = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."${tablename}"`);
	}
	writeFileSync(
		backupPath,
		JSON.stringify(out, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 1),
	);
	const counts = Object.entries(out)
		.filter(([, rows]) => rows.length)
		.map(([t, rows]) => `${t}=${rows.length}`)
		.join(", ");
	console.log(`Backup saved to ${backupPath}\n  ${counts}`);
	return tables.map((t) => t.tablename);
};

// ─── 2. Wipe (keep the super admin) ───────────────────────────

const wipe = async (tables: string[]) => {
	const admin = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } });
	if (!admin) throw new Error(`${SUPER_ADMIN_EMAIL} not found; stopping before deleting anything.`);
	const adminAccounts = await prisma.account.findMany({ where: { userId: admin.id } });
	if (!adminAccounts.some((a) => a.providerId === "credential" && a.password)) {
		throw new Error("Super admin has no password account; stopping before deleting anything.");
	}

	const toTruncate = tables.filter((t) => !KEEP_TABLES.includes(t)).map((t) => `"public"."${t}"`);
	await prisma.$transaction(async (tx) => {
		await tx.$executeRawUnsafe(`TRUNCATE TABLE ${toTruncate.join(", ")} CASCADE`);
		const { permissions, companyId: _c, ...rest } = admin;
		await tx.user.create({
			data: { ...rest, companyId: null, permissions: permissions ?? Prisma.JsonNull },
		});
		for (const account of adminAccounts) await tx.account.create({ data: account });
	});
	console.log(`Wiped ${toTruncate.length} tables; kept ${SUPER_ADMIN_EMAIL} and the scoring rules.`);
	return admin.id;
};

// ─── 3. Seed ──────────────────────────────────────────────────

/** Uploads logos and documents first, so a storage problem stops the run before anything is deleted. */
const prepareFiles = async () => {
	const files = new Map<string, { logoKey: string; docKeys: string[] }>();
	for (const demo of DEMOS) {
		const c = demo.company;
		const logoKey = await put(`seed/logos/${c.slug}.png`, await logoPng(c.initials), "image/png");
		const docKeys: string[] = [];
		for (const doc of demo.documents) {
			const pdf = samplePdf(doc.title, [
				`Company: ${c.name}`,
				`Number: ${doc.number}`,
				`Issued by: ${doc.authority}`,
				"Valid until: 15 March 2027",
			]);
			docKeys.push(await put(`seed/documents/${c.slug}-${doc.type}.pdf`, pdf, "application/pdf"));
		}
		files.set(demo.key, { logoKey, docKeys });
	}
	console.log("Logos and documents uploaded to R2.");
	return files;
};

const seed = async (adminId: string, files: Awaited<ReturnType<typeof prepareFiles>>) => {
	const passwordHash = await hashPassword(PASSWORD);
	const refCounter: Record<string, number> = {};

	for (const demo of DEMOS) {
		const c = demo.company;
		const userId = `user_${demo.key}_owner`;

		const { logoKey, docKeys } = files.get(demo.key)!;

		const companyCreated = daysAgo(30);
		const companyApproved = daysAgo(27);
		const submitted = daysAgo(6);
		const approved = daysAgo(5);
		const prefix = `MDB-${PUBLIC_REF_PREFIX[c.category]}-`;
		refCounter[prefix] = (refCounter[prefix] ?? 0) + 1;
		const publicRef = `${prefix}${String(refCounter[prefix]).padStart(5, "0")}`;

		await prisma.$transaction(async (tx) => {
			const company = await tx.company.create({
				data: {
					createdAt: companyCreated,
					name: c.name,
					slug: c.slug,
					description: c.description,
					address: c.address,
					contactEmail: demo.email,
					contactPhone: demo.phone,
					languages: c.languages,
					categories: [c.category],
					companyLogoUrl: logoKey,
					listingLogoUrl: logoKey,
					coverImageUrl: photo(demo.photos[0]!),
					status: "APPROVED",
					onboardingStep: "COMPLETED",
					onboardingCompletedAt: companyCreated,
					officeHoursStart: "09:00",
					officeHoursEnd: "19:00",
					timezone: "Asia/Dubai",
					leadSlaMinutes: 30,
					documents: {
						create: demo.documents.map((doc, i) => ({
							createdAt: companyCreated,
							category: c.category,
							documentType: doc.type,
							fileUrl: docKeys[i]!,
							status: "VALID",
							documentNumber: doc.number,
							issuingAuthority: doc.authority,
							issueDate: new Date("2026-03-15"),
							expiryDate: new Date("2027-03-15"),
							reviewedAt: companyApproved,
							reviewedById: adminId,
						})),
					},
				},
			});

			await tx.user.create({
				data: {
					id: userId,
					createdAt: companyCreated,
					name: demo.ownerName,
					email: demo.email,
					emailVerified: true,
					role: "company_owner",
					companyId: company.id,
					phone: demo.phone,
					brn: demo.brn,
				},
			});
			await tx.account.create({
				data: {
					id: `account_${userId}`,
					userId,
					accountId: userId,
					providerId: "credential",
					password: passwordHash,
				},
			});
			await tx.agentProfile.create({
				data: {
					userId,
					displayName: demo.ownerName,
					bio: demo.ownerBio,
					phone: demo.phone,
					whatsapp: demo.phone,
					email: demo.email,
					languages: c.languages,
					specialities: [c.category],
					credentials: demo.brn
						? [{ category: c.category, credentialType: "BRN", credentialNumber: demo.brn, expiryDate: "2027-03-15" }]
						: [],
					showEmail: true,
				},
			});

			await tx.statusHistory.createMany({
				data: [
					{ createdAt: companyCreated, entityType: "company", entityId: company.id, companyId: company.id, fromStatus: "DRAFT", toStatus: "SUBMITTED", actorId: userId, reason: "Onboarding completed" },
					{ createdAt: companyApproved, entityType: "company", entityId: company.id, companyId: company.id, fromStatus: "SUBMITTED", toStatus: "APPROVED", actorId: adminId, reason: "Documents verified" },
				],
			});

			const l = demo.listing;
			const listing = await tx.listing.create({
				data: {
					createdAt: submitted,
					title: l.title,
					slug: `${c.slug}-${publicRef.toLowerCase()}`,
					publicRef,
					description: l.description,
					category: c.category,
					assetType: l.assetType,
					offeringType: l.offeringType,
					salePrice: l.salePrice != null ? new Prisma.Decimal(l.salePrice) : undefined,
					charterRate: l.charterRate != null ? new Prisma.Decimal(l.charterRate) : undefined,
					currency: l.currency,
					negotiable: l.negotiable,
					country: l.country,
					city: l.city,
					area: l.area,
					address: l.address,
					latitude: l.latitude,
					longitude: l.longitude,
					operatingBase: l.operatingBase,
					coverImageUrl: photo(demo.photos[0]!),
					photoUrls: demo.photos.map(photo),
					videoUrl: l.videoUrl,
					licenseNumber: l.licenseNumber,
					internalReferenceCode: l.internalReferenceCode,
					primaryEmail: demo.email,
					primaryPhone: demo.phone,
					approvalStatus: "APPROVED",
					publicationStatus: "LIVE",
					submittedAt: submitted,
					reviewedAt: approved,
					reviewedById: adminId,
					publishedAt: approved,
					expiresAt: new Date(approved.getTime() + 180 * 24 * 60 * 60 * 1000),
					companyId: company.id,
					creatorId: userId,
				},
			});

			const detailData = { listingId: listing.id, ...demo.details } as any;
			if (c.category === "REAL_ESTATE") await tx.realEstateListing.create({ data: detailData });
			else if (c.category === "CARS") await tx.carListing.create({ data: detailData });
			else if (c.category === "YACHTS") await tx.yachtListing.create({ data: detailData });
			else await tx.privateAviationListing.create({ data: detailData });

			await tx.availability.create({
				data: {
					listingId: listing.id,
					isAvailable: true,
					confirmedAt: approved,
					nextConfirmDue: new Date(approved.getTime() + 30 * 24 * 60 * 60 * 1000),
				},
			});
			await tx.statusHistory.createMany({
				data: [
					{ createdAt: submitted, entityType: "listing", entityId: listing.id, listingId: listing.id, fromStatus: "", toStatus: "DRAFT", actorId: userId, reason: "Listing created" },
					{ createdAt: submitted, entityType: "listing", entityId: listing.id, listingId: listing.id, fromStatus: "DRAFT", toStatus: "SUBMITTED", actorId: userId },
					{ createdAt: approved, entityType: "listing", entityId: listing.id, listingId: listing.id, fromStatus: "SUBMITTED", toStatus: "APPROVED", actorId: adminId },
				],
			});
			await tx.approvalReview.create({
				data: { createdAt: approved, listingId: listing.id, reviewerId: adminId, decision: "APPROVED" },
			});
			await tx.auditLog.create({
				data: {
					createdAt: approved,
					actorId: adminId,
					companyId: company.id,
					action: "listing.approval.approved",
					entityType: "listing",
					entityId: listing.id,
					previousValue: { approvalStatus: "SUBMITTED" },
					newValue: { approvalStatus: "APPROVED" },
				},
			});
		});
		console.log(`  ${c.name} (${demo.email}) + listing ${publicRef}`);
	}

	// Scores, as the app computes them after approval.
	const listings = await prisma.listing.findMany({ select: { id: true, category: true, offeringType: true } });
	for (const l of listings) await recalculateQuality(l.id);
	const groups = new Set(listings.map((l) => `${l.category}|${l.offeringType}`));
	for (const g of groups) {
		const [category, offeringType] = g.split("|");
		await recalculateVisibilityGroup(category!, offeringType!);
	}
	console.log(`Scored ${listings.length} listings.`);
};

const main = async () => {
	const files = await prepareFiles();
	const tables = await backup();
	const adminId = await wipe(tables);
	await seed(adminId, files);
};

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
