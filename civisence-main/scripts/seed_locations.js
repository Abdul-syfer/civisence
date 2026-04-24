
import admin from "firebase-admin";
import { readFile } from "fs/promises";

// Path to your Firebase service account key JSON file
const SERVICE_ACCOUNT_PATH = "./service-account.json";

async function seed() {
    try {
        const serviceAccount = JSON.parse(await readFile(SERVICE_ACCOUNT_PATH, "utf8"));
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        const db = admin.firestore();

        const departments = [
            "Road Maintenance Department",
            "Water Supply Department",
            "Drainage and Sewer Department",
            "Electricity Department",
            "Sanitation Department",
            "Emergency Services",
            "Street Lighting Department",
        ];

        const locations = ["Hosur", "Denkannikottai"];

        console.log("Starting seeding process...");

        for (const loc of locations) {
            console.log(`Seeding authorities for ${loc}...`);
            for (const dept of departments) {
                const docId = `${loc.toLowerCase()}_${dept.toLowerCase().replace(/ /g, "_")}`;
                const officerId = `${loc.substring(0, 3).toUpperCase()}-${dept.substring(0, 3).toUpperCase()}-001`;
                
                const authority = {
                    name: `${loc} ${dept.split(' ')[0]} Officer`,
                    department: dept,
                    ward: loc,
                    officerId: officerId,
                    phone: "0000000000",
                    active: true,
                    resolvedCount: 0,
                    email: `${loc.toLowerCase()}.${dept.toLowerCase().split(' ')[0]}@civicsense.gov`
                };

                await db.collection("authorities").doc(docId).set(authority);
                console.log(`  Added: ${authority.name} (${officerId})`);
            }
        }

        console.log("Seeding complete successfully!");
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error("Error: service-account.json not found. Please place your Firebase service account key at the project root.");
        } else {
            console.error("Seeding error:", error);
        }
    }
}

seed();
