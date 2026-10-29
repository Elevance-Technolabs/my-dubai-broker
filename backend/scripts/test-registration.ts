// We can't easily unit test controller without mocking req/res.
// Instead, let's make an integration test using fetch against the running server.
// But we need the server running.

async function testRegistration() {
	const email = `test.company.${Date.now()}@example.com`;
	const password = "password123";
	const companyName = `Test Company ${Date.now()}`;

	console.log("Registering company:", { email, companyName });

	const res = await fetch("http://localhost:5000/api/auth/company/register", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			email,
			password,
			name: "Test User",
			companyName,
			description: "A test company",
			phone: "+1234567890",
		}),
	});

	const data = await res.json();
	console.log("Status:", res.status);
	console.log("Response:", JSON.stringify(data, null, 2));

	if (res.status === 201) {
		console.log("SUCCESS: Company registered.");
	} else {
		console.log("FAILURE: Registration failed.");
		process.exit(1);
	}
}

testRegistration().catch(console.error);
