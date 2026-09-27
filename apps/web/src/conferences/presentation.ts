import type { ReactNode } from "react";
import { conferenceConfig } from "@roomisfull/conference";
import { fosdemImageDetails } from "./fosdem/image-details";
import { fosdemTypeDescriptions } from "./fosdem/type-descriptions";
import { fosdemSpecialRooms } from "./fosdem/special-rooms";

interface ImageDetails {
	alt: string;
	license: string;
	original: string;
	changes?: string;
}
interface SpecialRoom {
	description: (year: number) => ReactNode;
}

const isFosdem = conferenceConfig.id === "fosdem";
export const typeDescriptions: Record<string, string> = isFosdem
	? fosdemTypeDescriptions
	: {};
export const imageDetailsByType: Record<string, ImageDetails> = isFosdem
	? fosdemImageDetails
	: {};
export const specialRooms: Record<string, SpecialRoom> = isFosdem
	? fosdemSpecialRooms
	: {};
