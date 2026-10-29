import app from "./app.js";
import { env } from "./lib/env.js";
import { startUploadCleanupJob } from "./modules/uploads/uploads.service.js";
import { prisma } from "./prisma/client.js";
import { sendSuccess } from "./utils/response.js";

app.get("/", async (_req, res) => {
	const noOfUsers = await prisma.user.count();
	sendSuccess(res, { noOfUsers });
});

app.listen(env.PORT, () => {
	console.log(`Server is running on port ${env.PORT}`);
	startUploadCleanupJob();
});
