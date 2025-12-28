import { createContext, useContext, type ReactNode } from "react";

import type { SessionUser } from "~/types/auth";

type AuthSnapshot = {
	user: SessionUser | null;
};

const AuthSnapshotContext = createContext<AuthSnapshot>({ user: null });

export function AuthSnapshotProvider({
	user,
	children,
}: {
	user: SessionUser | null;
	children: ReactNode;
}) {
	return (
		<AuthSnapshotContext.Provider value={{ user }}>
			{children}
		</AuthSnapshotContext.Provider>
	);
}

export function useAuthSnapshot() {
	return useContext(AuthSnapshotContext);
}
