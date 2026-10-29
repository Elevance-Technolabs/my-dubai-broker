import { prisma } from "../../prisma/client.js";
import { withAttachedUploads } from "../uploads/uploads.service.js";

export const getMyProfile = async (userId: string) => {
	const [user, profile] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true, email: true, phone: true, role: true, brn: true, image: true },
		}),
		prisma.agentProfile.findUnique({ where: { userId } }),
	]);

	return { user, profile };
};

export interface UpdateProfileInput {
	displayName?: string;
	bio?: string;
	photoUploadId?: string;
	phone?: string;
	whatsapp?: string;
	email?: string;
	languages?: string[];
	specialities?: string[];
	showPhone?: boolean;
	showWhatsapp?: boolean;
	showEmail?: boolean;
}

export const updateMyProfile = async (userId: string, data: UpdateProfileInput) => {
	const { photoUploadId, ...rest } = data;

	return withAttachedUploads(
		userId,
		photoUploadId ? [photoUploadId] : undefined,
		async (tx, keys) => {
			return tx.agentProfile.upsert({
				where: { userId },
				create: { userId, ...rest, ...(keys[0] ? { photoUrl: keys[0] } : {}) } as any,
				update: { ...rest, ...(keys[0] ? { photoUrl: keys[0] } : {}) } as any,
			});
		},
	);
};
