import NextAuth from "next-auth";

import { buildAuthOptions } from "../../../../../src/auth/auth.js";

const handler = NextAuth(buildAuthOptions(process.env));

export { handler as GET, handler as POST };
