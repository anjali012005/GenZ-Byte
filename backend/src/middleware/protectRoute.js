import { clerkClient, requireAuth } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

export const protectRoute = [
    requireAuth(),
    async (req, res, next) => {
        try {
            const clerkId = req.auth().userId;
            
            if(!clerkId) return res.status(401).json({message: "Unauthorized - invalid token"});

            // find user in db by clerk ID
            let user = await User.findOne({ clerkId });

            if(!user) {
                const clerkUser = await clerkClient.users.getUser(clerkId);
                const email = clerkUser.emailAddresses[0]?.emailAddress;
                const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || email || "User";

                if (!email) {
                    return res.status(400).json({message: "User email not found in Clerk"});
                }

                user = await User.create({
                    clerkId,
                    email,
                    name,
                    profileImage: clerkUser.imageUrl || "",
                });

                await upsertStreamUser({
                    id: user.clerkId,
                    name: user.name,
                    image: user.profileImage,
                });
            }

            req.user = user;

            next();
        } catch (error) {
            console.error("Error in protectRoute middleware", error);
            res.status(500).json({message: "Internal Server Error"});
        }
    },
];
