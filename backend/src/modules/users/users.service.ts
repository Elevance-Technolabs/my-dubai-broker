import { CompanyStatus, UserRole } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";

type VerificationStatus = CompanyStatus;

export class UsersService {
	async getSellers() {
		const sellers = await prisma.user.findMany({
			where: {
				role: { in: [UserRole.company_owner, UserRole.agent] },
			},
			include: {
				company: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return sellers.map((seller) => ({
			id: seller.id,
			name: seller.name,
			email: seller.email,
			phone: seller.phone,
			role: seller.role,
			status: seller.company?.status ?? CompanyStatus.PENDING_REVIEW,
			rejectionReason: seller.company?.rejectionReason ?? null,
			createdAt: seller.createdAt,
		}));
	}

	async updateSellerVerification(
		userId: string,
		status: VerificationStatus,
		rejectionReason?: string,
	) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: { company: true },
		});

		if (!user) {
			throw new Error("User not found");
		}

		if (user.role !== UserRole.company_owner && user.role !== UserRole.agent) {
			throw new Error("User is not a seller");
		}

		if (!user.companyId) {
			throw new Error("Seller is not associated with a company");
		}

		const company = await prisma.company.update({
			where: { id: user.companyId },
			data: {
				status,
				rejectionReason:
					status === CompanyStatus.REJECTED ? (rejectionReason ?? null) : null,
			},
		});

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			status: company.status,
			rejectionReason: company.rejectionReason,
		};
	}
}

export const usersService = new UsersService();
