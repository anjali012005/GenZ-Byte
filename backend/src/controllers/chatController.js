import { chatClient, upsertStreamUser } from "../lib/stream.js";
import { ENV } from "../lib/env.js";

export async function getStreamToken(req, res) {
    try {
        await upsertStreamUser({
            id: req.user.clerkId,
            name: req.user.name,
            image: req.user.profileImage,
        });

        //use clerkId for stream 
        const token = chatClient.createToken(req.user.clerkId);

        res.status(200).json({
            token,
            userId: req.user.clerkId,
            userName: req.user.name,
            userImage: req.user.profileImage,
        });
    } catch (error) {
        console.log("Error in getStreamToken controller:", error);
        res.status(500).json({
            message: ENV.NODE_ENV === "development" ? error.message : "Internal Server Error",
        });  
    }
}
