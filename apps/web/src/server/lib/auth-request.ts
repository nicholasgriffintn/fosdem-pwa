import { parseAuthRequest, type AuthRequest } from "@ngriffin_uk/auth-protocol";

export async function readAuthRequest(request: Request): Promise<AuthRequest> {
	const value: unknown = await request.json();
	return parseAuthRequest(value, {
		allowedActions: ["start_oauth", "sign_out"],
	});
}
