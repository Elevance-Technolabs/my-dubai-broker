/**
 * DEPRECATED MODULE — Jets and Helicopters are now Private Aviation listings.
 *
 * Use the unified /listings API with:
 *   category: "PRIVATE_AVIATION"
 *   assetType: "JET" | "HELICOPTER" | "TURBOPROP"
 *
 * This file re-exports from the listings service for backward compatibility.
 */

export {
	getPublicListings as getJets,
	getPublicListingById as getJetById,
} from "../listings/listings.service.js";
